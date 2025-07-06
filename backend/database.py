from pymongo import MongoClient
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import os
import ssl
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
    
    # Try MongoDB Atlas first
    try:
        print("Attempting MongoDB Atlas connection...")
        print(f"Using MongoDB URL: {mongodb_url[:20]}...")  # Show first 20 chars for debugging
        
        # Ensure we have mongodb+srv:// format
        if not mongodb_url.startswith('mongodb+srv://'):
            print(f"WARNING: URL should use mongodb+srv:// format, got: {mongodb_url[:20]}...")
        
        # Approach 1: Use Atlas-recommended connection with CA file
        import certifi
        print(f"Using CA file: {certifi.where()}")
        
        client = MongoClient(
            mongodb_url,
            serverSelectionTimeoutMS=15000,
            socketTimeoutMS=15000,
            connectTimeoutMS=15000,
            tls=True,
            tlsCAFile=certifi.where(),
            retryWrites=True,
            w='majority'
        )
        
        # Test the connection
        client.admin.command('ping')
        db = client[database_name]
        print("MongoDB Atlas connection successful!")
        return db
        
    except Exception as e:
        print(f"MongoDB Atlas connection attempt 1 failed: {str(e)}")
        
        # Approach 2: Try without CA validation
        try:
            print("Attempting MongoDB Atlas connection (no cert validation)...")
            
            client = MongoClient(
                mongodb_url,
                serverSelectionTimeoutMS=10000,
                socketTimeoutMS=10000,
                connectTimeoutMS=10000,
                tls=True,
                tlsInsecure=True,
                retryWrites=True
            )
            
            # Test the connection
            client.admin.command('ping')
            db = client[database_name]
            print("MongoDB Atlas connection successful (no validation)!")
            return db
            
        except Exception as e2:
            print(f"MongoDB Atlas connection attempt 2 failed: {str(e2)}")
            print("Falling back to mock database...")
        
        # Fall back to mock database
        if _mock_db_instance is None:
            print("Creating new mock database instance")
            _mock_db_instance = MockDatabase()
        else:
            print(f"Reusing mock database with {len(_mock_db_instance.data['articles'])} articles")
        return _mock_db_instance