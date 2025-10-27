from datetime import datetime, timedelta
from typing import Optional, Any, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Use Argon2 instead of bcrypt - no 72-byte limit and more modern
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__time_cost=2,      # Lower for development
    argon2__memory_cost=1024, # Lower for development  
    argon2__parallelism=1,
    argon2__hash_len=16
)

# JWT settings
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        print(f"🔧 SECURITY DEBUG: Verifying password")
        print(f"🔧 SECURITY DEBUG: Plain password: '{plain_password}'")
        print(f"🔧 SECURITY DEBUG: Hashed password: {hashed_password}")
        print(f"🔧 SECURITY DEBUG: Hash starts with $argon2: {hashed_password.startswith('$argon2')}")
        
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"🔧 SECURITY DEBUG: Verification result: {result}")
        
        return result
    except Exception as e:
        print(f"❌ SECURITY DEBUG: Password verification error: {str(e)}")
        import traceback
        print(f"🔴 SECURITY TRACEBACK: {traceback.format_exc()}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using Argon2"""
    try:
        logger.info(f"Hashing password with Argon2")
        hashed = pwd_context.hash(password)
        logger.info("✅ Password hashed successfully with Argon2")
        return hashed
    except Exception as e:
        logger.error(f"Argon2 hashing failed: {str(e)}")
        # Final fallback
        try:
            from passlib.hash import pbkdf2_sha256
            hashed = pbkdf2_sha256.hash(password)
            logger.info("✅ Password hashed with pbkdf2_sha256 fallback")
            return hashed
        except Exception as fallback_error:
            logger.error(f"All hashing methods failed: {fallback_error}")
            raise ValueError("Failed to hash password")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with custom data"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token with custom data"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token_for_user(user_id: int) -> str:
    """Create refresh token with very long expiration (1 year)"""
    expires_delta = timedelta(days=365)  # 1 year expiration
    return create_refresh_token({"sub": str(user_id)}, expires_delta)  # Now this will work

# In app/core/security.py - Update token creation functions
def create_access_token_for_user(user_id: int) -> str:
    """Create access token with long expiration (30 days)"""
    expires_delta = timedelta(days=30)  # Changed from 30 minutes to 30 days
    return create_access_token({"sub": str(user_id)}, expires_delta)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None