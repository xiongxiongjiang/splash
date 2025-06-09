#!/usr/bin/env python3
"""
Add a resume for cdzengpeiyun@gmail.com to the existing database
"""

import asyncio
from database import async_session, create_resume

async def add_peiyun_resume():
    """Add Peiyun's resume to the database"""
    
    resume_data = {
        "name": "Peiyun Zeng",
        "email": "cdzengpeiyun@gmail.com",
        "phone": "(555) 100-2024",
        "title": "Full Stack Engineer",
        "experience_years": 5,
        "skills": ["Python", "FastAPI", "React", "TypeScript", "Next.js", "SQLModel", "Supabase", "AWS"],
        "education": "BS Computer Science - University of Technology",
        "summary": "Passionate full-stack engineer with expertise in modern web technologies and backend systems. Experience building scalable applications with Python, React, and cloud technologies."
    }
    
    async with async_session() as session:
        try:
            # Check if resume already exists
            from models import Resume
            from sqlmodel import select
            
            statement = select(Resume).where(Resume.email == "cdzengpeiyun@gmail.com")
            result = await session.exec(statement)
            existing = result.first()
            
            if existing:
                print(f"✅ Resume already exists for {resume_data['email']}: {existing.title}")
                return existing
            
            # Create new resume
            resume = await create_resume(session, resume_data)
            print(f"🎉 Successfully added resume for {resume.email}: {resume.title}")
            print(f"📄 Resume ID: {resume.id}")
            return resume
            
        except Exception as e:
            print(f"❌ Error adding resume: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(add_peiyun_resume()) 