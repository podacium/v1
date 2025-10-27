from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, status, BackgroundTasks
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token_for_user,
    create_refresh_token_for_user,
    create_access_token,
    create_refresh_token,
    verify_token
)
from app.core.prisma import prisma
from app.schemas.auth import UserRegister, UserLogin, AuthProvider, UserRole
from app.services.email_service import email_service


class AuthService:
    
    async def create_user(self, user_data: UserRegister) -> Tuple[Dict[str, Any], str]:
        """Create a new user and return user data with verification token"""
        print(f"🔧 AUTH_SERVICE: Creating user with email: {user_data.email}")
        
        try:
            # Check if user already exists
            existing_filters = []
            if user_data.email:
                existing_filters.append({"email": user_data.email})
            if user_data.phoneNumber:
                existing_filters.append({"phoneNumber": user_data.phoneNumber})
            
            if existing_filters:
                existing_user = await prisma.user.find_first(where={"OR": existing_filters})
                if existing_user:
                    if existing_user.email == user_data.email:
                        raise ValueError("Email already registered")
                    if existing_user.phoneNumber == user_data.phoneNumber:
                        raise ValueError("Phone number already registered")
            
            print("✅ AUTH_SERVICE: No existing user found")
            
            # Hash the password
            password_hash = get_password_hash(user_data.password)
            print(f"🔧 AUTH_SERVICE: Password hash created: {password_hash[:20]}...")
            
            # Create user with proper field mapping
            print("🔧 AUTH_SERVICE: Creating user in database...")
            user_data_dict = {
                "fullName": user_data.fullName,
                "email": user_data.email,
                "phoneNumber": user_data.phoneNumber,
                "passwordHash": password_hash,
                "provider": user_data.provider,
                "acceptedTerms": user_data.acceptedTerms,
                "subscribeNewsletter": user_data.subscribeNewsletter,
                "role": user_data.role
            }
            print(f"🔧 AUTH_SERVICE: User data to create: {user_data_dict}")
            
            user = await prisma.user.create(data=user_data_dict)
            
            print(f"✅ AUTH_SERVICE: User created successfully with ID: {user.id}")
            
            # Create verification token
            print("🔧 AUTH_SERVICE: Creating verification token...")
            from app.core.security import create_access_token
            verification_token = create_access_token({"sub": str(user.id)})
            
            print(f"🔧 AUTH_SERVICE: Created verification token for user {user.id}")
            print(f"🔧 AUTH_SERVICE: Token type: {type(verification_token)}")
            print(f"🔧 AUTH_SERVICE: Token preview: {verification_token[:50]}...")
            
            # Store verification token
            await prisma.authtoken.create(
                data={
                    "userId": user.id,
                    "token": verification_token,
                    "type": "verification",  # Make sure this matches
                    "expiresAt": datetime.utcnow() + timedelta(days=7)
                }
            )
            print("✅ AUTH_SERVICE: Auth token stored successfully")
            
            # Convert user to dict
            user_dict = {
                "id": user.id,
                "email": user.email,
                "fullName": user.fullName,
                "role": user.role,
                "emailVerified": user.emailVerified,
                "createdAt": user.createdAt.isoformat() if user.createdAt else None
            }
            
            print("✅ AUTH_SERVICE: User creation completed successfully")
            return user_dict, verification_token
            
        except Exception as e:
            print(f"❌ AUTH_SERVICE: Failed to create user: {str(e)}")
            import traceback
            print(f"🔴 AUTH_SERVICE TRACEBACK:\n{traceback.format_exc()}")
            raise ValueError(f"Failed to create user: {str(e)}")

    async def authenticate_user(self, email: Optional[str] = None, phone_number: Optional[str] = None, password: str = None) -> Optional[Dict[str, Any]]:
        """Authenticate user with email/phone and password"""
        if not email and not phone_number:
            raise ValueError("Either email or phone number is required")
        
        # Find user by email or phone
        where_filters = []
        if email:
            where_filters.append({"email": email})
        if phone_number:
            where_filters.append({"phoneNumber": phone_number})
        
        user = await prisma.user.find_first(
            where={"OR": where_filters},
            include={
                "ownedOrganization": True,
                "primaryOrganization": True
            }
        )
        
        print(f"🔧 AUTH_SERVICE: User found: {user.id if user else 'None'}")
        print(f"🔧 AUTH_SERVICE: User password hash: {user.passwordHash if user else 'None'}")
        
        if not user:
            return None
        
        if not user.passwordHash:
            print("❌ AUTH_SERVICE: No password hash found for user")
            return None
        
        # Verify password
        password_valid = verify_password(password, user.passwordHash)
        print(f"🔧 AUTH_SERVICE: Password verification result: {password_valid}")
        
        if not password_valid:
            return None
        
        if user.deletedAt:
            raise ValueError("Account is deactivated")
        
        # Update last login
        await prisma.user.update(
            where={"id": user.id},
            data={"updatedAt": datetime.utcnow()}
        )
        
        return user.dict()
    
    async def verify_email(self, token: str) -> bool:
        """Verify user email using token"""
        print(f"🔧 AUTH_SERVICE: Verifying email with token: {token[:20]}...")
        
        try:
            payload = verify_token(token)
            print(f"🔧 AUTH_SERVICE: Token payload: {payload}")
            
            if not payload:
                print("❌ AUTH_SERVICE: Token verification failed - no payload")
                return False
            
            user_id = payload.get("sub")
            if not user_id:
                print("❌ AUTH_SERVICE: No user ID in token payload")
                return False

            print(f"🔧 AUTH_SERVICE: Looking for user ID: {user_id}")
            
            # Verify token exists and is valid
            auth_token = await prisma.authtoken.find_first(
                where={
                    "token": token,
                    "type": "verification", 
                    "usedAt": None,
                    "expiresAt": {"gt": datetime.utcnow()}
                }
            )
            
            print(f"🔧 AUTH_SERVICE: Auth token found: {auth_token is not None}")
            
            if not auth_token:
                print("❌ AUTH_SERVICE: No valid auth token found in database")
                return False
            
            # Update user email verification status
            await prisma.user.update(
                where={"id": int(user_id)},
                data={"emailVerified": True}
            )
            
            print(f"✅ AUTH_SERVICE: Email verified for user ID: {user_id}")
            
            # Mark token as used
            await prisma.authtoken.update(
                where={"id": auth_token.id},
                data={"usedAt": datetime.utcnow()}
            )
            
            return True
            
        except Exception as e:
            print(f"❌ AUTH_SERVICE: Email verification error: {str(e)}")
            import traceback
            print(f"🔴 TRACEBACK: {traceback.format_exc()}")
            return False
    
    async def create_password_reset_token(self, email: str) -> Optional[str]:
        """Create password reset token for user"""
        user = await prisma.user.find_unique(where={"email": email})
        if not user:
            return None
        
        # Create reset token
        reset_token = create_access_token({"sub": str(user.id)})
        
        # Store reset token
        await prisma.authtoken.create(
            data={
                "userId": user.id,
                "token": reset_token,
                "type": "password_reset",
                "expiresAt": datetime.utcnow() + timedelta(hours=24)
            }
        )
        
        return reset_token
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using token"""
        payload = verify_token(token)
        if not payload:
            return False
        
        user_id = payload.get("sub")
        if not user_id:
            return False
        
        # Verify token exists and is valid
        auth_token = await prisma.authtoken.find_first(
            where={
                "token": token,
                "type": "password_reset",
                "usedAt": None,
                "expiresAt": {"gt": datetime.utcnow()}
            }
        )
        
        if not auth_token:
            return False
        
        # Update password
        await prisma.user.update(
            where={"id": int(user_id)},
            data={"passwordHash": get_password_hash(new_password)}
        )
        
        # Mark token as used
        await prisma.authtoken.update(
            where={"id": auth_token.id},
            data={"usedAt": datetime.utcnow()}
        )
        
        return True
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        user = await prisma.user.find_unique(where={"email": email})
        return user.dict() if user else None
    
    # New methods for the enhanced approach
    async def register_user(self, user_data: UserRegister, background_tasks: BackgroundTasks) -> Dict[str, Any]:
        """Enhanced register method that returns tokens quickly"""
        user, verification_token = await self.create_user(user_data)
        
        # Send verification email in background
        if user_data.email:
            background_tasks.add_task(
                email_service.send_verification_email, 
                user_data.email, 
                verification_token,
                user_data.fullName
            )
        
        # Create tokens for immediate login
        access_token = create_access_token_for_user(user["id"])
        refresh_token = create_refresh_token_for_user(user["id"])
        
        return {
            "user": user,
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": 1800
            }
        }
    
    async def authenticate_user_enhanced(self, login_data: UserLogin) -> Dict[str, Any]:
        """Enhanced authenticate method that returns tokens"""
        user = await self.authenticate_user(
            email=login_data.email,
            phone_number=login_data.phoneNumber,
            password=login_data.password
        )
        
        if not user:
            raise ValueError("Invalid credentials")
        
        # Create tokens
        access_token = create_access_token_for_user(user["id"])
        refresh_token = create_refresh_token_for_user(user["id"])
        
        return {
            "user": user,
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": 1800
            }
        }
    
    async def refresh_tokens(self, refresh_token: str) -> Dict[str, str]:
        """Refresh access token using refresh token"""
        payload = verify_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")
        
        # Verify user still exists
        user = await prisma.user.find_unique(where={"id": int(user_id)})
        if not user or user.deletedAt:
            raise ValueError("User not found")
        
        # Create new tokens
        new_access_token = create_access_token_for_user(user_id)
        new_refresh_token = create_refresh_token_for_user(user_id)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": 1800
        }
    
    async def request_password_reset(self, email: str):
        """Request password reset (enhanced method)"""
        return await self.create_password_reset_token(email)

# Singleton instance
auth_service = AuthService()