from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import JSON
from typing import Optional, List
from datetime import datetime

class ResumeBase(SQLModel):
    name: str
    email: str = Field(index=True)
    phone: Optional[str] = None
    title: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[str] = None
    summary: Optional[str] = None

class Resume(ResumeBase, table=True):
    __tablename__ = "resumes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.now)
    skills: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    
    # Relationship to user
    user: Optional["User"] = Relationship(back_populates="resumes")

class ResumeCreate(ResumeBase):
    skills: List[str] = []

class ResumeRead(ResumeBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    skills: List[str] = []

class ResumeUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    education: Optional[str] = None
    summary: Optional[str] = None 