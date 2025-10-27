from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer
from app.schemas.auth import (
    UserRegister, UserLogin, Token, PasswordResetRequest, 
    PasswordReset, EmailVerificationRequest, UserResponse,
    RefreshTokenRequest
)
from app.services.auth_service import auth_service
from app.services.email_service import EmailService
from app.core.auth import get_current_active_user
from app.core.security import (
    create_access_token_for_user, 
    create_refresh_token_for_user,
    verify_token,
    create_access_token,
    create_refresh_token,
)
from app.core.security import verify_password
from app.core.prisma import prisma
import logging
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    background_tasks: BackgroundTasks
):
    """Register a new user (compatible with existing frontend)"""
    email_service = EmailService()
    
    try:
        print(f"🔧 ROUTER DEBUG: Registration request received")
        print(f"🔧 ROUTER DEBUG: User data validated: {user_data.dict()}")
        
        user, verification_token = await auth_service.create_user(user_data)
        
        print(f"✅ ROUTER DEBUG: User created successfully with ID: {user['id']}")
        
        # Send verification email in background
        if user_data.email and user_data.provider == "EMAIL":
            background_tasks.add_task(
                email_service.send_verification_email,
                user_data.email,
                verification_token,
                user_data.fullName
            )
        
        return {
            "message": "User registered successfully",
            "user_id": user["id"],
            "verification_sent": bool(user_data.email)
        }
    
    except ValueError as e:
        print(f"❌ ROUTER DEBUG: Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"❌ ROUTER DEBUG: Unexpected registration error: {e}")
        import traceback
        error_details = traceback.format_exc()
        print(f"🔴 FULL TRACEBACK:\n{error_details}")
        
        # Return the actual error to frontend for debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login(login_data: UserLogin):
    """User login"""
    try:
        print(f"🔧 LOGIN DEBUG: Starting login for {login_data.email}")
        print(f"🔧 LOGIN DEBUG: Login data: {login_data.dict()}")
        
        # Find user by email
        user = await prisma.user.find_unique(where={"email": login_data.email})
        print(f"🔧 LOGIN DEBUG: User found: {user.id if user else 'None'}")
        
        if not user:
            print("❌ LOGIN DEBUG: User not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        print(f"🔧 LOGIN DEBUG: User details - ID: {user.id}, Email: {user.email}")
        print(f"🔧 LOGIN DEBUG: Password hash: {user.passwordHash}")
        
        # Verify password
        print(f"🔧 LOGIN DEBUG: Verifying password...")
        from app.core.security import verify_password
        password_valid = verify_password(login_data.password, user.passwordHash)
        print(f"🔧 LOGIN DEBUG: Password verification result: {password_valid}")
        
        if not password_valid:
            print("❌ LOGIN DEBUG: Password verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        print("✅ LOGIN DEBUG: Password verified successfully")
        
        # Check if user is active
        if user.deletedAt:
            print("❌ LOGIN DEBUG: User account is deactivated")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account deactivated"
            )

        print("✅ LOGIN DEBUG: User account is active")
        
        # Create tokens
        print("🔧 LOGIN DEBUG: Creating access token...")
        access_token = create_access_token_for_user(user.id)
        print("🔧 LOGIN DEBUG: Creating refresh token...")
        refresh_token = create_refresh_token_for_user(user.id)
        
        print(f"✅ LOGIN DEBUG: Tokens created successfully")
        print(f"🔧 LOGIN DEBUG: Access token: {access_token[:50]}...")
        print(f"🔧 LOGIN DEBUG: Refresh token: {refresh_token[:50]}...")

        # Update last login
        await prisma.user.update(
            where={"id": user.id},
            data={"lastLoginAt": datetime.utcnow()}
        )

        print("✅ LOGIN DEBUG: Login completed successfully")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 1800
        }

    except HTTPException as he:
        print(f"❌ LOGIN DEBUG: HTTPException: {he.detail}")
        raise he
    except Exception as e:
        print(f"❌ LOGIN DEBUG: Unexpected exception: {str(e)}")
        import traceback
        print(f"🔴 LOGIN TRACEBACK:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )
    
@router.post("/verify-email")
async def verify_email(verification_data: EmailVerificationRequest):
    """Verify email address"""
    success = await auth_service.verify_email(verification_data.token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    return {"message": "Email verified successfully"}

@router.post("/forgot-password")
async def forgot_password(
    reset_request: PasswordResetRequest,
    background_tasks: BackgroundTasks
):
    """Request password reset email"""
    email_service = EmailService()
    
    try:
        print(f"🔐 Forgot password request for: {reset_request.email}")
        
        reset_token = await auth_service.create_password_reset_token(reset_request.email)
        
        if reset_token:
            # Get user for name
            user = await auth_service.get_user_by_email(reset_request.email)
            if user:
                background_tasks.add_task(
                    email_service.send_password_reset_email,
                    reset_request.email,
                    reset_token,
                    user["fullName"]
                )
                print(f"✅ Password reset email sent to: {reset_request.email}")
        
        # Always return success to prevent email enumeration
        return {"message": "If the email exists, a reset link has been sent"}
    
    except Exception as e:
        print(f"❌ Forgot password error: {e}")
        # Still return success to prevent email enumeration
        return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset):
    """Reset password using token"""
    try:
        print(f"🔐 Password reset attempt with token")
        
        success = await auth_service.reset_password(
            reset_data.token, 
            reset_data.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        print("✅ Password reset successful")
        return {"message": "Password reset successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset failed"
        )

@router.post("/refresh-token", response_model=Token)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        tokens = await auth_service.refresh_tokens(request.refresh_token)
        return tokens
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_active_user)):
    """Logout user (client should discard tokens)"""
    return {"message": "Logged out successfully"}

# Additional endpoints for enhanced functionality
@router.post("/register-with-tokens", response_model=Token)
async def register_with_tokens(
    user_data: UserRegister, 
    background_tasks: BackgroundTasks
):
    """Alternative registration that returns tokens immediately"""
    email_service = EmailService()
    
    try:
        result = await auth_service.register_user(user_data)
        
        # Send verification email in background
        if user_data.email and user_data.provider == "EMAIL":
            # In a real implementation, you'd need to get the verification token
            # For now, we'll use a placeholder or modify the service to return it
            verification_token = "need_to_implement"  # You'd extract this from the service
            background_tasks.add_task(
                email_service.send_verification_email,
                user_data.email,
                verification_token,
                user_data.fullName
            )
        
        return result["tokens"]
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
# In your auth router (auth.py), add:
@router.post("/debug/check-token")
async def debug_check_token(token: str):
    """Debug endpoint to check token validity"""
    try:
        from app.core.security import verify_token
        payload = verify_token(token)
        
        # Check if token exists in database
        auth_token = await prisma.authtoken.find_first(
            where={
                "token": token,
                "usedAt": None,
                "expiresAt": {"gt": datetime.utcnow()}
            }
        )
        
        return {
            "token_valid": payload is not None,
            "payload": payload,
            "in_database": auth_token is not None,
            "token_type": auth_token.type if auth_token else None,
            "expired": auth_token.expiresAt < datetime.utcnow() if auth_token else None,
            "used": auth_token.usedAt is not None if auth_token else None
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/login-enhanced", response_model=Token)
async def login_enhanced(login_data: UserLogin):
    """Enhanced login using the service method"""
    try:
        result = await auth_service.authenticate_user_enhanced(login_data)
        return result["tokens"]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )