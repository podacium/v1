from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.generated.prisma import Prisma

router = APIRouter()

@router.get("/subscriptions")
async def get_subscriptions(current_user: dict = Depends(get_current_user)):
    pass

@router.post("/subscriptions")
async def create_subscription(current_user: dict = Depends(get_current_user)):
    pass

@router.get("/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    pass