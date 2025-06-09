"""
SQLAdmin Interface Configuration
Clean production-ready version
"""

from sqladmin import Admin, ModelView
from sqlalchemy.ext.asyncio import AsyncEngine
from models import User, Resume
from admin_auth import AdminAuthBackend
from starlette.middleware.sessions import SessionMiddleware
import secrets
import logging

logger = logging.getLogger(__name__)

class UserAdmin(ModelView, model=User):
    """Admin interface for User model"""
    
    column_list = [User.id, User.email, User.name, User.role, User.created_at, User.last_seen]
    column_searchable_list = [User.email, User.name]
    column_filters = [User.role, User.created_at]
    column_sortable_list = [User.id, User.email, User.name, User.created_at, User.last_seen]
    column_default_sort = [(User.created_at, True)]
    
    form_columns = [User.email, User.name, User.role]
    column_details_list = [User.id, User.supabase_id, User.email, User.name, User.role, User.created_at, User.last_seen]
    
    page_size = 25
    page_size_options = [25, 50, 100]
    
    can_create = False  # Users created via OAuth
    can_edit = True
    can_delete = False
    can_view_details = True
    can_export = True
    
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-users"

class ResumeAdmin(ModelView, model=Resume):
    """Admin interface for Resume model"""
    
    column_list = [Resume.id, Resume.name, Resume.email, Resume.title, Resume.experience_years, Resume.created_at]
    column_searchable_list = [Resume.name, Resume.email, Resume.title, Resume.summary]
    column_filters = [Resume.experience_years, Resume.created_at, Resume.title]
    column_sortable_list = [Resume.id, Resume.name, Resume.email, Resume.experience_years, Resume.created_at]
    column_default_sort = [(Resume.created_at, True)]
    
    form_columns = [Resume.name, Resume.email, Resume.phone, Resume.title, Resume.experience_years, Resume.skills, Resume.education, Resume.summary]
    column_details_list = [Resume.id, Resume.name, Resume.email, Resume.phone, Resume.title, Resume.experience_years, Resume.skills, Resume.education, Resume.summary, Resume.user_id, Resume.created_at]
    
    page_size = 25
    page_size_options = [25, 50, 100]
    
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True
    can_export = True
    
    name = "Resume"
    name_plural = "Resumes" 
    icon = "fa-solid fa-file-text"

def create_admin(app, engine: AsyncEngine) -> Admin:
    """Create SQLAdmin interface with authentication"""
    
    # Add session middleware (required for authentication)
    secret_key = secrets.token_urlsafe(32)
    app.add_middleware(SessionMiddleware, secret_key=secret_key)
    
    # Create authentication backend
    authentication_backend = AdminAuthBackend(secret_key=secret_key)
    
    # Create admin with authentication
    admin = Admin(
        app=app,
        engine=engine,
        authentication_backend=authentication_backend,
        title="🔒 Resume Management Admin"
    )
    
    # Add model views
    admin.add_view(UserAdmin)
    admin.add_view(ResumeAdmin)
    
    logger.info("✅ SQLAdmin interface configured!")
    logger.info("🔐 Admin interface: http://localhost:8000/admin")
    logger.info("👤 Login: username='admin', password='admin123'")
    
    return admin 