from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ResumeBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    title: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[str] = None
    summary: Optional[str] = None

class Resume(ResumeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    skills: Optional[List[str]] = None

class ResumeCreate(ResumeBase):
    skills: List[str] = []

class ResumeRead(Resume):
    pass

class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    education: Optional[str] = None
    summary: Optional[str] = None 