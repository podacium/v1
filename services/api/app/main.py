import os
os.environ['PRISMA_USE_PYTHON_ENGINE'] = '1'


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
import os
import subprocess
import sys
from pathlib import Path

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

def setup_prisma_engine():
    """Set up Prisma engine path correctly for Render"""
    print("🔧 Setting up Prisma engine...")
    
    # Known Render cache location
    cache_path = "/opt/render/.cache/prisma-python/binaries/5.4.2/ac9d7041ed77bcc8a8dbd2ab6616b39013829574"
    engine_name = "prisma-query-engine-debian-openssl-3.0.x"
    engine_path = f"{cache_path}/{engine_name}"
    
    # Check if engine exists in cache
    if os.path.exists(engine_path):
        if os.access(engine_path, os.X_OK):
            os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
            print(f"✅ Using Prisma engine from cache: {engine_path}")
            return True
        else:
            print(f"⚠️ Engine exists but not executable, fixing permissions...")
            try:
                os.chmod(engine_path, 0o755)
                if os.access(engine_path, os.X_OK):
                    os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
                    print(f"✅ Fixed permissions and using engine: {engine_path}")
                    return True
            except Exception as e:
                print(f"❌ Failed to fix permissions: {e}")
    else:
        print(f"❌ Engine not found at: {engine_path}")
    
    # Try to let Prisma handle it automatically
    print("🔄 Letting Prisma auto-discover engine...")
    try:
        # Clear any existing environment variable
        if "PRISMA_QUERY_ENGINE_BINARY" in os.environ:
            del os.environ["PRISMA_QUERY_ENGINE_BINARY"]
        
        # Test connection
        from prisma import Prisma
        test_db = Prisma()
        test_db.connect()
        test_db.disconnect()
        print("✅ Prisma auto-discovered engine successfully")
        return True
    except Exception as e:
        print(f"❌ Prisma auto-discovery failed: {e}")
    
    return False

@app.on_event("startup")
async def startup():
    print("🚀 Starting application...")
    
    # Set up Prisma engine
    engine_ready = setup_prisma_engine()
    
    if engine_ready:
        try:
            await connect_prisma()
            print("✅ Database connected successfully")
            
            # Test the connection
            try:
                user_count = await prisma.user.count()
                print(f"📊 Database test successful: {user_count} users found")
            except Exception as e:
                print(f"⚠️ Database test failed: {e}")
                
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            print("⚠️ Application running without database connection")
    else:
        print("❌ Could not set up Prisma engine")
        print("⚠️ Application running without database connection")

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
    """Enhanced health check"""
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
    """Simple health check for Render"""
    return {"status": "ok", "service": settings.APP_NAME}

# ... (include ALL your existing endpoints exactly as they were)

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

class SignupData(BaseModel):
    fullName: str
    email: str
    password: str
    provider: Optional[str] = 'EMAIL'
    acceptedTerms: bool
    subscribeNewsletter: bool
    phoneNumber: Optional[str] = None
    role: Optional[str] = 'STUDENT'

class SignupResponse(BaseModel):
    message: str
    user_id: int
    verification_sent: bool

@app.post("/api/auth/register", response_model=SignupResponse)
async def register(user_data: SignupData):
    return SignupResponse(
        message="User registered successfully",
        user_id=1,
        verification_sent=True
    )

@app.post("/api/auth/check-email")
async def check_email(email: dict):
    return {"available": True}

@app.get("/api/debug/users")
async def debug_users():
    """Temporary debug endpoint to check users"""
    try:
        users = await prisma.user.find_many(take=10)
        
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

# ... (include all your other debug endpoints)

# Add a debug endpoint to check engine status
@app.get("/api/debug/engine-status")
async def debug_engine_status():
    """Check Prisma engine status"""
    info = {
        "environment": {
            "PRISMA_QUERY_ENGINE_BINARY": os.environ.get("PRISMA_QUERY_ENGINE_BINARY"),
            "PWD": os.environ.get("PWD"),
            "CWD": os.getcwd(),
        },
        "cache_path_exists": os.path.exists("/opt/render/.cache/prisma-python/binaries/5.4.2/ac9d7041ed77bcc8a8dbd2ab6616b39013829574"),
        "database_connected": False
    }
    
    try:
        # Test database connection
        user_count = await prisma.user.count()
        info["database_connected"] = True
        info["user_count"] = user_count
    except Exception as e:
        info["database_error"] = str(e)
    
    return info

app.include_router(dashboard.router, prefix=api_prefix, tags=["Dashboard"])
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
