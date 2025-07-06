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

class MockDatabase:
    """Mock database for testing when MongoDB Atlas is not available"""
    def __init__(self):
        self.data = {"articles": [], "settings": []}
        
    @property
    def articles(self):
        return MockCollection("articles", self.data)
        
    @property  
    def settings(self):
        return MockCollection("settings", self.data)

class MockCollection:
    def __init__(self, name, data):
        self.name = name
        self.data = data
        
    def find(self, query=None):
        return self.data[self.name]
        
    def find_one(self, query=None):
        items = self.data[self.name]
        if query and "key" in query:
            for item in items:
                if item.get("key") == query["key"]:
                    return item
        return items[0] if items else None
        
    def insert_one(self, doc):
        doc["_id"] = f"mock_id_{len(self.data[self.name])}"
        self.data[self.name].append(doc)
        return type('Result', (), {'inserted_id': doc["_id"]})()
        
    def update_one(self, query, update):
        return type('Result', (), {'matched_count': 1})()
        
    def delete_one(self, query):
        return type('Result', (), {'deleted_count': 1})()

def get_database():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
    database_name = os.getenv("DATABASE_NAME", "jh_knowledge_base")
    
    # Use mock database for now due to SSL issues with MongoDB Atlas on Heroku
    print("Using mock database due to MongoDB Atlas SSL issues")
    return MockDatabase()
    
    # Original MongoDB code (commented out due to SSL issues)
    # try:
    #     client = MongoClient(
    #         mongodb_url,
    #         serverSelectionTimeoutMS=10000,
    #         socketTimeoutMS=10000,
    #         connectTimeoutMS=10000
    #     )
    #     client.admin.command('ping')
    #     db = client[database_name]
    #     return db
    # except Exception as e:
    #     print(f"MongoDB connection error: {str(e)}")
    #     raise