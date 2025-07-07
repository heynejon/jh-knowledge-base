"""
Pydantic schemas for API request/response validation
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

# Article schemas
class ArticleBase(BaseModel):
    title: str
    publication_name: str
    full_text: str
    summary: str
    url: str

class ArticleCreate(ArticleBase):
    date_added: Optional[datetime] = None
    created_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    publication_name: Optional[str] = None
    full_text: Optional[str] = None
    summary: Optional[str] = None
    url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ArticleResponse(ArticleBase):
    id: int
    _id: str  # For frontend compatibility
    date_added: datetime
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]

    class Config:
        from_attributes = True

# Settings schemas
class SettingBase(BaseModel):
    key: str
    value: str

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(SettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# User schemas (for future authentication) - currently unused

# API response schemas
class APIResponse(BaseModel):
    """Generic API response wrapper"""
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    status_code: int