-- Create profiles table for user profile data
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
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
    
    -- Enhanced Profile Data (JSON fields)
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
    search_keywords JSONB,
    profile_tags JSONB,
    
    -- Random/Misc Information
    misc_data JSONB,
    notes TEXT,
    
    -- Foreign key to users table
    user_id INTEGER REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();