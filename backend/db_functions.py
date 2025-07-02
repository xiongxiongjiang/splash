"""
Database functions without config dependencies
Pure database operations for use in functions.py
"""
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
import os
import logging
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

# Direct Supabase client (without importing from config to avoid circular dependency)
def get_supabase_client() -> Client:
    """Get Supabase client with service role key for server-side operations"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    return create_client(supabase_url, supabase_key)

# Global client instance
supabase: Client = get_supabase_client()

# Async wrapper for Supabase operations
def async_supabase_operation(func):
    """Decorator to wrap synchronous Supabase operations in async context"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, func, *args, **kwargs)
    return wrapper

def _convert_supabase_record_to_dict(record: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Supabase record to dict format, handling nested objects"""
    if not record:
        return {}
    
    # Convert the record to a proper dict
    result = {}
    for key, value in record.items():
        if isinstance(value, dict):
            # Recursively convert nested dicts
            result[key] = _convert_supabase_record_to_dict(value)
        else:
            result[key] = value
    
    return result

@async_supabase_operation
def _get_database_stats_sync() -> dict:
    """Synchronous version of get_database_stats"""
    try:
        # Get resume count
        resume_response = supabase.table("resumes").select("id", count="exact").execute()
        resume_count = resume_response.count or 0
        
        # Get user count
        user_response = supabase.table("users").select("id", count="exact").execute()
        user_count = user_response.count or 0
        
        # Get profile count
        profile_response = supabase.table("profiles").select("id", count="exact").execute()
        profile_count = profile_response.count or 0
        
        return {
            "total_resumes": resume_count,
            "total_users": user_count,
            "total_profiles": profile_count,
            "database_type": "Supabase PostgreSQL"
        }
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        return {
            "total_resumes": 0,
            "total_users": 0,
            "total_profiles": 0,
            "database_type": "Supabase PostgreSQL",
            "error": str(e)
        }

async def get_database_stats(session) -> dict:
    """Get statistics about the database"""
    return await _get_database_stats_sync()

@async_supabase_operation  
def _get_profile_by_user_id_sync(user_id: int) -> Optional[Dict[str, Any]]:
    """Synchronous version of get_profile_by_user_id"""
    try:
        response = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
        if response.data:
            return _convert_supabase_record_to_dict(response.data[0])
        return None
    except Exception as e:
        logger.error(f"Error getting profile for user {user_id}: {str(e)}")
        return None

async def get_profile_by_user_id(session, user_id: int) -> Optional[Dict[str, Any]]:
    """Get profile by user ID"""
    return await _get_profile_by_user_id_sync(user_id)

@async_supabase_operation
def _get_resumes_by_user_id_sync(user_id: int) -> List[Dict[str, Any]]:
    """Synchronous version of get_resumes_by_user_id"""
    try:
        response = supabase.table("resumes").select("*").eq("user_id", user_id).execute()
        if response.data:
            return [_convert_supabase_record_to_dict(record) for record in response.data]
        return []
    except Exception as e:
        logger.error(f"Error getting resumes for user {user_id}: {str(e)}")
        return []

async def get_resumes_by_user_id(session, user_id: int) -> List[Dict[str, Any]]:
    """Get all resumes for a specific user"""
    return await _get_resumes_by_user_id_sync(user_id)