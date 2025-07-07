from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Optional
import json

from database import ArticleService, SettingsService, init_database
from scraper import scrape_article
from summarizer import summarize_text

load_dotenv()

app = FastAPI(title="JH Knowledge Base", version="1.0.0")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for React frontend
if os.path.exists("static_frontend"):
    app.mount("/static", StaticFiles(directory="static_frontend/static"), name="static")
elif os.path.exists("../frontend/build"):
    app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")

@app.get("/")
async def read_root():
    if os.path.exists("static_frontend/index.html"):
        return FileResponse("static_frontend/index.html")
    elif os.path.exists("../frontend/build/index.html"):
        return FileResponse("../frontend/build/index.html")
    return {"message": "JH Knowledge Base API"}

@app.get("/manifest.json")
@app.head("/manifest.json")
async def get_manifest():
    if os.path.exists("static_frontend/manifest.json"):
        return FileResponse("static_frontend/manifest.json", media_type="application/json")
    elif os.path.exists("../frontend/build/manifest.json"):
        return FileResponse("../frontend/build/manifest.json", media_type="application/json")
    return {"error": "Manifest not found"}

@app.get("/favicon.ico")
async def get_favicon():
    if os.path.exists("static_frontend/favicon.ico"):
        return FileResponse("static_frontend/favicon.ico")
    elif os.path.exists("../frontend/build/favicon.ico"):
        return FileResponse("../frontend/build/favicon.ico")
    return {"error": "Favicon not found"}

@app.get("/logo192.png")
async def get_logo192():
    if os.path.exists("static_frontend/logo192.png"):
        return FileResponse("static_frontend/logo192.png")
    elif os.path.exists("../frontend/build/logo192.png"):
        return FileResponse("../frontend/build/logo192.png")
    return {"error": "Logo not found"}

@app.get("/logo512.png")
async def get_logo512():
    if os.path.exists("static_frontend/logo512.png"):
        return FileResponse("static_frontend/logo512.png")
    elif os.path.exists("../frontend/build/logo512.png"):
        return FileResponse("../frontend/build/logo512.png")
    return {"error": "Logo not found"}

@app.get("/robots.txt")
async def get_robots():
    if os.path.exists("static_frontend/robots.txt"):
        return FileResponse("static_frontend/robots.txt")
    elif os.path.exists("../frontend/build/robots.txt"):
        return FileResponse("../frontend/build/robots.txt")
    return {"error": "Robots.txt not found"}

@app.get("/api/articles")
async def get_articles(search: Optional[str] = None):
    try:
        articles = ArticleService.get_articles(search=search)
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/articles")
async def create_article(article_data: dict):
    try:
        url = article_data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        print(f"Starting article creation for URL: {url}")
        
        # Scrape the article
        print("Starting web scraping...")
        try:
            scraped_data = scrape_article(url)
            print(f"Scraping successful. Title: {scraped_data['title'][:50]}...")
        except Exception as scrape_error:
            print(f"Scraping failed: {str(scrape_error)}")
            raise HTTPException(status_code=500, detail=f"Failed to scrape article: {str(scrape_error)}")
        
        # Get summarization prompt from settings
        print("Getting settings...")
        prompt = SettingsService.get_setting("summarization_prompt")
        if not prompt:
            prompt = "Summarize the following article in a clear, concise manner:"
        
        # Generate summary
        print("Starting AI summarization...")
        try:
            summary = summarize_text(scraped_data["full_text"], prompt)
            print(f"Summarization successful. Length: {len(summary)} chars")
        except Exception as ai_error:
            print(f"AI summarization failed: {str(ai_error)}")
            raise HTTPException(status_code=500, detail=f"AI summarization failed: {str(ai_error)}")
        
        # Create article object
        print("Creating article object...")
        create_data = {
            "title": scraped_data["title"],
            "publication_name": scraped_data["publication_name"],
            "full_text": scraped_data["full_text"],
            "summary": summary,
            "url": url,
            "date_added": datetime.now(),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert into database
        print("Saving to database...")
        article = ArticleService.create_article(create_data)
        
        print("Article creation completed successfully")
        return article
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        # Handle duplicate URL specifically
        if str(e).startswith("DUPLICATE_URL:"):
            article_id = str(e).split(":")[1]
            raise HTTPException(
                status_code=409, 
                detail=f"An article with this URL already exists in your knowledge base. View it here: /article/{article_id}"
            )
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/articles/{article_id}")
async def get_article(article_id: str):
    try:
        print(f"Getting article with ID: {article_id}")
        
        article = ArticleService.get_article_by_id(article_id)
        
        if not article:
            print(f"Article not found for ID: {article_id}")
            raise HTTPException(status_code=404, detail="Article not found")
        
        print(f"Returning article: {article.get('title', 'No title')}")
        return article
    except Exception as e:
        print(f"Error getting article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/articles/{article_id}")
async def update_article(article_id: str, article_data: dict):
    try:
        print(f"Updating article with ID: {article_id}")
        print(f"Update data: {article_data}")
        
        update_data = {"updated_at": datetime.now()}
        if "summary" in article_data:
            update_data["summary"] = article_data["summary"]
        
        success = ArticleService.update_article(article_id, update_data)
        
        if not success:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"message": "Article updated successfully"}
    except Exception as e:
        print(f"Error updating article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/articles/{article_id}")
async def delete_article(article_id: str):
    try:
        print(f"Deleting article with ID: {article_id}")
        
        success = ArticleService.delete_article(article_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"message": "Article deleted successfully"}
    except Exception as e:
        print(f"Error deleting article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings():
    try:
        prompt = SettingsService.get_setting("summarization_prompt")
        if not prompt:
            # Create default settings
            default_prompt = "Summarize the following article in a clear, concise manner:"
            SettingsService.set_setting("summarization_prompt", default_prompt)
            return {"summarization_prompt": default_prompt}
        
        return {"summarization_prompt": prompt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings")
async def update_settings(settings_data: dict):
    try:
        prompt = settings_data.get("summarization_prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Summarization prompt is required")
        
        success = SettingsService.set_setting("summarization_prompt", prompt)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update settings")
        
        return {"message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export")
async def export_articles():
    try:
        articles = ArticleService.get_articles(limit=1000)  # Get all articles
        
        export_data = {
            "export_date": datetime.now().isoformat(),
            "total_articles": len(articles),
            "articles": articles
        }
        
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/test-database")
async def test_database_connection():
    """Test endpoint to verify database functionality"""
    try:
        print("=== TESTING DATABASE CONNECTION ===")
        
        # Test basic database operations
        articles = ArticleService.get_articles()
        settings = SettingsService.get_setting("summarization_prompt")
        
        return {
            "database_type": "PostgreSQL",
            "connection_successful": True,
            "message": "Database is ready",
            "stats": {
                "total_articles": len(articles),
                "settings_available": settings is not None
            }
        }
    except Exception as e:
        print(f"Database test failed: {str(e)}")
        return {
            "database_type": "PostgreSQL",
            "connection_successful": False,
            "error": str(e)
        }

# Catch-all route for React Router (must be last)
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # Serve React app for all other routes  
    if os.path.exists("static_frontend/index.html"):
        return FileResponse("static_frontend/index.html")
    elif os.path.exists("../frontend/build/index.html"):
        return FileResponse("../frontend/build/index.html")
    return {"message": "JH Knowledge Base API"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)