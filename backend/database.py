from sqlmodel import SQLModel, select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator, Optional, List
import os
import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://splash:splash@localhost:5432/splash")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False  # Set to False to reduce noise
)

# Create async session maker
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Dependency to get DB session
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

# Database initialization
async def init_db():
    """Create database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database tables created successfully")

# User CRUD operations
async def create_user(session: AsyncSession, user_data: dict) -> "User":
    """Create a new user"""
    from models import User
    
    user = User(
        supabase_id=user_data["supabase_id"],
        email=user_data["email"],
        name=user_data.get("name")
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def get_user_by_supabase_id(session: AsyncSession, supabase_id: str) -> Optional["User"]:
    """Get user by Supabase ID"""
    from models import User
    
    statement = select(User).where(User.supabase_id == supabase_id)
    result = await session.exec(statement)
    return result.first()

async def get_user_by_email(session: AsyncSession, email: str) -> Optional["User"]:
    """Get user by email"""
    from models import User
    
    statement = select(User).where(User.email == email)
    result = await session.exec(statement)
    return result.first()

async def update_user_last_seen(session: AsyncSession, supabase_id: str):
    """Update user's last seen timestamp"""
    from models import User
    from datetime import datetime
    
    statement = select(User).where(User.supabase_id == supabase_id)
    result = await session.exec(statement)
    user = result.first()
    
    if user:
        user.last_seen = datetime.now()
        session.add(user)
        await session.commit()

# Resume CRUD operations
async def get_all_resumes(
    session: AsyncSession, 
    limit: Optional[int] = None, 
    skill: Optional[str] = None, 
    min_experience: Optional[int] = None
) -> List["Resume"]:
    """Get all resumes with optional filtering"""
    from models import Resume
    
    statement = select(Resume)
    
    # Apply filters
    if skill:
        # PostgreSQL JSON search
        statement = statement.where(
            text("EXISTS (SELECT 1 FROM jsonb_array_elements_text(skills::jsonb) AS elem WHERE lower(elem) LIKE lower(:skill))")
            .bindparams(skill=f"%{skill}%")
        )
    
    if min_experience is not None:
        statement = statement.where(Resume.experience_years >= min_experience)
    
    statement = statement.order_by(Resume.created_at.desc())
    
    if limit:
        statement = statement.limit(limit)
    
    result = await session.exec(statement)
    return result.all()

async def get_resume_by_id(session: AsyncSession, resume_id: int) -> Optional["Resume"]:
    """Get resume by ID"""
    from models import Resume
    
    statement = select(Resume).where(Resume.id == resume_id)
    result = await session.exec(statement)
    return result.first()

async def get_resumes_by_email(session: AsyncSession, email: str) -> List["Resume"]:
    """Get resumes by email"""
    from models import Resume
    
    statement = select(Resume).where(Resume.email == email).order_by(Resume.created_at.desc())
    result = await session.exec(statement)
    return result.all()

async def create_resume(session: AsyncSession, resume_data: dict) -> "Resume":
    """Create a new resume"""
    from models import Resume
    
    resume = Resume(**resume_data)
    session.add(resume)
    await session.commit()
    await session.refresh(resume)
    return resume

# Waitlist CRUD operations
async def add_to_waitlist(session: AsyncSession, email: str, info: dict = None) -> "Waitlist":
    """Add email to waitlist"""
    from models import Waitlist
    
    # Check if email already exists
    statement = select(Waitlist).where(Waitlist.email == email)
    result = await session.exec(statement)
    existing_entry = result.first()
    
    if existing_entry:
        return existing_entry
    
    # Create new entry
    waitlist_entry = Waitlist(
        email=email,
        info=info or {}
    )
    
    session.add(waitlist_entry)
    await session.commit()
    await session.refresh(waitlist_entry)
    return waitlist_entry

async def update_waitlist_info(session: AsyncSession, email: str, new_info: dict) -> Optional["Waitlist"]:
    """Update waitlist info, merging with existing info"""
    from models import Waitlist
    
    statement = select(Waitlist).where(Waitlist.email == email)
    result = await session.exec(statement)
    waitlist_entry = result.first()
    
    if not waitlist_entry:
        return None
    
    # Merge the new info with existing info
    merged_info = {**waitlist_entry.info, **new_info}
    waitlist_entry.info = merged_info
    
    session.add(waitlist_entry)
    await session.commit()
    await session.refresh(waitlist_entry)
    return waitlist_entry

# Statistics
async def get_database_stats(session: AsyncSession) -> dict:
    """Get database statistics"""
    from models import Resume, User
    from sqlalchemy import func
    
    # Count resumes
    resume_count_stmt = select(func.count(Resume.id))
    resume_result = await session.exec(resume_count_stmt)
    total_resumes = resume_result.one()
    
    # Count users
    user_count_stmt = select(func.count(User.id))
    user_result = await session.exec(user_count_stmt)
    total_users = user_result.one()
    
    # Average experience
    avg_exp_stmt = select(func.avg(Resume.experience_years)).where(Resume.experience_years.is_not(None))
    avg_result = await session.exec(avg_exp_stmt)
    avg_experience = avg_result.one() or 0
    
    return {
        "total_resumes": total_resumes,
        "total_users": total_users,
        "average_experience_years": round(float(avg_experience), 1)
    }

# Seed data
async def seed_initial_data(session: AsyncSession):
    """Seed the database with initial sample data"""
    from models import Resume
    from sqlalchemy import func
    
    # Check if we already have data
    count_stmt = select(func.count(Resume.id))
    result = await session.exec(count_stmt)
    count = result.one()
    
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