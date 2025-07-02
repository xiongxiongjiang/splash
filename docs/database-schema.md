# Database Schema Design

## Database Tables

### users table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    supabase_id VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    name VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### profiles_v2 table
```sql
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
    
    -- JSON fields
    seniority_keywords JSONB,
    experience JSONB,
    education JSONB,
    skills JSONB,
    languages JSONB,
    career_trajectory JSONB,
    domain_expertise JSONB,
    leadership_experience JSONB,
    achievement_highlights JSONB,
    
    -- Metadata
    source_documents JSONB,
    processing_quality FLOAT,
    last_resume_update TIMESTAMPTZ,
    processing_history JSONB,
    enhancement_status TEXT DEFAULT 'basic',
    confidence_score FLOAT,
    data_sources JSONB,
    keywords JSONB, -- for search, filtering, and categorization
    
    -- Profile Completeness
    completeness_metadata JSONB,
    /* Example:
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
    
    misc_data JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_profile_v2 UNIQUE(user_id)
);
```

### job_postings_v2 table
```sql
CREATE TABLE job_postings_v2 (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles_v2(id) ON DELETE CASCADE,
    
    -- Job metadata
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    job_type TEXT,
    salary_range TEXT,
    job_description TEXT,
    requirements TEXT,
    
    -- File storage
    original_file_path TEXT, -- local now, S3 URL later
    processed_text TEXT,
    
    -- Processing
    processing_status TEXT DEFAULT 'pending',
    processing_quality FLOAT,
    keywords JSONB,
    
    -- Application tracking
    application_status TEXT DEFAULT 'interested',
    application_date TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### resumes_v2 table
```sql
CREATE TABLE resumes_v2 (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles_v2(id) ON DELETE CASCADE,
    job_posting_id INTEGER REFERENCES job_postings_v2(id) ON DELETE SET NULL,
    
    -- Same fields as profile for full customization
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    professional_summary TEXT,
    career_level TEXT,
    years_experience INTEGER,
    primary_domain TEXT,
    
    -- JSON fields
    seniority_keywords JSONB,
    experience JSONB,
    education JSONB,
    skills JSONB,
    languages JSONB,
    career_trajectory JSONB,
    domain_expertise JSONB,
    leadership_experience JSONB,
    achievement_highlights JSONB,
    source_documents JSONB,
    misc_data JSONB,
    
    -- File storage
    file_path TEXT, -- local now, S3 URL later
    file_type TEXT DEFAULT 'generated',
    
    -- Metadata
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    customization_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### waitlist table
```sql
CREATE TABLE waitlist (
    email VARCHAR PRIMARY KEY,
    info JSON,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## Relationships Explained

### 1. Users → Profiles (One-to-One)
- Each user has exactly one profile
- Profile contains all career-related information
- Enforced by `UNIQUE(user_id)` constraint on profiles table

### 2. Profiles → Job Postings (One-to-Many)
- Each profile can track multiple job opportunities
- Job postings store the original job listing (PDF/text)
- Tracks application status and metadata

### 3. Profiles → Resumes (One-to-Many)
- Each profile can have multiple resume versions
- General resumes: `job_posting_id = NULL`
- Job-specific resumes: linked to a job posting

### 4. Job Postings → Resumes (One-to-Many)
- Each job posting can have multiple tailored resumes
- Allows versioning and A/B testing of resumes
- Optional relationship (resumes can exist without job posting)
