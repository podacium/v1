from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    pass

@router.get("/{file_id}")
async def get_file(file_id: int):
    pass