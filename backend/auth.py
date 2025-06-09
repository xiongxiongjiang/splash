import httpx
import logging
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session, get_user_by_supabase_id, create_user, update_user_last_seen
from models import User

logger = logging.getLogger(__name__)

# Supabase configuration - you'll need to set these
SUPABASE_URL = "https://osugovugrrthcqelvagj.supabase.co"
SUPABASE_JWT_SECRET = None  # We'll fetch this from Supabase

security = HTTPBearer()

class SupabaseAuth:
    def __init__(self):
        self.jwt_secret = None
        self.jwks = None
    
    async def get_jwt_secret(self):
        """Fetch JWT secret from Supabase"""
        if self.jwt_secret:
            return self.jwt_secret
            
        try:
            # For now, we'll use a simple approach - you should set this as an environment variable
            # In production, you'd get this from your Supabase project settings
            async with httpx.AsyncClient() as client:
                # This would be the JWKS endpoint, but for now we'll use a placeholder
                # You need to get your actual JWT secret from Supabase Dashboard > Settings > API
                self.jwt_secret = "your-jwt-secret-here"  # Replace with actual secret
                return self.jwt_secret
        except Exception as e:
            logger.error(f"Failed to get JWT secret: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service unavailable"
            )

supabase_auth = SupabaseAuth()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Supabase JWT token and return user claims"""
    try:
        token = credentials.credentials
        
        # For development, we'll do a simple verification
        # In production, you should verify against Supabase's JWT secret
        # For now, let's decode without verification (NOT RECOMMENDED FOR PRODUCTION)
        
        # Decode without verification for development (UNSAFE FOR PRODUCTION)
        unverified_payload = jwt.get_unverified_claims(token)
        
        # Extract user information
        user_id = unverified_payload.get("sub")
        email = unverified_payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user information"
            )
        
        return {
            "user_id": user_id,
            "email": email,
            "name": unverified_payload.get("user_metadata", {}).get("name"),
            "role": unverified_payload.get("role", "user")
        }
        
    except JWTError as e:
        logger.error(f"JWT Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def get_current_user(
    token_data: dict = Depends(verify_token),
    session: AsyncSession = Depends(get_session)
) -> User:
    """Get or create current user from token data"""
    try:
        # Try to get existing user
        user = await get_user_by_supabase_id(session, token_data["user_id"])
        
        if not user:
            # Create new user if doesn't exist
            user_data = {
                "supabase_id": token_data["user_id"],
                "email": token_data["email"],
                "name": token_data.get("name")
            }
            user = await create_user(session, user_data)
            logger.info(f"Created new user: {user.email}")
        else:
            # Update last seen
            await update_user_last_seen(session, token_data["user_id"])
        
        return user
        
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )

# For endpoints that require admin access
async def get_admin_user(user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

# Optional authentication (for endpoints that work with or without auth)
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    session: AsyncSession = Depends(get_session)
) -> Optional[User]:
    """Get user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        token_data = await verify_token(credentials)
        user = await get_user_by_supabase_id(session, token_data["user_id"])
        
        if user:
            await update_user_last_seen(session, token_data["user_id"])
        
        return user
    except HTTPException:
        return None 