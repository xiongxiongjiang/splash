from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class JobPostingBase(BaseModel):
    # Job posting metadata
    title: str
    company_name: str
    location: Optional[str] = None
    job_type: Optional[str] = None  # full-time, part-time, contract, etc.
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    
    # File storage (local for now, S3 later)
    original_file_path: Optional[str] = None  # local path to uploaded PDF/document (will become S3 URL)
    processed_text: Optional[str] = None  # extracted text from PDF for easier processing
    
    # Processing metadata
    processing_status: str = "pending"  # pending, processed, failed
    processing_quality: Optional[float] = None
    keywords: Optional[Dict[str, Any]] = None  # extracted keywords for matching
    
    # Application tracking
    application_status: str = "interested"  # interested, applied, interviewing, rejected, offered
    application_date: Optional[datetime] = None
    notes: Optional[str] = None

class JobPosting(JobPostingBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    profile_id: int
    created_at: datetime
    updated_at: datetime

class JobPostingCreate(BaseModel):
    # Required fields for creation
    title: str
    company_name: str
    profile_id: int
    
    # Optional fields for creation
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    original_file_path: Optional[str] = None
    processed_text: Optional[str] = None
    processing_status: str = "pending"
    processing_quality: Optional[float] = None
    keywords: Optional[Dict[str, Any]] = None
    application_status: str = "interested"
    application_date: Optional[datetime] = None
    notes: Optional[str] = None

class JobPostingUpdate(BaseModel):
    # All fields optional for updates
    title: Optional[str] = None
    company_name: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    original_file_path: Optional[str] = None
    processed_text: Optional[str] = None
    processing_status: Optional[str] = None
    processing_quality: Optional[float] = None
    keywords: Optional[Dict[str, Any]] = None
    application_status: Optional[str] = None
    application_date: Optional[datetime] = None
    notes: Optional[str] = None

class JobPostingRead(JobPosting):
    pass