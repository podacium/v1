from pydantic import BaseModel, EmailStr, validator, Field, model_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AuthProvider(str, Enum):
    EMAIL = "EMAIL"
    GOOGLE = "GOOGLE"
    GITHUB = "GITHUB"
    LINKEDIN = "LINKEDIN"
    PHONE = "PHONE"

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    BUSINESS = "BUSINESS"
    FREELANCER = "FREELANCER"
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = 1800  # 30 minutes

class UserRegister(BaseModel):
    fullName: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phoneNumber: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    password: str = Field(..., min_length=6)
    provider: AuthProvider = AuthProvider.EMAIL
    role: UserRole = UserRole.STUDENT
    acceptedTerms: bool = Field(False)
    subscribeNewsletter: bool = Field(False)
    
    # FIX: Replace @root_validator with @model_validator
    @model_validator(mode='before')
    @classmethod
    def email_or_phone_required(cls, values):
        """Ensure either email or phone number is provided"""
        email = values.get('email')
        phone_number = values.get('phoneNumber')
        
        if not email and not phone_number:
            raise ValueError('Either email or phone number is required')
        return values
    
    @validator('acceptedTerms')
    def terms_must_be_accepted(cls, v):
        if not v:
            raise ValueError('You must accept the terms and conditions')
        return v

class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    phoneNumber: Optional[str] = None
    password: str = Field(..., min_length=6)
    
    # FIX: Replace @root_validator with @model_validator
    @model_validator(mode='before')
    @classmethod
    def email_or_phone_required(cls, values):
        """Ensure either email or phone number is provided"""
        email = values.get('email')
        phone_number = values.get('phoneNumber')
        
        if not email and not phone_number:
            raise ValueError('Either email or phone number is required')
        return values

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class EmailVerificationRequest(BaseModel):
    token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    fullName: str
    email: Optional[str]
    emailVerified: bool
    phoneNumber: Optional[str]
    phoneVerified: bool
    role: UserRole
    profilePictureUrl: Optional[str]
    bio: Optional[str]
    country: Optional[str]
    city: Optional[str]
    skills: List[str]
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

# Aliases for compatibility
UserSignup = UserRegister