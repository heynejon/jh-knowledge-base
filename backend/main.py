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
        print(f"Getting article with ID: {article_id}")
        
        # Debug: Check what articles exist in the database
        all_articles = list(db.articles.find())
        print(f"Available articles: {[art.get('_id') for art in all_articles]}")
        
        # Handle both MongoDB ObjectId and mock IDs
        if article_id.startswith("mock_id_"):
            # For mock database
            print(f"Using mock database query for ID: {article_id}")
            article = db.articles.find_one({"_id": article_id})
            print(f"Mock database result: {article}")
        else:
            # For real MongoDB
            print(f"Using MongoDB ObjectId query for ID: {article_id}")
            from bson import ObjectId
            article = db.articles.find_one({"_id": ObjectId(article_id)})
            print(f"MongoDB result: {article}")
            
        if not article:
            print(f"Article not found for ID: {article_id}")
            raise HTTPException(status_code=404, detail="Article not found")
        
        article["_id"] = str(article["_id"])
        print(f"Returning article: {article.get('title', 'No title')}")
        return article
    except Exception as e:
        print(f"Error getting article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/articles/{article_id}")
async def update_article(article_id: str, article_data: dict, db=Depends(get_database)):
    try:
        print(f"Updating article with ID: {article_id}")
        print(f"Update data: {article_data}")
        
        update_data = {"updated_at": datetime.now()}
        if "summary" in article_data:
            update_data["summary"] = article_data["summary"]
        
        # Handle both MongoDB ObjectId and mock IDs
        if article_id.startswith("mock_id_"):
            # For mock database
            print(f"Using mock database update for ID: {article_id}")
            result = db.articles.update_one(
                {"_id": article_id},
                {"$set": update_data}
            )
        else:
            # For real MongoDB
            print(f"Using MongoDB update for ID: {article_id}")
            from bson import ObjectId
            result = db.articles.update_one(
                {"_id": ObjectId(article_id)},
                {"$set": update_data}
            )
        
        print(f"Update result: {result.matched_count}")
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"message": "Article updated successfully"}
    except Exception as e:
        print(f"Error updating article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/articles/{article_id}")
async def delete_article(article_id: str, db=Depends(get_database)):
    try:
        print(f"Deleting article with ID: {article_id}")
        
        # Handle both MongoDB ObjectId and mock IDs
        if article_id.startswith("mock_id_"):
            # For mock database
            print(f"Using mock database delete for ID: {article_id}")
            result = db.articles.delete_one({"_id": article_id})
        else:
            # For real MongoDB
            print(f"Using MongoDB delete for ID: {article_id}")
            from bson import ObjectId
            result = db.articles.delete_one({"_id": ObjectId(article_id)})
        
        print(f"Delete result: {result.deleted_count}")
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"message": "Article deleted successfully"}
    except Exception as e:
        print(f"Error deleting article {article_id}: {str(e)}")
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

@app.get("/api/test-mongo")
async def test_mongo_connection():
    """Test endpoint to force MongoDB connection attempt"""
    try:
        print("=== TESTING MONGODB CONNECTION ===")
        
        # Check environment details first
        import sys
        import ssl
        import certifi
        import pymongo
        import socket
        
        env_info = {
            "python_version": sys.version,
            "ssl_version": ssl.OPENSSL_VERSION,
            "pymongo_version": pymongo.version,
            "certifi_location": certifi.where(),
            "mongodb_url_format": "mongodb+srv://" in os.getenv("MONGODB_URL", ""),
            "tls_versions_supported": [v.name for v in ssl.TLSVersion]
        }
        
        # Test DNS resolution and basic connectivity
        try:
            # Extract hostname from MongoDB URL
            mongodb_url = os.getenv("MONGODB_URL", "")
            if "mongodb+srv://" in mongodb_url:
                # Extract domain from mongodb+srv://user:pass@cluster.domain/db
                domain = mongodb_url.split("@")[1].split("/")[0]
                print(f"Testing DNS resolution for: {domain}")
                
                # Test DNS resolution
                import dns.resolver
                srv_records = dns.resolver.resolve(f"_mongodb._tcp.{domain}", 'SRV')
                server_addresses = [str(srv.target).rstrip('.') for srv in srv_records]
                print(f"DNS SRV records found: {server_addresses}")
                
                # Test basic TCP connectivity to first server
                if server_addresses:
                    first_server = server_addresses[0]
                    port = 27017
                    print(f"Testing TCP connection to {first_server}:{port}")
                    
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(5)
                    result = sock.connect_ex((first_server, port))
                    sock.close()
                    
                    env_info["dns_resolution"] = "Success"
                    env_info["tcp_connectivity"] = "Success" if result == 0 else f"Failed (code: {result})"
                    env_info["server_addresses"] = server_addresses
                else:
                    env_info["dns_resolution"] = "No SRV records found"
            else:
                env_info["dns_resolution"] = "Not using mongodb+srv:// scheme"
                
        except Exception as dns_error:
            env_info["dns_resolution"] = f"Failed: {str(dns_error)}"
            
        print(f"Environment info: {env_info}")
        
        # Import here to test the connection logic
        from database import get_database
        db = get_database()
        
        # Check what type of database we got
        db_type = "MongoDB" if hasattr(db, 'client') else "Mock Database"
        
        # Test TLS 1.3 support on Heroku
        tls_test_results = {}
        try:
            mongodb_url = os.getenv("MONGODB_URL", "")
            if mongodb_url and "mongodb+srv://" in mongodb_url:
                domain = mongodb_url.split("@")[1].split("/")[0]
                
                # Test TLS 1.3 specifically
                try:
                    import dns.resolver
                    srv_records = dns.resolver.resolve(f"_mongodb._tcp.{domain}", 'SRV')
                    server_addresses = [str(srv.target).rstrip('.') for srv in srv_records]
                    
                    if server_addresses and hasattr(ssl, 'TLSVersion') and hasattr(ssl.TLSVersion, 'TLSv1_3'):
                        server = server_addresses[0]
                        
                        # Test TLS 1.3
                        context = ssl.create_default_context()
                        context.minimum_version = ssl.TLSVersion.TLSv1_3
                        context.maximum_version = ssl.TLSVersion.TLSv1_3
                        context.check_hostname = False
                        context.verify_mode = ssl.CERT_NONE
                        
                        test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        test_sock.settimeout(5)
                        
                        with context.wrap_socket(test_sock, server_hostname=server) as ssock:
                            ssock.connect((server, 27017))
                            tls_test_results["tls_1_3_test"] = {
                                "status": "SUCCESS",
                                "version": ssock.version(),
                                "cipher": ssock.cipher()[0] if ssock.cipher() else "Unknown"
                            }
                except Exception as tls_error:
                    tls_test_results["tls_1_3_test"] = {"status": "FAILED", "error": str(tls_error)}
        except Exception as test_error:
            tls_test_results["tls_test_error"] = str(test_error)

        return {
            "database_type": db_type,
            "connection_successful": True,
            "message": f"Connected to {db_type}",
            "environment": env_info,
            "tls_tests": tls_test_results
        }
    except Exception as e:
        print(f"MongoDB connection test failed: {str(e)}")
        return {
            "database_type": "Unknown",
            "connection_successful": False,
            "error": str(e),
            "environment": env_info if 'env_info' in locals() else {}
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