from supabase import create_client, Client
from typing import Optional, List, Dict, Any, AsyncGenerator
import os
import logging
from datetime import datetime
import asyncio
from functools import wraps
import json

# Import config
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

logger = logging.getLogger(__name__)

# Supabase client configuration
def get_supabase_client() -> Client:
    """Get Supabase client with service role key for server-side operations"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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

# Compatibility layer for session-based operations
class SupabaseSession:
    """Mock session object to maintain compatibility with existing code"""
    def __init__(self):
        self.client = supabase
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

# Dependency to get DB session (compatibility layer)
async def get_session() -> AsyncGenerator[SupabaseSession, None]:
    session = SupabaseSession()
    try:
        yield session
    finally:
        pass

# Database initialization
async def init_db():
    """Initialize database - Supabase handles table creation via migrations"""
    logger.info("Using Supabase - tables should be created via Supabase dashboard or migrations")

# Helper functions
def _convert_supabase_record_to_dict(record: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Supabase record to dictionary format expected by models"""
    if record.get('created_at'):
        # Convert ISO string to datetime if needed
        if isinstance(record['created_at'], str):
            record['created_at'] = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
    if record.get('updated_at'):
        if isinstance(record['updated_at'], str):
            record['updated_at'] = datetime.fromisoformat(record['updated_at'].replace('Z', '+00:00'))
    if record.get('last_seen'):
        if isinstance(record['last_seen'], str):
            record['last_seen'] = datetime.fromisoformat(record['last_seen'].replace('Z', '+00:00'))
    return record

# User CRUD operations
async def create_user(session: SupabaseSession, user_data: dict) -> Dict[str, Any]:
    """Create a new user"""
    try:
        result = session.client.table('users').insert({
            'supabase_id': user_data["supabase_id"],
            'email': user_data["email"],
            'name': user_data.get("name"),
            'role': user_data.get("role", "user"),
            'created_at': datetime.now().isoformat(),
            'last_seen': datetime.now().isoformat()
        }).execute()
        
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        else:
            raise Exception("Failed to create user")
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise

async def get_user_by_supabase_id(session: SupabaseSession, supabase_id: str) -> Optional[Dict[str, Any]]:
    """Get user by Supabase ID"""
    try:
        result = session.client.table('users').select('*').eq('supabase_id', supabase_id).execute()
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Error getting user by supabase_id: {e}")
        return None

async def get_user_by_email(session: SupabaseSession, email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    try:
        result = session.client.table('users').select('*').eq('email', email).execute()
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None

async def update_user_last_seen(session: SupabaseSession, supabase_id: str):
    """Update user's last seen timestamp"""
    try:
        session.client.table('users').update({
            'last_seen': datetime.now().isoformat()
        }).eq('supabase_id', supabase_id).execute()
    except Exception as e:
        logger.error(f"Error updating user last seen: {e}")

# Resume CRUD operations
async def get_all_resumes(
    session: SupabaseSession, 
    limit: Optional[int] = None, 
    skill: Optional[str] = None, 
    min_experience: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Get all resumes with optional filtering"""
    try:
        query = session.client.table('resumes').select('*')
        
        # Apply filters
        if skill:
            # Use Supabase's JSON search for skills array
            query = query.contains('skills', [skill])
        
        if min_experience is not None:
            query = query.gte('experience_years', min_experience)
        
        query = query.order('created_at', desc=True)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        
        resumes = []
        for record in result.data:
            resumes.append(_convert_supabase_record_to_dict(record))
        
        return resumes
    except Exception as e:
        logger.error(f"Error getting all resumes: {e}")
        return []

async def get_resume_by_id(session: SupabaseSession, resume_id: int) -> Optional[Dict[str, Any]]:
    """Get resume by ID"""
    try:
        result = session.client.table('resumes').select('*').eq('id', resume_id).execute()
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Error getting resume by ID: {e}")
        return None

async def get_resumes_by_email(session: SupabaseSession, email: str) -> List[Dict[str, Any]]:
    """Get resumes by user email (V2 schema: user → profile → resumes)"""
    try:
        # First get the user by email
        user_result = session.client.table('users').select('*').eq('email', email).execute()
        if not user_result.data:
            return []
        
        user_id = user_result.data[0]['id']
        
        # Get profile by user_id
        profile_result = session.client.table('profiles_v2').select('id').eq('user_id', user_id).execute()
        
        if not profile_result.data:
            return []  # No profile means no resumes
        
        profile_id = profile_result.data[0]['id']
        
        # Then get resumes by profile_id
        result = session.client.table('resumes_v2').select('*').eq('profile_id', profile_id).order('created_at', desc=True).execute()
        
        resumes = []
        for record in result.data:
            resumes.append(_convert_supabase_record_to_dict(record))
        
        return resumes
    except Exception as e:
        logger.error(f"Error getting resumes by email: {e}")
        return []

async def get_resumes_by_user_id(session: SupabaseSession, user_id: int) -> List[Dict[str, Any]]:
    """Get resumes by user ID"""
    try:
        result = session.client.table('resumes').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        resumes = []
        for record in result.data:
            resumes.append(_convert_supabase_record_to_dict(record))
        
        return resumes
    except Exception as e:
        logger.error(f"Error getting resumes by user_id: {e}")
        return []

async def create_resume(session: SupabaseSession, resume_data: dict) -> Dict[str, Any]:
    """Create a new resume (V2 schema)"""
    try:
        # For backward compatibility, if user_id is provided, convert to profile_id
        if 'user_id' in resume_data and 'profile_id' not in resume_data:
            profile = await get_profile_by_user_id(session, resume_data['user_id'])
            if not profile:
                raise Exception(f"No profile found for user_id {resume_data['user_id']}")
            profile_id = profile['id']
        else:
            profile_id = resume_data.get('profile_id')
            
        if not profile_id:
            raise Exception("profile_id is required for creating resume")
        
        # Prepare data for Supabase V2 schema
        insert_data = {
            'name': resume_data['name'],
            'email': resume_data.get('email'),
            'phone': resume_data.get('phone'),
            'location': resume_data.get('location'),
            'professional_summary': resume_data.get('professional_summary'),
            'career_level': resume_data.get('career_level'),
            'years_experience': resume_data.get('years_experience'),
            'primary_domain': resume_data.get('primary_domain'),
            'seniority_keywords': resume_data.get('seniority_keywords'),
            'experience': resume_data.get('experience'),
            'education': resume_data.get('education'),
            'skills': resume_data.get('skills'),
            'languages': resume_data.get('languages'),
            'career_trajectory': resume_data.get('career_trajectory'),
            'domain_expertise': resume_data.get('domain_expertise'),
            'leadership_experience': resume_data.get('leadership_experience'),
            'achievement_highlights': resume_data.get('achievement_highlights'),
            'source_documents': resume_data.get('source_documents'),
            'misc_data': resume_data.get('misc_data'),
            'file_path': resume_data.get('file_path'),
            'file_type': resume_data.get('file_type', 'generated'),
            'version': resume_data.get('version', 1),
            'is_active': resume_data.get('is_active', True),
            'customization_notes': resume_data.get('customization_notes'),
            'job_posting_id': resume_data.get('job_posting_id'),
            'profile_id': profile_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        result = session.client.table('resumes_v2').insert(insert_data).execute()
        
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        else:
            raise Exception("Failed to create resume")
    except Exception as e:
        logger.error(f"Error creating resume: {e}")
        raise

async def delete_resume(session: SupabaseSession, resume_id: int, user_id: int) -> bool:
    """Delete a resume by ID (only if it belongs to the user) - V2 schema"""
    try:
        # Get user's profile first
        profile = await get_profile_by_user_id(session, user_id)
        if not profile:
            return False  # No profile for user
            
        profile_id = profile['id']
        
        # Check if resume exists and belongs to user's profile
        result = session.client.table('resumes_v2').select('*').eq('id', resume_id).eq('profile_id', profile_id).execute()
        
        if not result.data:
            return False  # Resume not found or doesn't belong to user's profile
        
        # Delete the resume
        delete_result = session.client.table('resumes_v2').delete().eq('id', resume_id).eq('profile_id', profile_id).execute()
        
        return len(delete_result.data) > 0
    except Exception as e:
        logger.error(f"Error deleting resume: {e}")
        raise

# Profile CRUD operations
async def create_profile(session: SupabaseSession, profile_data: dict) -> Dict[str, Any]:
    """Create a new profile"""
    try:
        # Prepare data for Supabase V2 schema
        insert_data = {
            'name': profile_data['name'],
            'email': profile_data.get('email'),
            'phone': profile_data.get('phone'),
            'location': profile_data.get('location'),
            'open_to_relocate': profile_data.get('open_to_relocate', False),
            'professional_summary': profile_data.get('professional_summary'),
            'career_level': profile_data.get('career_level'),
            'years_experience': profile_data.get('years_experience'),
            'primary_domain': profile_data.get('primary_domain'),
            'seniority_keywords': profile_data.get('seniority_keywords'),
            'experience': profile_data.get('experience'),
            'education': profile_data.get('education'),
            'skills': profile_data.get('skills'),
            'languages': profile_data.get('languages'),
            'career_trajectory': profile_data.get('career_trajectory'),
            'domain_expertise': profile_data.get('domain_expertise'),
            'leadership_experience': profile_data.get('leadership_experience'),
            'achievement_highlights': profile_data.get('achievement_highlights'),
            'source_documents': profile_data.get('source_documents'),
            'processing_quality': profile_data.get('processing_quality'),
            'last_resume_update': profile_data.get('last_resume_update'),
            'processing_history': profile_data.get('processing_history'),
            'enhancement_status': profile_data.get('enhancement_status', 'basic'),
            'confidence_score': profile_data.get('confidence_score'),
            'data_sources': profile_data.get('data_sources'),
            'keywords': profile_data.get('keywords'),  # Simplified from search_keywords and profile_tags
            'completeness_metadata': profile_data.get('completeness_metadata'),
            'misc_data': profile_data.get('misc_data'),
            'notes': profile_data.get('notes'),
            'user_id': profile_data['user_id'],  # Required field
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        result = session.client.table('profiles_v2').insert(insert_data).execute()
        
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        else:
            raise Exception("Failed to create profile")
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise

async def get_profile_by_user_id(session: SupabaseSession, user_id: int) -> Optional[Dict[str, Any]]:
    """Get profile by user ID"""
    try:
        result = session.client.table('profiles_v2').select('*').eq('user_id', user_id).execute()
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Error getting profile by user_id: {e}")
        return None

async def update_profile(session: SupabaseSession, profile_id: int, profile_data: dict) -> Optional[Dict[str, Any]]:
    """Update an existing profile"""
    try:
        update_data = {**profile_data, 'updated_at': datetime.now().isoformat()}
        
        result = session.client.table('profiles_v2').update(update_data).eq('id', profile_id).execute()
        
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        return None

async def clear_profile(session: SupabaseSession, user_id: int) -> bool:
    """Delete user's profile and all associated resumes (for testing/reset functionality)"""
    try:
        # Get user's profile
        profile = await get_profile_by_user_id(session, user_id)
        if not profile:
            return True  # No profile to clear
            
        profile_id = profile['id']
        
        # Delete all resumes associated with the profile (CASCADE should handle this automatically)
        # But let's be explicit for clarity
        resumes_result = session.client.table('resumes_v2').delete().eq('profile_id', profile_id).execute()
        logger.info(f"Deleted {len(resumes_result.data) if resumes_result.data else 0} resumes for profile {profile_id}")
        
        # Delete the profile
        profile_result = session.client.table('profiles_v2').delete().eq('id', profile_id).execute()
        
        return len(profile_result.data) > 0
    except Exception as e:
        logger.error(f"Error clearing profile: {e}")
        raise

# Waitlist CRUD operations
async def add_to_waitlist(session: SupabaseSession, email: str, info: dict = None) -> Dict[str, Any]:
    """Add email to waitlist"""
    try:
        # Check if email already exists
        existing = await get_waitlist_by_email(session, email)
        if existing:
            return existing
        
        # Create new entry
        insert_data = {
            'email': email,
            'info': info or {},
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        result = session.client.table('waitlist').insert(insert_data).execute()
        
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        else:
            raise Exception("Failed to add to waitlist")
    except Exception as e:
        logger.error(f"Error adding to waitlist: {e}")
        raise

async def get_waitlist_by_email(session: SupabaseSession, email: str) -> Optional[Dict[str, Any]]:
    """Get waitlist entry by email"""
    try:
        result = session.client.table('waitlist').select('*').eq('email', email).execute()
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Error getting waitlist by email: {e}")
        return None

async def update_waitlist_info(session: SupabaseSession, email: str, new_info: dict) -> Optional[Dict[str, Any]]:
    """Update waitlist info, merging with existing info"""
    try:
        # Get existing entry
        existing = await get_waitlist_by_email(session, email)
        if not existing:
            return None
        
        # Merge the new info with existing info
        merged_info = {**existing.get('info', {}), **new_info}
        
        result = session.client.table('waitlist').update({
            'info': merged_info,
            'updated_at': datetime.now().isoformat()
        }).eq('email', email).execute()
        
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        return None
    except Exception as e:
        logger.error(f"Error updating waitlist info: {e}")
        return None

# Statistics
async def get_database_stats(session: SupabaseSession) -> dict:
    """Get database statistics (V2 schema)"""
    try:
        # Count resumes (V2)
        resume_result = session.client.table('resumes_v2').select('id', count='exact').execute()
        total_resumes = resume_result.count or 0
        
        # Count profiles (V2)
        profile_result = session.client.table('profiles_v2').select('id', count='exact').execute()
        total_profiles = profile_result.count or 0
        
        # Count users (unchanged)
        user_result = session.client.table('users').select('id', count='exact').execute()
        total_users = user_result.count or 0
        
        # Get average experience from profiles (V2)
        profiles_result = session.client.table('profiles_v2').select('years_experience').is_('years_experience', 'not.null').execute()
        experience_values = [r['years_experience'] for r in profiles_result.data if r['years_experience'] is not None]
        avg_experience = sum(experience_values) / len(experience_values) if experience_values else 0
        
        return {
            "total_resumes": total_resumes,
            "total_profiles": total_profiles,
            "total_users": total_users,
            "average_experience_years": round(float(avg_experience), 1)
        }
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        return {
            "total_resumes": 0,
            "total_profiles": 0,
            "total_users": 0,
            "average_experience_years": 0
        }

# Note: Seed data is now handled via .seed.sql file
# Run the .seed.sql file manually in Supabase dashboard or via psql when needed 