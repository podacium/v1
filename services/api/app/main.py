from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
import os
import subprocess
import sys
from pathlib import Path
import glob

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

def find_prisma_engine():
    """Find Prisma engine binary using multiple methods"""
    print("🔍 Searching for Prisma engine...")
    
    # Method 1: Check common cache locations
    cache_patterns = [
        "/opt/render/.cache/prisma-python/binaries/*/prisma-query-engine-*",
        "/root/.cache/prisma-python/binaries/*/prisma-query-engine-*",
        os.path.expanduser("~/.cache/prisma-python/binaries/*/prisma-query-engine-*"),
    ]
    
    for pattern in cache_patterns:
        matches = glob.glob(pattern)
        for match in matches:
            if os.path.exists(match) and os.access(match, os.X_OK):
                print(f"✅ Found engine via pattern: {match}")
                return match
    
    # Method 2: Search in entire filesystem for the engine (limited scope)
    search_paths = [
        "/opt/render/.cache/",
        "/root/.cache/",
        "/tmp/",
        os.getcwd(),
    ]
    
    for search_path in search_paths:
        if os.path.exists(search_path):
            try:
                for root, dirs, files in os.walk(search_path):
                    for file in files:
                        if file.startswith("prisma-query-engine-"):
                            full_path = os.path.join(root, file)
                            if os.access(full_path, os.X_OK):
                                print(f"✅ Found engine via filesystem search: {full_path}")
                                return full_path
            except Exception as e:
                print(f"⚠️ Search in {search_path} failed: {e}")
    
    # Method 3: Use prisma CLI to find the engine
    try:
        result = subprocess.run([
            sys.executable, "-m", "prisma", "py", "debug"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            # Parse the debug output to find engine path
            for line in result.stdout.split('\n'):
                if 'engine' in line.lower() and 'path' in line.lower():
                    print(f"🔧 Debug info: {line}")
    except Exception as e:
        print(f"⚠️ Prisma debug failed: {e}")
    
    return None

def setup_prisma_engine():
    """Ensure Prisma engine is properly set up with correct paths"""
    print("🔧 Setting up Prisma engine...")
    
    # First, try to find existing engine
    engine_path = find_prisma_engine()
    
    if engine_path:
        os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
        print(f"✅ Using Prisma engine: {engine_path}")
        return True
    
    # If no engine found, fetch it
    print("🔄 No engine found, fetching Prisma engine...")
    try:
        # Force fetch with explicit output
        result = subprocess.run([
            sys.executable, "-m", "prisma", "py", "fetch", "--force"
        ], capture_output=True, text=True, timeout=120)
        
        print(f"📦 Fetch stdout: {result.stdout}")
        if result.stderr:
            print(f"📦 Fetch stderr: {result.stderr}")
        
        if result.returncode == 0:
            print("✅ Prisma engine fetched successfully")
            
            # Try to find the engine again after fetch
            engine_path = find_prisma_engine()
            if engine_path:
                os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
                print(f"✅ Using fetched Prisma engine: {engine_path}")
                return True
            else:
                print("❌ Engine fetched but still not found")
        else:
            print(f"❌ Prisma fetch failed with code: {result.returncode}")
            
    except subprocess.TimeoutExpired:
        print("❌ Prisma fetch timed out")
    except Exception as e:
        print(f"❌ Prisma fetch error: {e}")
    
    return False

async def ensure_prisma_engine():
    """Ensure Prisma query engine is available before connecting"""
    max_retries = 2
    
    # First, try to set up the engine path
    engine_setup = setup_prisma_engine()
    
    for attempt in range(max_retries):
        try:
            print(f"🔄 Attempt {attempt + 1}/{max_retries}: Testing Prisma engine...")
            
            # Try to connect to check if engine works
            await prisma.connect()
            
            # Test a simple query
            user_count = await prisma.user.count()
            print(f"✅ Prisma engine is working (found {user_count} users)")
            
            await prisma.disconnect()
            return True
            
        except Exception as e:
            print(f"❌ Prisma engine issue (attempt {attempt + 1}): {e}")
            
            if attempt < max_retries - 1:
                print("🔄 Retrying engine setup...")
                engine_setup = setup_prisma_engine()
                time.sleep(3)
            
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

# Add this new debug endpoint to help diagnose the engine location
@app.get("/api/debug/engine-search")
async def debug_engine_search():
    """Search for Prisma engine in various locations"""
    import glob
    
    search_results = {}
    
    # Search patterns
    patterns = [
        "/opt/render/.cache/prisma-python/binaries/*/prisma-query-engine-*",
        "/root/.cache/prisma-python/binaries/*/prisma-query-engine-*",
        "/tmp/prisma-query-engine-*",
        "./prisma-query-engine-*",
    ]
    
    for pattern in patterns:
        matches = glob.glob(pattern)
        search_results[pattern] = {
            "matches": matches,
            "exists": len(matches) > 0
        }
        for match in matches:
            search_results[pattern]["details"] = {
                "path": match,
                "exists": os.path.exists(match),
                "executable": os.access(match, os.X_OK),
                "size": os.path.getsize(match) if os.path.exists(match) else 0
            }
    
    # Also check environment
    search_results["environment"] = {
        "PRISMA_QUERY_ENGINE_BINARY": os.environ.get("PRISMA_QUERY_ENGINE_BINARY"),
        "PWD": os.environ.get("PWD"),
        "CWD": os.getcwd(),
    }
    
    # List files in cache directory
    cache_dirs = [
        "/opt/render/.cache/prisma-python/",
        "/root/.cache/prisma-python/",
    ]
    
    for cache_dir in cache_dirs:
        if os.path.exists(cache_dir):
            try:
                files = []
                for root, dirs, filenames in os.walk(cache_dir):
                    for filename in filenames:
                        files.append(os.path.join(root, filename))
                search_results[f"cache_contents_{cache_dir}"] = files[:10]  # Limit output
            except Exception as e:
                search_results[f"cache_contents_{cache_dir}"] = f"Error: {e}"
    
    return search_results

# ... (keep all your existing endpoints the same as before)
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

# ... (include all your other existing endpoints)

app.include_router(dashboard.router, prefix=api_prefix, tags=["Dashboard"])
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
