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
from enhanced_scraper import scrape_article_enhanced
from summarizer import summarize_text, clean_article_content

load_dotenv()

app = FastAPI(title="JH Knowledge Base", version="1.0.0")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://jh-knowledge-base-0b4bd3a53ed0.herokuapp.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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
        
        # Scrape the article using enhanced scraper
        try:
            scraped_data = scrape_article_enhanced(url)
            print(f"Article scraped using method: {scraped_data.get('method', 'unknown')}")
        except Exception as scrape_error:
            raise HTTPException(status_code=500, detail=f"Failed to scrape article: {str(scrape_error)}")
        
        # Get summarization prompt from settings
        prompt = SettingsService.get_setting("summarization_prompt")
        if not prompt:
            prompt = "Summarize the following article in a clear, concise manner:"
        
        # Generate summary (no content cleaning during creation for speed)
        try:
            summary = summarize_text(scraped_data["full_text"], prompt)
        except Exception as ai_error:
            raise HTTPException(status_code=500, detail=f"AI summarization failed: {str(ai_error)}")
        
        # Create article object with original scraped content
        create_data = {
            "title": scraped_data["title"],
            "publication_name": scraped_data["publication_name"],
            "full_text": scraped_data["full_text"],  # Use original enhanced scraper content
            "summary": summary,
            "url": url,
            "date_added": datetime.now(),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert into database
        article = ArticleService.create_article(create_data)
        
        return article
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        # Handle duplicate URL specifically
        if str(e).startswith("DUPLICATE_URL:"):
            article_id = str(e).split(":")[1]
            if article_id == "unknown":
                raise HTTPException(
                    status_code=409, 
                    detail="An article with this URL already exists in your knowledge base."
                )
            else:
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

@app.post("/api/articles/{article_id}/clean-content")
async def clean_article_content_endpoint(article_id: str):
    """
    Clean the article content using AI to remove navigation, ads, and irrelevant content.
    This is an on-demand operation triggered by the user.
    """
    try:
        print(f"Cleaning content for article ID: {article_id}")
        
        # Get the article
        article = ArticleService.get_article_by_id(article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Clean the content using AI
        try:
            cleaned_content = clean_article_content(article["full_text"])
            print(f"Content cleaning for article {article_id}: Original length {len(article['full_text'])}, cleaned length {len(cleaned_content)}")
            
            # Update the article with cleaned content
            update_data = {
                "full_text": cleaned_content,
                "updated_at": datetime.now()
            }
            
            success = ArticleService.update_article(article_id, update_data)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to update article with cleaned content")
            
            # Get the updated article to return
            updated_article = ArticleService.get_article_by_id(article_id)
            
            return {
                "success": True,
                "message": "Article content cleaned successfully",
                "original_length": len(article["full_text"]),
                "cleaned_length": len(cleaned_content),
                "article": updated_article
            }
            
        except Exception as cleaning_error:
            print(f"Content cleaning error: {str(cleaning_error)}")
            raise HTTPException(status_code=500, detail=f"Failed to clean article content: {str(cleaning_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in clean content endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings():
    try:
        summarization_prompt = SettingsService.get_setting("summarization_prompt")
        cleaning_prompt = SettingsService.get_setting("cleaning_prompt")
        
        if not summarization_prompt:
            # Create default summarization prompt
            default_summarization = "Summarize the following article in a clear, concise manner:"
            SettingsService.set_setting("summarization_prompt", default_summarization)
            summarization_prompt = default_summarization
        
        if not cleaning_prompt:
            # Create default cleaning prompt
            default_cleaning = """You are a content extraction specialist. Your task is to clean scraped webpage content by removing all irrelevant elements while preserving the main article text EXACTLY as written.

CRITICAL INSTRUCTIONS:
1. NEVER change, rephrase, or modify even a single word of the actual article content
2. ONLY remove content that is clearly not part of the main article
3. Preserve all original formatting, line breaks, and paragraph structure
4. Do NOT add any new content or commentary

REMOVE these types of content:
- Navigation menus and breadcrumbs
- Website headers and footers
- Newsletter signup prompts
- Social media sharing buttons and links
- Author bios and "About the author" sections
- Related articles lists
- Advertisement content
- Comment sections
- "Subscribe" or "Follow us" calls-to-action
- Publication metadata (dates, categories, tags)
- Table of contents (if it's just navigation)
- Repeated promotional content
- Website navigation elements

KEEP these elements:
- The main article title
- All body paragraphs of the article
- Subheadings that are part of the article structure
- Quotes and citations within the article
- Lists that are part of the article content
- Any content that is clearly part of the author's intended message

Return ONLY the cleaned article content with no additional commentary or explanation."""
            SettingsService.set_setting("cleaning_prompt", default_cleaning)
            cleaning_prompt = default_cleaning
        
        return {
            "summarization_prompt": summarization_prompt,
            "cleaning_prompt": cleaning_prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings")
async def update_settings(settings_data: dict):
    try:
        summarization_prompt = settings_data.get("summarization_prompt")
        cleaning_prompt = settings_data.get("cleaning_prompt")
        
        if not summarization_prompt and not cleaning_prompt:
            raise HTTPException(status_code=400, detail="At least one prompt is required")
        
        # Update summarization prompt if provided
        if summarization_prompt:
            success = SettingsService.set_setting("summarization_prompt", summarization_prompt)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to update summarization prompt")
        
        # Update cleaning prompt if provided
        if cleaning_prompt:
            success = SettingsService.set_setting("cleaning_prompt", cleaning_prompt)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to update cleaning prompt")
        
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