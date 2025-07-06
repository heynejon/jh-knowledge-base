"""
PostgreSQL database models using SQLAlchemy
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    publication_name = Column(String(200), nullable=False, index=True)
    full_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    url = Column(String(1000), nullable=False, unique=True, index=True)
    date_added = Column(DateTime, nullable=False, default=func.now())
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # JSON field for future extensibility (tags, categories, user data, etc.)
    metadata = Column(JSON, nullable=True)
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "_id": str(self.id),  # Keep _id for compatibility with frontend
            "id": self.id,
            "title": self.title,
            "publication_name": self.publication_name,
            "full_text": self.full_text,
            "summary": self.summary,
            "url": self.url,
            "date_added": self.date_added,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metadata": self.metadata or {}
        }

class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

# Future models for user authentication
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Integer, default=1)  # Using Integer instead of Boolean for better compatibility
    profile = Column(JSON, nullable=True)  # Flexible user profile data
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def to_dict(self):
        """Convert to dictionary for API response (excluding password)"""
        return {
            "id": self.id,
            "email": self.email,
            "is_active": bool(self.is_active),
            "profile": self.profile or {},
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

class UserArticle(Base):
    """Junction table for user-article relationships (favorites, notes, etc.)"""
    __tablename__ = "user_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # Foreign key to users
    article_id = Column(Integer, nullable=False, index=True)  # Foreign key to articles
    is_favorite = Column(Integer, default=0)  # Using Integer instead of Boolean
    notes = Column(Text, nullable=True)
    user_data = Column(JSON, nullable=True)  # Flexible user-specific article data
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "article_id": self.article_id,
            "is_favorite": bool(self.is_favorite),
            "notes": self.notes,
            "user_data": self.user_data or {},
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }