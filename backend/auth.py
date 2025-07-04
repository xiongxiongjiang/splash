"""
Authentication utilities for FastAPI with Supabase
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
from database import SupabaseSession

from database import get_session, get_user_by_supabase_id, create_user, update_user_last_seen
from models import User
import logging
import os

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Supabase JWT settings
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
ALGORITHM = "HS256"

# Derive issuer from Supabase URL
SUPABASE_ISSUER = f"{SUPABASE_URL}/auth/v1" if SUPABASE_URL else ""
SUPABASE_AUDIENCE = os.getenv("SUPABASE_AUDIENCE", "authenticated")


def verify_supabase_token(token: str) -> dict:
    """
    Verify Supabase JWT token with proper verification options
    """
    try:
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT secret not configured"
            )
        
        if not SUPABASE_ISSUER:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase URL not configured"
            )
        
        # Verify JWT with proper security checks
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=[ALGORITHM],
            audience=SUPABASE_AUDIENCE,  # ✅ Verify audience for security
            issuer=SUPABASE_ISSUER,      # ✅ Verify issuer for security
            options={
                "verify_aud": True,   # ✅ Enable audience verification
                "verify_iss": True,   # ✅ Enable issuer verification
                "verify_exp": True,   # ✅ Verify token expiration
                "verify_signature": True  # ✅ Verify token signature
            }
        )
        return payload
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def create_or_get_user(supabase_payload: dict, session: SupabaseSession) -> User:
    """
    Create user if doesn't exist, or get existing user
    """
    supabase_id = supabase_payload.get("sub")
    email = supabase_payload.get("email")
    
    if not supabase_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token payload"
        )
    
    # Try to get existing user
    user = await get_user_by_supabase_id(session, supabase_id)
    
    if not user:
        # Create new user
        user_data = {
            "supabase_id": supabase_id,
            "email": email,
            "name": supabase_payload.get("user_metadata", {}).get("full_name", email.split("@")[0])
        }
        user = await create_user(session, user_data)
    else:
        # Update last seen
        await update_user_last_seen(session, supabase_id)
    
    return User.model_validate(user)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: SupabaseSession = Depends(get_session)
) -> User:
    """
    Get current user from JWT token
    """
    try:
        # Verify token
        payload = verify_supabase_token(credentials.credentials)
        
        # Get or create user
        user = await create_or_get_user(payload, session)
        
        return user
        
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: SupabaseSession = Depends(get_session)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Verify that the current user is an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    
    return current_user 