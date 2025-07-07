"""
PostgreSQL database connection and operations using SQLAlchemy
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager
import os
import logging
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse

from models import Base, Article, Setting, User, UserArticle

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # Heroku uses postgres:// but SQLAlchemy 1.4+ requires postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with connection pooling
engine = None
SessionLocal = None

def init_database():
    """Initialize database connection and create tables"""
    global engine, SessionLocal
    
    try:
        if not DATABASE_URL:
            logger.error("DATABASE_URL not found in environment variables")
            return False
            
        logger.info("Initializing PostgreSQL database connection...")
        
        # Create engine with optimized settings for Heroku
        engine = create_engine(
            DATABASE_URL,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=300,    # Recycle connections every 5 minutes
            echo=False  # Set to True for SQL debugging
        )
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info(f"Database connection successful: {result.fetchone()}")
        
        # Create session factory
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Initialize default settings
        _init_default_settings()
        
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False

def _init_default_settings():
    """Initialize default settings if they don't exist"""
    try:
        with get_db_session() as db:
            # Check if summarization prompt exists
            setting = db.query(Setting).filter(Setting.key == "summarization_prompt").first()
            if not setting:
                default_prompt = "Summarize the following article in a clear, concise manner:"
                new_setting = Setting(key="summarization_prompt", value=default_prompt)
                db.add(new_setting)
                db.commit()
                logger.info("Default summarization prompt created")
                
    except Exception as e:
        logger.error(f"Failed to initialize default settings: {str(e)}")

@contextmanager
def get_db_session():
    """Get database session with automatic cleanup"""
    if not SessionLocal:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        db.close()

# Article operations
class ArticleService:
    """Service class for article operations"""
    
    @staticmethod
    def create_article(article_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new article"""
        try:
            with get_db_session() as db:
                # Create article with current timestamp
                article = Article(
                    title=article_data["title"],
                    publication_name=article_data["publication_name"],
                    full_text=article_data["full_text"],
                    summary=article_data["summary"],
                    url=article_data["url"],
                    date_added=article_data.get("date_added", datetime.now()),
                    created_at=article_data.get("created_at", datetime.now()),
                    updated_at=datetime.now()
                )
                
                db.add(article)
                db.commit()
                db.refresh(article)
                
                logger.info(f"Article created successfully: ID {article.id}")
                return article.to_dict()
                
        except SQLAlchemyError as e:
            logger.error(f"Database error creating article: {str(e)}")
            raise Exception(f"Failed to create article: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error creating article: {str(e)}")
            raise Exception(f"Failed to create article: {str(e)}")
    
    @staticmethod
    def get_articles(search: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get articles with optional search"""
        try:
            with get_db_session() as db:
                query = db.query(Article)
                
                if search:
                    # Full-text search across multiple fields
                    search_term = f"%{search.lower()}%"
                    query = query.filter(
                        (Article.title.ilike(search_term)) |
                        (Article.full_text.ilike(search_term)) |
                        (Article.summary.ilike(search_term)) |
                        (Article.publication_name.ilike(search_term))
                    )
                
                # Order by date_added descending and limit results
                articles = query.order_by(Article.date_added.desc()).limit(limit).all()
                
                return [article.to_dict() for article in articles]
                
        except SQLAlchemyError as e:
            logger.error(f"Database error getting articles: {str(e)}")
            raise Exception(f"Failed to get articles: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error getting articles: {str(e)}")
            raise Exception(f"Failed to get articles: {str(e)}")
    
    @staticmethod
    def get_article_by_id(article_id: str) -> Optional[Dict[str, Any]]:
        """Get a single article by ID"""
        try:
            with get_db_session() as db:
                article = db.query(Article).filter(Article.id == int(article_id)).first()
                return article.to_dict() if article else None
                
        except (ValueError, SQLAlchemyError) as e:
            logger.error(f"Error getting article {article_id}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting article {article_id}: {str(e)}")
            return None
    
    @staticmethod
    def update_article(article_id: str, update_data: Dict[str, Any]) -> bool:
        """Update an article"""
        try:
            with get_db_session() as db:
                article = db.query(Article).filter(Article.id == int(article_id)).first()
                if not article:
                    return False
                
                # Update fields (map metadata to extra_data for compatibility)
                for key, value in update_data.items():
                    if key == "metadata":
                        article.extra_data = value
                    elif hasattr(article, key):
                        setattr(article, key, value)
                
                article.updated_at = datetime.now()
                db.commit()
                
                logger.info(f"Article {article_id} updated successfully")
                return True
                
        except (ValueError, SQLAlchemyError) as e:
            logger.error(f"Error updating article {article_id}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error updating article {article_id}: {str(e)}")
            return False
    
    @staticmethod
    def delete_article(article_id: str) -> bool:
        """Delete an article"""
        try:
            with get_db_session() as db:
                article = db.query(Article).filter(Article.id == int(article_id)).first()
                if not article:
                    return False
                
                db.delete(article)
                db.commit()
                
                logger.info(f"Article {article_id} deleted successfully")
                return True
                
        except (ValueError, SQLAlchemyError) as e:
            logger.error(f"Error deleting article {article_id}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting article {article_id}: {str(e)}")
            return False

# Settings operations
class SettingsService:
    """Service class for settings operations"""
    
    @staticmethod
    def get_setting(key: str) -> Optional[str]:
        """Get a setting value by key"""
        try:
            with get_db_session() as db:
                setting = db.query(Setting).filter(Setting.key == key).first()
                return setting.value if setting else None
                
        except SQLAlchemyError as e:
            logger.error(f"Error getting setting {key}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting setting {key}: {str(e)}")
            return None
    
    @staticmethod
    def set_setting(key: str, value: str) -> bool:
        """Set a setting value"""
        try:
            with get_db_session() as db:
                setting = db.query(Setting).filter(Setting.key == key).first()
                
                if setting:
                    setting.value = value
                    setting.updated_at = datetime.now()
                else:
                    setting = Setting(key=key, value=value)
                    db.add(setting)
                
                db.commit()
                
                logger.info(f"Setting {key} updated successfully")
                return True
                
        except SQLAlchemyError as e:
            logger.error(f"Error setting {key}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error setting {key}: {str(e)}")
            return False
    
    @staticmethod
    def get_all_settings() -> Dict[str, str]:
        """Get all settings as a dictionary"""
        try:
            with get_db_session() as db:
                settings = db.query(Setting).all()
                return {setting.key: setting.value for setting in settings}
                
        except SQLAlchemyError as e:
            logger.error(f"Error getting all settings: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error getting all settings: {str(e)}")
            return {}

# Initialize database on import
def get_database():
    """Get database services"""
    if not engine:
        if not init_database():
            logger.error("Failed to initialize database")
            return None
    
    return {
        'articles': ArticleService,
        'settings': SettingsService
    }