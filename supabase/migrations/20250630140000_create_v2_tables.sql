-- SAFE V2 SCHEMA MIGRATION
-- Creates new V2 tables alongside existing ones for safe migration
-- Preserves users and waitlist tables as-is
-- Relationship: users (1) -> profiles_v2 (1) -> job_postings_v2 (many) -> resumes_v2 (many)

-- Enable RLS (Row Level Security) for Supabase
-- Note: RLS policies should be added separately based on your auth requirements

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles_v2 table (one-to-one with users)
CREATE TABLE profiles_v2 (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Core Identity
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    open_to_relocate BOOLEAN DEFAULT false,
    
    -- Career Profile
    professional_summary TEXT,
    career_level TEXT,
    years_experience INTEGER,
    primary_domain TEXT,
    
    -- JSON fields for flexible data storage
    seniority_keywords JSONB,
    experience JSONB,
    education JSONB,
    skills JSONB,
    languages JSONB,
    
    -- Enhanced Profile Data
    career_trajectory JSONB,
    domain_expertise JSONB,
    leadership_experience JSONB,
    achievement_highlights JSONB,
    
    -- Resume Processing Metadata
    source_documents JSONB,
    processing_quality FLOAT,
    last_resume_update TIMESTAMPTZ,
    processing_history JSONB,
    
    -- Profile Enhancement Tracking
    enhancement_status TEXT DEFAULT 'basic',
    confidence_score FLOAT,
    data_sources JSONB,
    
    -- Search & Discovery
    keywords JSONB, -- for search, filtering, and categorization
    
    -- Profile Completeness Tracking
    completeness_metadata JSONB, -- tracks profile completion status
    /* Example structure:
    {
      "overall_percentage": 75,
      "sections": {
        "personal_info": {"complete": true, "score": 100},
        "experience": {"complete": false, "score": 60, "missing": ["skills"]},
        "education": {"complete": true, "score": 95}
      },
      "last_calculated": "2024-01-15T10:30:00Z",
      "recommendations": ["Add 2 more skills", "Complete work experience dates"]
    }
    */
    
    -- Misc
    misc_data JSONB,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one profile per user
    CONSTRAINT unique_user_profile_v2 UNIQUE(user_id)
);

-- Create job_postings_v2 table (many per profile)
CREATE TABLE job_postings_v2 (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles_v2(id) ON DELETE CASCADE,
    
    -- Job posting metadata
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    job_type TEXT, -- full-time, part-time, contract, etc.
    salary_range TEXT,
    job_description TEXT,
    requirements TEXT,
    
    -- File storage (local for now, S3 later)
    original_file_path TEXT, -- local path to uploaded PDF/document (will become S3 URL)
    processed_text TEXT, -- extracted text from PDF for easier processing
    
    -- Processing metadata
    processing_status TEXT DEFAULT 'pending', -- pending, processed, failed
    processing_quality FLOAT,
    keywords JSONB, -- extracted keywords for matching
    
    -- Application tracking
    application_status TEXT DEFAULT 'interested', -- interested, applied, interviewing, rejected, offered
    application_date TIMESTAMPTZ,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create resumes_v2 table (many per profile, optionally linked to job_postings)
CREATE TABLE resumes_v2 (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles_v2(id) ON DELETE CASCADE,
    job_posting_id INTEGER REFERENCES job_postings_v2(id) ON DELETE SET NULL, -- optional link to specific job
    
    -- Core Identity (same as profile)
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    
    -- Career Profile (same as profile)
    professional_summary TEXT,
    career_level TEXT,
    years_experience INTEGER,
    primary_domain TEXT,
    
    -- JSON fields for flexible data storage (same as profile)
    seniority_keywords JSONB,
    experience JSONB,
    education JSONB,
    skills JSONB,
    languages JSONB,
    
    -- Enhanced Profile Data (same as profile)
    career_trajectory JSONB,
    domain_expertise JSONB,
    leadership_experience JSONB,
    achievement_highlights JSONB,
    
    -- Resume specific fields
    source_documents JSONB, -- references to profile version used
    misc_data JSONB,
    
    -- File storage (local for now, S3 later)
    file_path TEXT, -- local path to generated/uploaded PDF (will become S3 URL)
    file_type TEXT DEFAULT 'generated', -- generated, uploaded
    
    -- Resume metadata
    version INTEGER DEFAULT 1, -- for tracking resume versions
    is_active BOOLEAN DEFAULT true,
    customization_notes TEXT, -- notes about customizations for specific job
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_v2_user_id ON profiles_v2(user_id);
CREATE INDEX idx_profiles_v2_email ON profiles_v2(email);

CREATE INDEX idx_job_postings_v2_profile_id ON job_postings_v2(profile_id);
CREATE INDEX idx_job_postings_v2_company ON job_postings_v2(company_name);
CREATE INDEX idx_job_postings_v2_status ON job_postings_v2(application_status);

CREATE INDEX idx_resumes_v2_profile_id ON resumes_v2(profile_id);
CREATE INDEX idx_resumes_v2_job_posting_id ON resumes_v2(job_posting_id);
CREATE INDEX idx_resumes_v2_active ON resumes_v2(is_active);

-- Create updated_at triggers
CREATE TRIGGER update_profiles_v2_updated_at 
    BEFORE UPDATE ON profiles_v2 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_v2_updated_at 
    BEFORE UPDATE ON job_postings_v2 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_v2_updated_at 
    BEFORE UPDATE ON resumes_v2 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments for documentation
COMMENT ON TABLE profiles_v2 IS 'V2: User profiles - one per user, contains all career information';
COMMENT ON TABLE job_postings_v2 IS 'V2: Job postings that users are interested in or have applied to';
COMMENT ON TABLE resumes_v2 IS 'V2: Resumes generated or uploaded for specific jobs or general use';

COMMENT ON COLUMN profiles_v2.user_id IS 'One-to-one relationship with users table';
COMMENT ON COLUMN job_postings_v2.profile_id IS 'One profile can have many job postings';
COMMENT ON COLUMN resumes_v2.profile_id IS 'One profile can have many resumes';
COMMENT ON COLUMN resumes_v2.job_posting_id IS 'Optional link to specific job posting - null for general resumes';

-- Enable Row Level Security on new tables
ALTER TABLE profiles_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes_v2 ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON profiles_v2 TO authenticated;
GRANT ALL ON job_postings_v2 TO authenticated;
GRANT ALL ON resumes_v2 TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE profiles_v2_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE job_postings_v2_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE resumes_v2_id_seq TO authenticated;

-- Note: After testing, you can:
-- 1. Migrate data from old tables to v2 tables
-- 2. Update application code to use v2 tables
-- 3. Drop old tables when confident
-- 4. Rename v2 tables to remove the _v2 suffix