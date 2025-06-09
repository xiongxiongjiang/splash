"""
Admin Authentication Backend for SQLAdmin
Working implementation with essential logging
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
import logging

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pre-hash the admin password
ADMIN_PASSWORD_HASH = pwd_context.hash("admin123")

# In-memory session store (use Redis in production)
active_sessions = {}

# Admin users (in production, store in database)
ADMIN_USERS = {
    "admin": {
        "username": "admin", 
        "password_hash": ADMIN_PASSWORD_HASH,
        "name": "System Administrator"
    }
}

class AdminAuthBackend(AuthenticationBackend):
    """SQLAdmin authentication backend"""
    
    async def login(self, request: Request) -> bool:
        """Handle admin login"""
        try:
            # Get form data
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
            
            if not username or not password:
                logger.warning("Login attempt with missing credentials")
                return False
            
            # Check if user exists
            if username not in ADMIN_USERS:
                logger.warning(f"Login attempt with invalid username: {username}")
                return False
            
            admin_user = ADMIN_USERS[username]
            
            # Verify password
            if not pwd_context.verify(password, admin_user["password_hash"]):
                logger.warning(f"Login attempt with invalid password for: {username}")
                return False
            
            # Create session
            session_token = secrets.token_urlsafe(32)
            active_sessions[session_token] = {
                "username": username,
                "created_at": datetime.now(),
                "expires_at": datetime.now() + timedelta(hours=8)
            }
            
            # Store session in request
            request.session.update({
                "admin_session": session_token,
                "username": username
            })
            
            logger.info(f"✅ Admin login successful: {username}")
            return True
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return False
    
    async def logout(self, request: Request) -> bool:
        """Handle admin logout"""
        try:
            session_token = request.session.get("admin_session")
            
            if session_token and session_token in active_sessions:
                username = active_sessions[session_token]["username"]
                del active_sessions[session_token]
                logger.info(f"🚪 Admin logout: {username}")
            
            request.session.clear()
            return True
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return False
    
    async def authenticate(self, request: Request) -> bool:
        """Check if user is authenticated"""
        try:
            session_token = request.session.get("admin_session")
            
            if not session_token or session_token not in active_sessions:
                return False
            
            session = active_sessions[session_token]
            
            # Check if session expired
            if datetime.now() > session["expires_at"]:
                username = session["username"]
                del active_sessions[session_token]
                request.session.clear()
                logger.info(f"⏰ Session expired for: {username}")
                return False
            
            # Session is valid
            return True
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return False 