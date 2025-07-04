from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class ResumeBase(BaseModel):
    # Core Identity (same as profile)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    
    # Career Profile (same as profile)
    professional_summary: Optional[str] = None
    career_level: Optional[str] = None
    years_experience: Optional[int] = None
    primary_domain: Optional[str] = None
    
    # JSON fields for flexible data storage (same as profile)
    seniority_keywords: Optional[Dict[str, Any]] = None
    experience: Optional[Dict[str, Any]] = None
    education: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None
    languages: Optional[Dict[str, Any]] = None
    
    # Enhanced Profile Data (same as profile)
    career_trajectory: Optional[Dict[str, Any]] = None
    domain_expertise: Optional[Dict[str, Any]] = None
    leadership_experience: Optional[Dict[str, Any]] = None
    achievement_highlights: Optional[Dict[str, Any]] = None
    
    # Resume specific fields
    source_documents: Optional[Dict[str, Any]] = None  # references to profile version used
    misc_data: Optional[Dict[str, Any]] = None
    
    # File storage (local for now, S3 later)
    file_path: Optional[str] = None  # local path to generated/uploaded PDF (will become S3 URL)
    file_type: str = "generated"  # generated, uploaded
    
    # Resume metadata
    version: int = 1  # for tracking resume versions
    is_active: bool = True
    customization_notes: Optional[str] = None  # notes about customizations for specific job

class Resume(ResumeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    profile_id: int
    job_posting_id: Optional[int] = None  # optional link to specific job posting
    created_at: datetime
    updated_at: datetime

class ResumeCreate(BaseModel):
    # Required fields for creation
    name: str
    profile_id: int
    
    # Optional fields for creation
    job_posting_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    professional_summary: Optional[str] = None
    career_level: Optional[str] = None
    years_experience: Optional[int] = None
    primary_domain: Optional[str] = None
    seniority_keywords: Optional[Dict[str, Any]] = None
    experience: Optional[Dict[str, Any]] = None
    education: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None
    languages: Optional[Dict[str, Any]] = None
    career_trajectory: Optional[Dict[str, Any]] = None
    domain_expertise: Optional[Dict[str, Any]] = None
    leadership_experience: Optional[Dict[str, Any]] = None
    achievement_highlights: Optional[Dict[str, Any]] = None
    source_documents: Optional[Dict[str, Any]] = None
    misc_data: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    file_type: str = "generated"
    version: int = 1
    is_active: bool = True
    customization_notes: Optional[str] = None

class ResumeUpdate(BaseModel):
    # All fields optional for updates
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    professional_summary: Optional[str] = None
    career_level: Optional[str] = None
    years_experience: Optional[int] = None
    primary_domain: Optional[str] = None
    seniority_keywords: Optional[Dict[str, Any]] = None
    experience: Optional[Dict[str, Any]] = None
    education: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None
    languages: Optional[Dict[str, Any]] = None
    career_trajectory: Optional[Dict[str, Any]] = None
    domain_expertise: Optional[Dict[str, Any]] = None
    leadership_experience: Optional[Dict[str, Any]] = None
    achievement_highlights: Optional[Dict[str, Any]] = None
    source_documents: Optional[Dict[str, Any]] = None
    misc_data: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    version: Optional[int] = None
    is_active: Optional[bool] = None
    customization_notes: Optional[str] = None

class ResumeRead(Resume):
    pass