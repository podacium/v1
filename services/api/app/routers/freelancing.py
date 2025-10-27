from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.generated.prisma import Prisma

router = APIRouter()

# Projects
@router.get("/projects")
async def list_projects():
    pass

@router.post("/projects")
async def create_project(current_user: dict = Depends(get_current_user)):
    pass

@router.get("/projects/{project_id}")
async def get_project(project_id: int):
    pass

# Proposals
@router.post("/projects/{project_id}/proposals")
async def submit_proposal(project_id: int, current_user: dict = Depends(get_current_user)):
    pass

@router.get("/proposals")
async def get_user_proposals(current_user: dict = Depends(get_current_user)):
    pass

# Contracts
@router.get("/contracts")
async def get_user_contracts(current_user: dict = Depends(get_current_user)):
    pass

@router.post("/contracts/{contract_id}/deliveries")
async def submit_delivery(contract_id: int, current_user: dict = Depends(get_current_user)):
    pass