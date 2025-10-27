import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OAuth (if using social logins)
    GOOGLE_CLIENT_ID: Optional[str]
    GOOGLE_CLIENT_SECRET: Optional[str]
    GITHUB_CLIENT_ID: Optional[str]
    GITHUB_CLIENT_SECRET: Optional[str]
    LINKEDIN_CLIENT_ID: Optional[str]
    LINKEDIN_CLIENT_SECRET: Optional[str]
    
    # Security
    BCRYPT_ROUNDS: int = 10
    RESET_TOKEN_EXPIRE_HOURS: int = 24
    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    
    # CORS (comma separated string from env to List)
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]
    
    # App
    APP_NAME: str = "Podacium API"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # File Upload
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    UPLOAD_DIR: str = "uploads"
    
    # Email (optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_SSL: bool = False  # Add this line
    
    # Frontend URL for email links
    FRONTEND_URL: str = 'http://localhost:3001'  # Add this line

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
