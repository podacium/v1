from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.auth import UserRole

class UserUpdate(BaseModel):
    fullName: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phoneNumber: Optional[str] = Field(None, regex=r'^\+?[1-9]\d{1,14}$')
    bio: Optional[str] = Field(None, max_length=500)
    country: Optional[str] = None
    city: Optional[str] = None
    profilePictureUrl: Optional[str] = None
    skills: Optional[List[str]] = None
    socialLinks: Optional[Dict[str, Any]] = None

class UserProfileResponse(BaseModel):
    id: int
    email: Optional[str]
    emailVerified: bool
    phoneNumber: Optional[str]
    phoneVerified: bool
    role: UserRole
    fullName: str
    profilePictureUrl: Optional[str]
    bio: Optional[str]
    country: Optional[str]
    city: Optional[str]
    skills: List[str]
    socialLinks: Optional[Dict[str, Any]]
    createdAt: datetime
    updatedAt: datetime
    lastLoginAt: Optional[datetime]
    loginCount: int
    ownedOrganization: Optional[Any] = None
    primaryOrganization: Optional[Any] = None
    memberships: List[Any] = []
    
    class Config:
        from_attributes = True

class UserSkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)

class UserSkillResponse(BaseModel):
    id: int
    userId: int
    name: str
    createdAt: datetime
    
    class Config:
        from_attributes = True