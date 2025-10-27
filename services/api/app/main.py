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

def ensure_prisma_engine():
    """Ensure Prisma engine is available and set up correctly"""
    print("🔧 Ensuring Prisma engine is available...")
    
    # Check if engine exists in current directory
    engine_path = "./prisma-query-engine-debian-openssl-3.0.x"
    
    if os.path.exists(engine_path):
        if os.access(engine_path, os.X_OK):
            os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
            print(f"✅ Using Prisma engine from current directory: {engine_path}")
            return True
        else:
            print(f"⚠️ Engine exists but not executable, making it executable...")
            try:
                os.chmod(engine_path, 0o755)
                if os.access(engine_path, os.X_OK):
                    os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
                    print(f"✅ Made engine executable: {engine_path}")
                    return True
            except Exception as e:
                print(f"❌ Failed to make engine executable: {e}")
    else:
        print(f"❌ Engine not found in current directory: {engine_path}")
        
        # Try to find and copy the engine
        try:
            print("🔄 Searching for Prisma engine in system...")
            result = subprocess.run([
                "find", "/opt/render", "-name", "prisma-query-engine-debian-openssl-3.0.x", "-type", "f"
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0 and result.stdout.strip():
                found_paths = [p.strip() for p in result.stdout.strip().split('\n') if p.strip()]
                print(f"🔍 Found engines at: {found_paths}")
                
                for found_path in found_paths:
                    if os.path.exists(found_path):
                        print(f"🔄 Copying engine from {found_path} to current directory...")
                        subprocess.run(["cp", found_path, "./"], check=True)
                        
                        if os.path.exists(engine_path):
                            os.chmod(engine_path, 0o755)
                            os.environ["PRISMA_QUERY_ENGINE_BINARY"] = engine_path
                            print(f"✅ Copied and using engine: {engine_path}")
                            return True
        except Exception as e:
            print(f"❌ Engine search and copy failed: {e}")
    
    return False

# Enhanced startup with proper engine setup
@app.on_event("startup")
async def startup():
    print("🚀 Starting application...")
    
    # First ensure Prisma engine is available
    engine_ready = ensure_prisma_engine()
    
    if engine_ready:
        try:
            await connect_prisma()
            print("✅ Database connected successfully")
            
            # Verify connection works
            try:
                user_count = await prisma.user.count()
                print(f"📊 Database verified: {user_count} users found")
            except Exception as e:
                print(f"⚠️ Database verification failed: {e}")
                
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

# ... (keep all your existing endpoints exactly as they were)

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

@app.get("/api/debug/engine-location")
async def debug_engine_location():
    """Debug endpoint to check engine location"""
    import subprocess
    
    info = {
        "current_directory": os.getcwd(),
        "files_in_current_dir": os.listdir('.'),
        "engine_in_current_dir": os.path.exists("./prisma-query-engine-debian-openssl-3.0.x"),
        "environment_vars": {
            "PRISMA_QUERY_ENGINE_BINARY": os.environ.get("PRISMA_QUERY_ENGINE_BINARY"),
            "PWD": os.environ.get("PWD")
        }
    }
    
    # Search for engines in system
    try:
        result = subprocess.run([
            "find", "/opt/render", "-name", "prisma-query-engine-*", "-type", "f"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            info["found_engines"] = result.stdout.strip().split('\n') if result.stdout.strip() else []
    except Exception as e:
        info["search_error"] = str(e)
    
    return info

app.include_router(dashboard.router, prefix=api_prefix, tags=["Dashboard"])
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
