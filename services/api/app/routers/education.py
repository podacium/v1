from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.generated.prisma import Prisma

router = APIRouter()

# Paths
@router.get("/paths")
async def list_learning_paths():
    pass

@router.get("/paths/{path_id}")
async def get_learning_path(path_id: int):
    pass

@router.post("/paths/{path_id}/enroll")
async def enroll_in_path(path_id: int, current_user: dict = Depends(get_current_user)):
    pass

# Modules
@router.get("/modules")
async def list_modules():
    pass

@router.get("/modules/{module_id}")
async def get_module(module_id: int):
    pass

@router.post("/modules/{module_id}/enroll")
async def enroll_in_module(module_id: int, current_user: dict = Depends(get_current_user)):
    pass

# Lessons & Progress
@router.get("/modules/{module_id}/lessons")
async def get_module_lessons(module_id: int):
    pass

@router.post("/lessons/{lesson_id}/progress")
async def update_lesson_progress(lesson_id: int, current_user: dict = Depends(get_current_user)):
    pass

# Certificates
@router.get("/certificates")
async def get_user_certificates(current_user: dict = Depends(get_current_user)):
    pass