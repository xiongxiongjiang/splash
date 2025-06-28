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
    """Get resumes by email"""
    try:
        result = session.client.table('resumes').select('*').eq('email', email).order('created_at', desc=True).execute()
        
        resumes = []
        for record in result.data:
            resumes.append(_convert_supabase_record_to_dict(record))
        
        return resumes
    except Exception as e:
        logger.error(f"Error getting resumes by email: {e}")
        return []

async def create_resume(session: SupabaseSession, resume_data: dict) -> Dict[str, Any]:
    """Create a new resume"""
    try:
        # Prepare data for Supabase
        insert_data = {
            'name': resume_data['name'],
            'email': resume_data['email'],
            'phone': resume_data.get('phone'),
            'title': resume_data.get('title'),
            'experience_years': resume_data.get('experience_years'),
            'education': resume_data.get('education'),
            'summary': resume_data.get('summary'),
            'skills': resume_data.get('skills', []),
            'user_id': resume_data.get('user_id'),
            'created_at': datetime.now().isoformat()
        }
        
        result = session.client.table('resumes').insert(insert_data).execute()
        
        if result.data:
            return _convert_supabase_record_to_dict(result.data[0])
        else:
            raise Exception("Failed to create resume")
    except Exception as e:
        logger.error(f"Error creating resume: {e}")
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
    """Get database statistics"""
    try:
        # Count resumes
        resume_result = session.client.table('resumes').select('id', count='exact').execute()
        total_resumes = resume_result.count or 0
        
        # Count users
        user_result = session.client.table('users').select('id', count='exact').execute()
        total_users = user_result.count or 0
        
        # Get average experience (this is more complex with Supabase, so we'll calculate it)
        resumes_result = session.client.table('resumes').select('experience_years').is_('experience_years', 'not.null').execute()
        experience_values = [r['experience_years'] for r in resumes_result.data if r['experience_years'] is not None]
        avg_experience = sum(experience_values) / len(experience_values) if experience_values else 0
        
        return {
            "total_resumes": total_resumes,
            "total_users": total_users,
            "average_experience_years": round(float(avg_experience), 1)
        }
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        return {
            "total_resumes": 0,
            "total_users": 0,
            "average_experience_years": 0
        }

# Seed data
async def seed_initial_data(session: SupabaseSession):
    """Seed the database with initial sample data"""
    try:
        # Check if we already have data
        result = session.client.table('resumes').select('id', count='exact').execute()
        count = result.count or 0
        
        if count > 0:
            logger.info("Database already contains data, skipping seed")
            return
        
        # Sample resumes data
        sample_resumes = [
            {
                "name": "Peiyun Zeng",
                "email": "cdzengpeiyun@gmail.com",
                "phone": "(555) 100-2024",
                "title": "Full Stack Engineer",
                "experience_years": 5,
                "skills": ["Python", "FastAPI", "React", "TypeScript", "Next.js", "SQLModel", "Supabase", "AWS"],
                "education": "BS Computer Science - University of Technology",
                "summary": "Passionate full-stack engineer with expertise in modern web technologies and backend systems. Experience building scalable applications with Python, React, and cloud technologies."
            },
            {
                "name": "John Doe",
                "email": "john.doe@email.com",
                "phone": "(555) 123-4567",
                "title": "Senior Software Engineer",
                "experience_years": 8,
                "skills": ["Python", "JavaScript", "React", "FastAPI", "PostgreSQL"],
                "education": "BS Computer Science - Stanford University",
                "summary": "Experienced full-stack developer with expertise in Python and modern web technologies."
            },
            {
                "name": "Jane Smith",
                "email": "jane.smith@email.com",
                "phone": "(555) 987-6543",
                "title": "Product Manager",
                "experience_years": 6,
                "skills": ["Product Strategy", "Agile", "Data Analysis", "SQL", "Figma"],
                "education": "MBA - Harvard Business School",
                "summary": "Results-driven product manager with proven track record of launching successful products."
            },
            {
                "name": "Mike Johnson",
                "email": "mike.johnson@email.com",
                "phone": "(555) 456-7890",
                "title": "UX Designer",
                "experience_years": 4,
                "skills": ["UI/UX Design", "Figma", "Adobe Creative Suite", "User Research", "Prototyping"],
                "education": "BFA Design - Art Center College of Design",
                "summary": "Creative UX designer focused on user-centered design and accessibility."
            },
            {
                "name": "Sarah Wilson",
                "email": "sarah.wilson@email.com",
                "phone": "(555) 321-9876",
                "title": "Data Scientist",
                "experience_years": 5,
                "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics"],
                "education": "PhD Statistics - MIT",
                "summary": "Data scientist specializing in machine learning and predictive analytics."
            },
            {
                "name": "David Chen",
                "email": "david.chen@email.com",
                "phone": "(555) 654-3210",
                "title": "DevOps Engineer",
                "experience_years": 7,
                "skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "CI/CD"],
                "education": "BS Computer Engineering - UC Berkeley",
                "summary": "DevOps engineer with expertise in cloud infrastructure and automation."
            }
        ]
        
        for resume_data in sample_resumes:
            await create_resume(session, resume_data)
        
        logger.info(f"Seeded database with {len(sample_resumes)} sample resumes") 
    except Exception as e:
        logger.error(f"Error seeding data: {e}") 