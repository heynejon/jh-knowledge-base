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

from database import get_database, Article, Settings
from scraper import scrape_article
from summarizer import summarize_text

load_dotenv()

app = FastAPI(title="JH Knowledge Base", version="1.0.0")

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

@app.get("/api/articles")
async def get_articles(search: Optional[str] = None, db=Depends(get_database)):
    try:
        query = {}
        if search:
            query = {
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"full_text": {"$regex": search, "$options": "i"}},
                    {"summary": {"$regex": search, "$options": "i"}},
                    {"publication_name": {"$regex": search, "$options": "i"}}
                ]
            }
        
        articles = list(db.articles.find(query).sort("date_added", -1))
        
        # Convert ObjectId to string for JSON serialization
        for article in articles:
            article["_id"] = str(article["_id"])
            
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/articles")
async def create_article(article_data: dict, db=Depends(get_database)):
    try:
        url = article_data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        print(f"Starting article creation for URL: {url}")
        
        # Test database connection first
        try:
            db.articles.find_one()
            print("Database connection successful")
        except Exception as db_error:
            print(f"Database connection failed: {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"Database connection failed: {str(db_error)}")
        
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
        settings = db.settings.find_one({"key": "summarization_prompt"})
        prompt = settings["value"] if settings else "Summarize the following article in a clear, concise manner:"
        
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
        article = Article(
            title=scraped_data["title"],
            publication_name=scraped_data["publication_name"],
            full_text=scraped_data["full_text"],
            summary=summary,
            url=url,
            date_added=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Insert into database
        print("Saving to database...")
        result = db.articles.insert_one(article.dict())
        article_dict = article.dict()
        article_dict["_id"] = str(result.inserted_id)
        
        print("Article creation completed successfully")
        return article_dict
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/articles/{article_id}")
async def get_article(article_id: str, db=Depends(get_database)):
    try:
        # Handle both MongoDB ObjectId and mock IDs
        if article_id.startswith("mock_id_"):
            # For mock database
            article = db.articles.find_one({"_id": article_id})
        else:
            # For real MongoDB
            from bson import ObjectId
            article = db.articles.find_one({"_id": ObjectId(article_id)})
            
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article["_id"] = str(article["_id"])
        return article
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/articles/{article_id}")
async def update_article(article_id: str, article_data: dict, db=Depends(get_database)):
    try:
        from bson import ObjectId
        
        update_data = {"updated_at": datetime.now()}
        if "summary" in article_data:
            update_data["summary"] = article_data["summary"]
        
        result = db.articles.update_one(
            {"_id": ObjectId(article_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"message": "Article updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/articles/{article_id}")
async def delete_article(article_id: str, db=Depends(get_database)):
    try:
        from bson import ObjectId
        result = db.articles.delete_one({"_id": ObjectId(article_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"message": "Article deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings(db=Depends(get_database)):
    try:
        settings = db.settings.find_one({"key": "summarization_prompt"})
        if not settings:
            # Create default settings
            default_prompt = "Summarize the following article in a clear, concise manner:"
            db.settings.insert_one({"key": "summarization_prompt", "value": default_prompt})
            return {"summarization_prompt": default_prompt}
        
        return {"summarization_prompt": settings["value"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings")
async def update_settings(settings_data: dict, db=Depends(get_database)):
    try:
        prompt = settings_data.get("summarization_prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Summarization prompt is required")
        
        db.settings.update_one(
            {"key": "summarization_prompt"},
            {"$set": {"value": prompt}},
            upsert=True
        )
        
        return {"message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export")
async def export_articles(db=Depends(get_database)):
    try:
        articles = list(db.articles.find())
        
        # Convert ObjectId to string for JSON serialization
        for article in articles:
            article["_id"] = str(article["_id"])
            article["date_added"] = article["date_added"].isoformat()
            article["created_at"] = article["created_at"].isoformat()
            article["updated_at"] = article["updated_at"].isoformat()
        
        export_data = {
            "export_date": datetime.now().isoformat(),
            "total_articles": len(articles),
            "articles": articles
        }
        
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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