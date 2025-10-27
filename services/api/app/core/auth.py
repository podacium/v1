from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token_for_user,
    verify_token
)
from app.core.prisma import prisma

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

# -------------------------------
# Pydantic Models
# -------------------------------

class SignupData(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = None
    phone_number: Optional[str] = None
    accepted_terms: bool
    subscribe_newsletter: Optional[bool] = False
    provider: Optional[str] = None

class SignupResponse(BaseModel):
    message: str
    user_id: int
    verification_sent: bool

class LoginData(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    user_id: int

# -------------------------------
# Dependencies
# -------------------------------

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user = await prisma.user.find_unique(
            where={"id": int(user_id)},
            include={
                "ownedOrganization": True,
                "primaryOrganization": True,
                "memberships": {"include": {"organization": True}},
            }
        )
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user

async def get_current_active_user(current_user=Depends(get_current_user)):
    if current_user.deletedAt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_current_admin_user(current_user=Depends(get_current_active_user)):
    if current_user.role not in ["ADMIN", "INSTRUCTOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user

async def get_current_super_admin(current_user=Depends(get_current_active_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# -------------------------------
# Auth Routes
# -------------------------------

@router.post("/auth/register", response_model=SignupResponse)
async def register(user_data: SignupData):
    if not user_data.accepted_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must accept terms and conditions"
        )

    existing_user = await prisma.user.find_unique(where={"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    passwordHash = get_password_hash(user_data.password)

    try:
        user = await prisma.user.create({
            "email": user_data.email,
            "password": passwordHash,
            "fullName": user_data.full_name,
            "role": user_data.role or "STUDENT",
            "phoneNumber": user_data.phone_number,
            "acceptedTerms": user_data.accepted_terms,
            "subscribeNewsletter": user_data.subscribe_newsletter,
            "provider": user_data.provider or "EMAIL"
        })
    except Exception as db_error:
        logger.error(f"Database error during user creation: {db_error}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

    return SignupResponse(
        message="User registered successfully",
        user_id=user.id,
        verification_sent=True
    )

@router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginData):
    try:
        user = await prisma.user.find_unique(where={"email": login_data.email})
        if not user or not verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        access_token = create_access_token_for_user(user.id)

        return LoginResponse(
            access_token=access_token,
            user_id=user.id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )
