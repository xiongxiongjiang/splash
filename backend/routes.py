"""
API route handlers organized by functionality
"""
from fastapi import Query, HTTPException, Depends, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from database import (
    get_session, get_all_resumes, get_resume_by_id,
    get_resumes_by_email, create_resume, get_database_stats, 
    get_user_by_email, add_to_waitlist, update_waitlist_info
)
from auth import get_current_user, get_optional_user, get_admin_user
from models import User, UserRead, ResumeCreate, ResumeRead, WaitlistCreate, WaitlistUpdate, WaitlistRead
from klaviyo_integration import subscribe_to_klaviyo_from_waitlist, update_klaviyo_from_waitlist

logger = logging.getLogger(__name__)


# ==================== RESUME ENDPOINTS ====================

async def search_resumes(
    limit: Optional[int] = Query(None, ge=1, description="Maximum number of resumes to return"),
    skill: Optional[str] = Query(None, description="Filter by skill"),
    min_experience: Optional[int] = Query(None, ge=0, description="Minimum years of experience"),
    current_user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session)
):
    """Get a list of resumes with optional filtering and limiting."""
    logger.info("GET /resumes - limit=%s, skill=%s, min_experience=%s", limit, skill, min_experience)
    
    resumes = await get_all_resumes(session, limit=limit, skill=skill, min_experience=min_experience)
    stats = await get_database_stats(session)
    
    return {
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "total_in_db": stats["total_resumes"],
        "returned": len(resumes),
        "filters_applied": {
            "skill": skill,
            "min_experience": min_experience,
            "limit": limit
        },
        "user_authenticated": current_user is not None
    }


async def get_resume_details(
    resume_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session)
):
    """Get a specific resume by ID."""
    logger.info("GET /resumes/%d", resume_id)
    
    resume = await get_resume_by_id(session, resume_id)
    if not resume:
        raise HTTPException(
            status_code=404, 
            detail=f"Resume with ID {resume_id} not found"
        )
    
    return {
        "success": True, 
        "resume": ResumeRead.model_validate(resume),
        "user_authenticated": current_user is not None
    }


async def find_resumes_by_skill(
    skill: str = Query(..., description="Skill to search for"),
    current_user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session)
):
    """Search resumes by skill."""
    logger.info("GET /resumes/search/skills - skill=%s", skill)
    
    resumes = await get_all_resumes(session, skill=skill)
    
    return {
        "skill_searched": skill,
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "count": len(resumes),
        "user_authenticated": current_user is not None
    }


# ==================== USER ENDPOINTS ====================

async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information. Requires authentication."""
    return {
        "user": UserRead.model_validate(current_user),
        "message": "You are successfully authenticated!"
    }


async def get_user_resumes(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get resumes belonging to the current user. Requires authentication."""
    logger.info("GET /my-resumes for user: %s", current_user.email)
    
    resumes = await get_resumes_by_email(session, current_user.email)
    
    return {
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "count": len(resumes),
        "user_email": current_user.email
    }


async def create_new_resume(
    resume_data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new resume. Requires authentication."""
    logger.info("POST /resumes for user: %s", current_user.email)
    
    # Convert ResumeCreate to dict and add user_id
    resume_dict = resume_data.model_dump()
    resume_dict["user_id"] = current_user.id
    
    created_resume = await create_resume(session, resume_dict)
    
    return {
        "success": True,
        "resume": ResumeRead.model_validate(created_resume),
        "message": "Resume created successfully"
    }


async def get_user_by_email_endpoint(
    email: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get user information by email. Requires authentication."""
    # Security check: users can only access their own data, admins can access anyone's
    if current_user.email != email and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own user information"
        )
    
    user = await get_user_by_email(session, email)
    if not user:
        raise HTTPException(
            status_code=404, 
            detail=f"User with email {email} not found"
        )
    
    resumes = await get_resumes_by_email(session, email)
    
    return {
        "user": UserRead.model_validate(user),
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "resume_count": len(resumes)
    }


# ==================== WAITLIST ENDPOINTS ====================

async def add_to_waitlist_endpoint(
    waitlist_data: WaitlistCreate,
    session: AsyncSession = Depends(get_session)
):
    """Add an email to the waitlist and automatically subscribe to Klaviyo."""
    logger.info("POST /waitlist - email=%s", waitlist_data.email)
    
    # Add to waitlist
    waitlist_entry = await add_to_waitlist(
        session, 
        email=waitlist_data.email, 
        info=waitlist_data.info or {}
    )
    
    # Automatically subscribe to Klaviyo (non-blocking)
    await subscribe_to_klaviyo_from_waitlist(
        email=waitlist_data.email,
        info=waitlist_data.info or {}
    )
    
    return WaitlistRead.model_validate(waitlist_entry)


async def update_waitlist_info_endpoint(
    email: str,
    update_data: WaitlistUpdate,
    session: AsyncSession = Depends(get_session)
):
    """Update waitlist info for an email (merges with existing info) and sync to Klaviyo."""
    logger.info("PATCH /waitlist/%s", email)
    
    waitlist_entry = await update_waitlist_info(
        session,
        email=email,
        new_info=update_data.info
    )
    
    if not waitlist_entry:
        raise HTTPException(
            status_code=404,
            detail=f"Email {email} not found in waitlist"
        )
    
    # Automatically update Klaviyo profile properties (non-blocking)
    await update_klaviyo_from_waitlist(
        email=email,
        updated_info=update_data.info
    )
    
    return WaitlistRead.model_validate(waitlist_entry)


# ==================== ADMIN ENDPOINTS ====================

async def get_all_users_admin(
    admin_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all users (admin only)."""
    logger.info("GET /admin/users by admin: %s", admin_user.email)
    
    # TODO: Implement get_all_users function in database module
    return {
        "message": "Admin endpoint - would return all users",
        "admin_user": admin_user.email,
        "note": "This endpoint needs implementation in the database module"
    }