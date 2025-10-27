from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
import os
import subprocess
import sys

from app.core.config import settings
from app.core.prisma import connect_prisma, disconnect_prisma, prisma
from app.core.security import get_password_hash, verify_password

from app.routers import (
    auth, users, organizations, education, freelancing, 
    bi, payments, files, dashboard
)

# App init
app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-module platform for education, freelancing, and business intelligence",
    version="1.0.0",
    debug=settings.DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def ensure_prisma_engine():
    """Ensure Prisma query engine is available before connecting"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"🔄 Attempt {attempt + 1}/{max_retries}: Testing Prisma engine...")
            
            # Try to connect to check if engine works
            await prisma.connect()
            print("✅ Prisma engine is working")
            return True
            
        except Exception as e:
            print(f"❌ Prisma engine issue (attempt {attempt + 1}): {e}")
            
            if attempt < max_retries - 1:
                print("🔄 Attempting to fetch Prisma engine...")
                try:
                    # Try to fetch the engine
                    result = subprocess.run([
                        sys.executable, "-m", "prisma", "py", "fetch"
                    ], capture_output=True, text=True, timeout=60)
                    
                    if result.returncode == 0:
                        print("✅ Prisma engine fetched successfully")
                    else:
                        print(f"⚠️ Prisma fetch output: {result.stdout}")
                        print(f"⚠️ Prisma fetch error: {result.stderr}")
                        
                except subprocess.TimeoutExpired:
                    print("❌ Prisma fetch timed out")
                except Exception as fetch_error:
                    print(f"❌ Prisma fetch failed: {fetch_error}")
            
            # Wait before retry
            time.sleep(2)
    
    print("❌ All attempts to initialize Prisma engine failed")
    return False

# Prisma startup/shutdown
@app.on_event("startup")
async def startup():
    print("🚀 Starting application...")
    
    # First ensure Prisma engine is available
    engine_ready = await ensure_prisma_engine()
    
    if not engine_ready:
        print("⚠️ Starting without database connection - some features may not work")
        return
    
    try:
        # Now try to connect properly
        await connect_prisma()
        print("✅ Database connected successfully")
        
        # Test the connection
        user_count = await prisma.user.count()
        print(f"📊 Database test: {user_count} users found")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("⚠️ Application running in limited mode")

@app.on_event("shutdown")
async def shutdown():
    try:
        await disconnect_prisma()
        print("✅ Database disconnected")
    except Exception as e:
        print(f"⚠️ Error during shutdown: {e}")

# API prefix
api_prefix = "/api"

# Include routers
app.include_router(auth.router, prefix=api_prefix, tags=["Authentication"])
app.include_router(users.router, prefix=api_prefix, tags=["Users"])
app.include_router(organizations.router, prefix=api_prefix, tags=["Organizations"])
app.include_router(education.router, prefix=api_prefix, tags=["Education"])
app.include_router(freelancing.router, prefix=api_prefix, tags=["Freelancing"])
app.include_router(bi.router, prefix=api_prefix, tags=["Business Intelligence"])
app.include_router(payments.router, prefix=api_prefix, tags=["Payments & Subscriptions"])
app.include_router(files.router, prefix=api_prefix, tags=["Files"])

# Basic routes
@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Enhanced health check that tests database connectivity"""
    try:
        # Test database connection
        db_status = "unknown"
        try:
            user_count = await prisma.user.count()
            db_status = "healthy"
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
        
        return {
            "status": "healthy", 
            "service": settings.APP_NAME,
            "database": db_status,
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": settings.APP_NAME,
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/healthz")
async def health_check_render():
    """Health check endpoint for Render with minimal dependencies"""
    return {"status": "ok", "service": settings.APP_NAME}

@app.get("/routes")
async def get_routes():
    return [
        {
            "path": route.path,
            "name": route.name,
            "methods": list(route.methods) if hasattr(route, 'methods') else []
        }
        for route in app.routes
    ]

# Optional: Inline additional auth routes if not part of auth router yet
class SignupData(BaseModel):
    fullName: str  # Change from full_name to match frontend
    email: str
    password: str
    provider: Optional[str] = 'EMAIL'
    acceptedTerms: bool  # Change from accepted_terms
    subscribeNewsletter: bool  # Change from subscribe_newsletter
    phoneNumber: Optional[str] = None  # Change from phone_number
    role: Optional[str] = 'STUDENT'

class SignupResponse(BaseModel):
    message: str
    user_id: int
    verification_sent: bool

@app.post("/api/auth/register", response_model=SignupResponse)
async def register(user_data: SignupData):
    # TODO: Implement actual user registration logic
    return SignupResponse(
        message="User registered successfully",
        user_id=1,
        verification_sent=True
    )

@app.post("/api/auth/check-email")
async def check_email(email: dict):
    # Mock check
    return {"available": True}

@app.get("/api/debug/users")
async def debug_users():
    """Temporary debug endpoint to check users"""
    try:
        users = await prisma.user.find_many(take=10)
        
        # Manually format the response with the fields we want
        user_data = []
        for user in users:
            user_data.append({
                "id": user.id,
                "email": user.email,
                "fullName": user.fullName,
                "passwordHash": user.passwordHash,
                "createdAt": user.createdAt.isoformat() if user.createdAt else None,
                "role": user.role
            })
        
        return {"users": user_data}
    except Exception as e:
        return {"error": str(e)}

# Add a test endpoint to check password hashing
@app.post("/api/debug/test-hash")
async def test_password_hash():
    """Test password hashing functionality"""
    from app.core.security import get_password_hash, verify_password
    
    test_password = "test123"
    hashed = get_password_hash(test_password)
    is_valid = verify_password(test_password, hashed)
    
    return {
        "test_password": test_password,
        "hashed_password": hashed,
        "verification_result": is_valid,
        "message": "Password hashing working correctly" if is_valid else "Password hashing failed"
    }

# Add this import at the top
from app.services.email_service import email_service

# Add these endpoints before the if __name__ == "__main__" block
@app.post("/api/debug/test-email-config")
async def test_email_config():
    """Test SMTP configuration"""
    try:
        # Test connection
        if not settings.SMTP_HOST:
            return {
                "status": "disabled", 
                "message": "Email sending is disabled (no SMTP_HOST)",
                "config": {
                    "SMTP_HOST": settings.SMTP_HOST,
                    "SMTP_PORT": settings.SMTP_PORT,
                    "SMTP_USER": "***" if settings.SMTP_USER else None,
                    "FRONTEND_URL": settings.FRONTEND_URL
                }
            }
        
        # Test connection
        connected = await email_service.test_connection()
        return {
            "status": "success" if connected else "failed",
            "message": "SMTP connection successful" if connected else "SMTP connection failed",
            "config": {
                "SMTP_HOST": settings.SMTP_HOST,
                "SMTP_PORT": settings.SMTP_PORT,
                "SMTP_USER": "***" if settings.SMTP_USER else None,
                "FRONTEND_URL": settings.FRONTEND_URL
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "config": {
                "SMTP_HOST": settings.SMTP_HOST,
                "SMTP_PORT": settings.SMTP_PORT,
                "SMTP_USER": "***" if settings.SMTP_USER else None,
                "FRONTEND_URL": settings.FRONTEND_URL
            }
        }

@app.post("/api/debug/send-test-email")
async def send_test_email():
    """Send a test email"""
    try:
        await email_service.send_verification_email(
            email="test@example.com",  # Change to your test email
            token="test-token-123",
            name="Test User"
        )
        return {"status": "success", "message": "Test email sent successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to send test email: {str(e)}"}
    
# Add these endpoints before the if __name__ == "__main__" block
@app.post("/api/debug/test-database")
async def test_database():
    """Test database connection and operations"""
    try:
        # Test connection
        users_count = await prisma.user.count()
        
        # Test creating a user
        test_email = f"test_{int(time.time())}@example.com"
        test_user = await prisma.user.create({
            "email": test_email,
            "fullName": "Test User",
            "passwordHash": get_password_hash("test123"),
            "acceptedTerms": True,
            "subscribeNewsletter": False,
            "provider": "EMAIL",
            "role": "STUDENT"
        })
        
        # Test reading the user
        found_user = await prisma.user.find_unique(where={"id": test_user.id})
        
        # Clean up
        await prisma.user.delete(where={"id": test_user.id})
        
        return {
            "status": "success",
            "database_connected": True,
            "users_count": users_count,
            "test_operations": {
                "create": True,
                "read": True,
                "delete": True
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "database_connected": False,
            "error": str(e)
        }

@app.post("/api/debug/test-registration")
async def test_registration():
    """Test the registration process"""
    try:
        from app.services.auth_service import auth_service
        from app.schemas.auth import UserRegister
        
        test_email = f"test_{int(time.time())}@example.com"
        test_data = UserRegister(
            fullName="Test User",
            email=test_email,
            password="test123",
            acceptedTerms=True,
            subscribeNewsletter=False
        )
        
        # Test the auth service directly
        user, token = await auth_service.create_user(test_data)
        
        # Clean up: Delete related AuthToken records first
        await prisma.authtoken.delete_many(where={"userId": user["id"]})
        
        # Then delete the user
        await prisma.user.delete(where={"id": user["id"]})
        
        return {
            "status": "success",
            "registration_working": True,
            "user_created": True,
            "user_id": user["id"]
        }
    except Exception as e:
        return {
            "status": "error",
            "registration_working": False,
            "error": str(e)
        }
    
@app.post("/api/debug/test-password")
async def test_password_verification(email: str, password: str):
    """Test password verification for a user"""
    try:
        print(f"🔧 DEBUG: Testing password for {email}")
        
        user = await prisma.user.find_unique(where={"email": email})
        if not user:
            return {"error": "User not found"}
        
        print(f"🔧 DEBUG: User found - ID: {user.id}")
        print(f"🔧 DEBUG: Stored hash: {user.passwordHash}")
        
        from app.core.security import verify_password
        is_valid = verify_password(password, user.passwordHash)
        
        print(f"🔧 DEBUG: Password valid: {is_valid}")
    
        return {
            "user_id": user.id,
            "email": user.email,
            "password_valid": is_valid,
            "hash_algorithm": "argon2id" if user.passwordHash.startswith("$argon2") else "unknown"
        }
    except Exception as e:
        print(f"❌ DEBUG ERROR: {str(e)}")
        import traceback
        print(f"🔴 TRACEBACK: {traceback.format_exc()}")
        return {"error": str(e)}

# New debug endpoint to check Prisma engine status
@app.get("/api/debug/prisma-status")
async def debug_prisma_status():
    """Check Prisma engine and connection status"""
    try:
        # Check if we can connect
        await prisma.connect()
        
        # Test a simple query
        user_count = await prisma.user.count()
        
        # Get engine info
        engine_info = {
            "connected": True,
            "user_count": user_count,
            "engine_available": True
        }
        
        await prisma.disconnect()
        
        return engine_info
        
    except Exception as e:
        return {
            "connected": False,
            "engine_available": False,
            "error": str(e)
        }
    
app.include_router(dashboard.router, prefix=api_prefix, tags=["Dashboard"])
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
