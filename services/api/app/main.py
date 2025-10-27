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
    """Set up Prisma engine with known path from build"""
    print("🔧 Setting up Prisma engine...")
    
    # Known path from build logs
    engine_path = "/opt/render/.cache/prisma-python/binaries/5.4.2/ac9d7041ed77bcc8a8dbd2ab6616b39013829574/prisma-query-engine-debian-openssl-3.0.x"
    
    # Check if engine exists at known location
    if os.path.exists(engine_path):
        if os.access(engine_path, os.X_OK):
            os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
            print(f"✅ Using Prisma engine from build cache: {engine_path}")
            return True
        else:
            print(f"⚠️ Engine exists but not executable: {engine_path}")
            # Try to make it executable
            try:
                os.chmod(engine_path, 0o755)
                if os.access(engine_path, os.X_OK):
                    os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
                    print(f"✅ Made engine executable: {engine_path}")
                    return True
            except Exception as e:
                print(f"❌ Failed to make engine executable: {e}")
    else:
        print(f"❌ Engine not found at expected path: {engine_path}")
        
        # Try alternative locations
        alternative_paths = [
            # Check current directory
            "./prisma-query-engine-debian-openssl-3.0.x",
            # Check in app directory
            "./app/prisma-query-engine-debian-openssl-3.0.x",
            # Check in generated directory
            "./app/generated/prisma/prisma-query-engine-debian-openssl-3.0.x",
        ]
        
        for alt_path in alternative_paths:
            if os.path.exists(alt_path) and os.access(alt_path, os.X_OK):
                os.environ["PRISMA_QUERY_ENGINE_BINARY"] = alt_path
                print(f"✅ Using Prisma engine from alternative location: {alt_path}")
                return True
    
    # Last resort: try to copy from build cache to current directory
    print("🔄 Attempting to locate engine in filesystem...")
    try:
        # Use find command to locate the engine
        result = subprocess.run([
            "find", "/opt/render", "-name", "prisma-query-engine-debian-openssl-3.0.x", "-type", "f"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and result.stdout.strip():
            found_paths = result.stdout.strip().split('\n')
            for found_path in found_paths:
                if os.path.exists(found_path) and os.access(found_path, os.X_OK):
                    os.environ["PRISMA_QUERY_ENGINE_BINARY"] = found_path
                    print(f"✅ Found Prisma engine via find: {found_path}")
                    return True
    except Exception as e:
        print(f"⚠️ Find command failed: {e}")
    
    return False

async def ensure_prisma_engine():
    """Ensure Prisma query engine is available"""
    print("🔄 Testing Prisma engine...")
    
    # Set up engine path
    engine_setup = setup_prisma_engine()
    
    if not engine_setup:
        print("❌ Could not set up Prisma engine path")
        return False
    
    try:
        # Try to connect
        await prisma.connect()
        
        # Test a simple query
        user_count = await prisma.user.count()
        print(f"✅ Prisma engine is working (found {user_count} users)")
        
        await prisma.disconnect()
        return True
        
    except Exception as e:
        print(f"❌ Prisma engine test failed: {e}")
        return False

# Prisma startup/shutdown
@app.on_event("startup")
async def startup():
    print("🚀 Starting application...")
    
    # Try to set up Prisma engine
    engine_ready = await ensure_prisma_engine()
    
    if engine_ready:
        try:
            # Connect properly
            await connect_prisma()
            print("✅ Database connected successfully")
            
            # Test the connection
            user_count = await prisma.user.count()
            print(f"📊 Database test: {user_count} users found")
            
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            print("⚠️ Application running in limited mode")
    else:
        print("⚠️ Starting without database connection - some features may not work")

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

# Enhanced debug endpoint
@app.get("/api/debug/engine-info")
async def debug_engine_info():
    """Get detailed Prisma engine information"""
    import subprocess
    
    info = {
        "environment": {
            "PRISMA_QUERY_ENGINE_BINARY": os.environ.get("PRISMA_QUERY_ENGINE_BINARY"),
            "PWD": os.environ.get("PWD"),
            "CWD": os.getcwd(),
        },
        "known_paths": {},
        "find_results": None
    }
    
    # Check known paths
    known_paths = [
        "/opt/render/.cache/prisma-python/binaries/5.4.2/ac9d7041ed77bcc8a8dbd2ab6616b39013829574/prisma-query-engine-debian-openssl-3.0.x",
        "./prisma-query-engine-debian-openssl-3.0.x",
        "./app/prisma-query-engine-debian-openssl-3.0.x",
        "./app/generated/prisma/prisma-query-engine-debian-openssl-3.0.x",
    ]
    
    for path in known_paths:
        exists = os.path.exists(path)
        info["known_paths"][path] = {
            "exists": exists,
            "executable": os.access(path, os.X_OK) if exists else False,
            "size": os.path.getsize(path) if exists else 0
        }
    
    # Try to find engine in filesystem
    try:
        result = subprocess.run([
            "find", "/opt/render", "-name", "prisma-query-engine-*", "-type", "f", "-executable"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            info["find_results"] = result.stdout.strip().split('\n') if result.stdout.strip() else []
    except Exception as e:
        info["find_error"] = str(e)
    
    return info

# ... (keep all your existing endpoints the same)

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

# ... (include all your other endpoints)

app.include_router(dashboard.router, prefix=api_prefix, tags=["Dashboard"])
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
