from pymongo import MongoClient
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

class Article(BaseModel):
    title: str
    publication_name: str
    full_text: str
    summary: str
    url: str
    date_added: datetime
    created_at: datetime
    updated_at: datetime

class Settings(BaseModel):
    key: str
    value: str

def get_database():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
    database_name = os.getenv("DATABASE_NAME", "jh_knowledge_base")
    
    try:
        # Configure MongoDB client with SSL settings for Atlas
        client = MongoClient(
            mongodb_url,
            serverSelectionTimeoutMS=10000,  # 10 second timeout
            socketTimeoutMS=10000,
            connectTimeoutMS=10000,
            tlsInsecure=True  # Allow insecure SSL for Atlas compatibility
        )
        
        # Test the connection
        client.admin.command('ping')
        
        db = client[database_name]
        return db
    except Exception as e:
        print(f"MongoDB connection error: {str(e)}")
        raise