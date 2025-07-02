from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class ProfileBase(BaseModel):
    # Core Identity
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    open_to_relocate: Optional[bool] = False
    
    # Career Profile
    professional_summary: Optional[str] = None
    career_level: Optional[str] = None
    years_experience: Optional[int] = None
    primary_domain: Optional[str] = None
    
    # JSON fields for flexible data storage
    seniority_keywords: Optional[Dict[str, Any]] = None
    experience: Optional[Dict[str, Any]] = None
    education: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None
    languages: Optional[Dict[str, Any]] = None
    
    # Enhanced Profile Data
    career_trajectory: Optional[Dict[str, Any]] = None
    domain_expertise: Optional[Dict[str, Any]] = None
    leadership_experience: Optional[Dict[str, Any]] = None
    achievement_highlights: Optional[Dict[str, Any]] = None
    
    # Resume Processing Metadata
    source_documents: Optional[Dict[str, Any]] = None
    processing_quality: Optional[float] = None
    last_resume_update: Optional[datetime] = None
    processing_history: Optional[Dict[str, Any]] = None
    
    # Profile Enhancement Tracking
    enhancement_status: str = "basic"
    confidence_score: Optional[float] = None
    data_sources: Optional[Dict[str, Any]] = None
    
    # Search & Discovery (simplified from search_keywords and profile_tags)
    keywords: Optional[Dict[str, Any]] = None
    
    # Profile Completeness Tracking
    completeness_metadata: Optional[Dict[str, Any]] = None
    
    # Misc
    misc_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class Profile(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class ProfileCreate(BaseModel):
    # Required fields for creation
    name: str
    user_id: int
    
    # Optional fields for creation
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    open_to_relocate: Optional[bool] = False
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
    processing_quality: Optional[float] = None
    processing_history: Optional[Dict[str, Any]] = None
    enhancement_status: str = "basic"
    confidence_score: Optional[float] = None
    data_sources: Optional[Dict[str, Any]] = None
    keywords: Optional[Dict[str, Any]] = None
    completeness_metadata: Optional[Dict[str, Any]] = None
    misc_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProfileUpdate(BaseModel):
    # All fields optional for updates
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    open_to_relocate: Optional[bool] = None
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
    processing_quality: Optional[float] = None
    processing_history: Optional[Dict[str, Any]] = None
    enhancement_status: Optional[str] = None
    confidence_score: Optional[float] = None
    data_sources: Optional[Dict[str, Any]] = None
    keywords: Optional[Dict[str, Any]] = None
    completeness_metadata: Optional[Dict[str, Any]] = None
    misc_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ProfileRead(Profile):
    pass