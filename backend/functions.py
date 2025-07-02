"""
Simple direct functions for MCP and Chat
No registry needed - just import and use!
"""
from typing import Dict, Any
from db_functions import get_database_stats, get_profile_by_user_id, get_resumes_by_user_id
from models import ProfileRead, ResumeRead


async def get_database_statistics(session, user_id=None, **kwargs) -> Dict[str, Any]:
    """Get statistics about the resume database"""
    stats = await get_database_stats(session)
    return {"stats": stats}


async def get_user_profile(session, user_id: int, **kwargs) -> Dict[str, Any]:
    """Get the current authenticated user's profile information"""
    if not user_id:
        return {"error": "User authentication required"}
        
    profile = await get_profile_by_user_id(session, user_id)
    if not profile:
        return {"profile": None, "message": "No profile found for user"}
        
    return {"profile": ProfileRead.model_validate(profile).model_dump(mode='json')}


async def get_user_resumes(session, user_id: int, **kwargs) -> Dict[str, Any]:
    """Get all resumes belonging to the current authenticated user"""
    if not user_id:
        return {"error": "User authentication required"}
        
    resumes = await get_resumes_by_user_id(session, user_id)
    resume_data = [ResumeRead.model_validate(resume).model_dump(mode='json') for resume in resumes]
    
    return {"resumes": resume_data, "count": len(resume_data)}


async def identify_profile_gaps(session, user_id: int, **kwargs) -> Dict[str, Any]:
    """Identify gaps in the user's profile for general career improvement"""
    if not user_id:
        return {"error": "User authentication required"}
    
    # TODO: Implement actual gap identification logic
    return {
        "gaps": [
            {"skill": "Cloud Technologies", "importance": "high"},
            {"skill": "Leadership Experience", "importance": "medium"}
        ]
    }


async def identify_gaps_per_job(session, user_id: int, job_posting_id: int, **kwargs) -> Dict[str, Any]:
    """Identify gaps between user's profile and a specific job posting"""
    if not user_id:
        return {"error": "User authentication required"}
    if not job_posting_id:
        return {"error": "job_posting_id is required"}
    
    # TODO: Implement actual job gap analysis logic
    return {
        "job_posting_id": job_posting_id,
        "gaps": [
            {"requirement": "React Native", "user_level": "None", "required_level": "Intermediate"},
            {"requirement": "5+ years experience", "user_level": "3 years", "required_level": "5 years"}
        ]
    }


async def get_context(session, user_id: int, **kwargs) -> Dict[str, Any]:
    """Get the current user's context including profile and recent activity"""
    if not user_id:
        return {"error": "User authentication required"}
    
    # Get both profile and resumes for context
    profile = await get_profile_by_user_id(session, user_id)
    resumes = await get_resumes_by_user_id(session, user_id)
    
    return {
        "context": {
            "has_profile": profile is not None,
            "resume_count": len(resumes),
            "profile": ProfileRead.model_validate(profile).model_dump(mode='json') if profile else None
        }
    }