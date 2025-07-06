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

class MockCursor:
    def __init__(self, data):
        self.data = data
        
    def sort(self, field, direction=-1):
        # Sort by date_added field if available, newest first
        if field == "date_added" and self.data:
            try:
                self.data = sorted(self.data, key=lambda x: x.get("date_added", ""), reverse=(direction == -1))
            except:
                pass  # If sorting fails, just return as is
        return self
        
    def __iter__(self):
        return iter(self.data)
        
    def __getitem__(self, index):
        return self.data[index]

class MockCollection:
    def __init__(self, name, data):
        self.name = name
        self.data = data
        
    def find(self, query=None):
        items = self.data[self.name]
        if query:
            # Simple query support for search
            if "$or" in query:
                filtered = []
                search_term = ""
                for condition in query["$or"]:
                    for field, regex_obj in condition.items():
                        if isinstance(regex_obj, dict) and "$regex" in regex_obj:
                            search_term = regex_obj["$regex"].lower()
                            break
                
                for item in items:
                    item_text = (str(item.get("title", "")) + " " + 
                                str(item.get("full_text", "")) + " " + 
                                str(item.get("summary", "")) + " " + 
                                str(item.get("publication_name", ""))).lower()
                    if search_term in item_text:
                        filtered.append(item)
                return MockCursor(filtered)
        return MockCursor(items)
        
    def find_one(self, query=None):
        items = self.data[self.name]
        if query:
            if "key" in query:
                for item in items:
                    if item.get("key") == query["key"]:
                        return item
            elif "_id" in query:
                target_id = str(query["_id"])
                for item in items:
                    if str(item.get("_id")) == target_id:
                        return item
        return items[0] if items else None
        
    def insert_one(self, doc):
        doc["_id"] = f"mock_id_{len(self.data[self.name])}"
        self.data[self.name].append(doc)
        return type('Result', (), {'inserted_id': doc["_id"]})()
        
    def update_one(self, query, update):
        items = self.data[self.name]
        if query and "_id" in query:
            target_id = str(query["_id"])
            for item in items:
                if str(item.get("_id")) == target_id:
                    # Apply the $set update
                    if "$set" in update:
                        item.update(update["$set"])
                    return type('Result', (), {'matched_count': 1})()
        return type('Result', (), {'matched_count': 0})()
        
    def delete_one(self, query):
        items = self.data[self.name]
        if query and "_id" in query:
            target_id = str(query["_id"])
            for i, item in enumerate(items):
                if str(item.get("_id")) == target_id:
                    del items[i]
                    return type('Result', (), {'deleted_count': 1})()
        return type('Result', (), {'deleted_count': 0})()

# Global mock database instance to persist data across requests
_mock_db_instance = None

def get_database():
    global _mock_db_instance
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
    database_name = os.getenv("DATABASE_NAME", "jh_knowledge_base")
    
    # Use mock database for now due to SSL issues with MongoDB Atlas on Heroku
    print("Using mock database due to MongoDB Atlas SSL issues")
    if _mock_db_instance is None:
        print("Creating new mock database instance")
        _mock_db_instance = MockDatabase()
    else:
        print(f"Reusing mock database with {len(_mock_db_instance.data['articles'])} articles")
    return _mock_db_instance
    
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