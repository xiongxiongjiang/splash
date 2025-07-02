# Overall Architecture 
# Frontend-Backend Chat Interaction Design

Our chat system uses a **centralized backend approach** where all AI processing happens server-side, with the frontend acting as a pure UI layer.

```
Frontend UI (CRUD) ──────────► Backend REST API ──────────► Database
                                       │
Frontend Chat ───────────────► Backend Chat Completions ──┤
                                       │                   │
                                       ▼                   ▼
                              Internal Tool Registry    Database
                              (backend/config.py)      (via tools)
                                       │
                                       ▼
                              LiteLLM + LangGraph
                              (AI Processing)
```

## Design Components

1. **Frontend Chat UI** (`ModernChat.tsx`)
   - Sends user messages to `/chat/completions`
   - Handles structured responses (workflow cards, analysis cards)
   - Pure UI layer with no AI logic

2. **Backend Chat Completions** (`chat.py`)
   - LangGraph workflow for intent classification
   - LiteLLM integration for AI responses
   - Function calling with internal tool registry

3. **Tool Registry** (`config.py`)
   - MCP-exposed operations for AI agent access
   - Automatic tool discovery from REST endpoints
   - Centralized configuration: `MCP_OPERATIONS = [...]`

## Implementation Benefits

**Why Backend-Centralized vs Frontend-MCP Discovery:**

✅ **Chosen Approach - Backend Centralized:**
- **Security**: API keys and sensitive operations stay server-side
- **Performance**: No network latency for tool discovery
- **Consistency**: Single source of truth for available tools
- **Simplicity**: Frontend focuses purely on UI/UX

❌ **Alternative - Frontend MCP Discovery:**
- Requires exposing MCP endpoints publicly
- Complex frontend tool registration and management
- Security concerns with client-side AI processing
- Higher complexity for tool authentication

## Code Integration

- **MCP Operations**: Defined in `backend/config.py`
- **Workflow Logic**: `backend/chat_workflow.py` (LangGraph)
- **Tool Execution**: `backend/chat.py` (function calling)
- **UI Components**: `frontend/src/components/ModernChat.tsx`



# Schema Design

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

# Endpoints

## Endpoint Categories & Implementation Status

### 🌍 PUBLIC ENDPOINTS
*No authentication required*

| Endpoint | Method | Status | MCP | Description |
|----------|--------|--------|-----|-------------|
| `/` | GET | ✅ | ✅ | Server info and status |
| `/health` | GET | ✅ | ✅ | Health check |
| `/mcp-info` | GET | ✅ | ❌ | MCP server information |
| `/stats` | GET | ✅ | ✅ | Database statistics |
| `/waitlist` | POST | ✅ | ❌ | Add email to waitlist |
| `/waitlist/{email}` | PATCH | ✅ | ❌ | Update waitlist info |

### 👤 BASIC CRUD ENDPOINTS
*User authentication required - most MCP exposed for chat agent access*

| Endpoint | Method | Status | MCP | Description |
|----------|--------|--------|-----|-------------|
| `/me` | GET | ✅ | ✅ | Current user info |
| `/my-resumes` | GET | ✅ | ✅ | User's resumes |
| `/my-profile` | GET | ✅ | ✅ | User's profile |
| `/my-profile` | PATCH | ❌ | ✅ | Update user profile |
| `/my-resumes/{id}` | PATCH | ❌ | ✅ | Update specific resume |
| `/resumes/{id}` | DELETE | ✅ | ❌ | Delete resume |
| `/clear-profile` | DELETE | ✅ | ❌ | Clear profile (testing) |

### 🤖 HIGH LEVEL WORKFLOW ENDPOINTS
*AI-powered workflows - select endpoints MCP exposed for chat agent access*

| Endpoint | Method | Status | MCP | Description |
|----------|--------|--------|-----|-------------|
| `/parse-job-posting` | POST | ❌ | ❌ | Parse job posting PDF |
| `/identify-profile-gaps` | GET | ❌ | ✅ | Analyze profile gaps |
| `/identify-gaps-per-job` | POST | ❌ | ✅ | Job-specific gap analysis |
| `/get-context` | GET | ❌ | ✅ | Get relevant context data |
| `/parse-resume` | POST | ✅ | ❌ | Parse resume PDF |
| `/generate-resume` | POST | ❌ | ❌ | Generate tailored resume |
| `/generate-referral` | POST | ❌ | ❌ | Generate referral message |

### 💬 CHAT ENDPOINTS
*AI chat with LangGraph integration*

| Endpoint | Method | Status | MCP | Description |
|----------|--------|--------|-----|-------------|
| `/chat/completions` | POST | ✅ | ❌ | Chat completions with LangGraph |
| `/chat/models` | GET | ✅ | ❌ | Available chat models |

## Chat Endpoints & LangGraph Integration

### How Chat Endpoints Work with LangGraph

The `/chat/completions` endpoint implements a sophisticated AI workflow using **LangGraph** for state management and **LiteLLM** for AI responses:

```
User Message ──► Chat Endpoint ──► LangGraph Workflow ──► LiteLLM ──► Response
                      │                    │                  │
                      ▼                    ▼                  ▼
               Intent Classification → Workflow Nodes → Function Tools
                      │                    │                  │
                      ▼                    ▼                  ▼
              general_chat          gap_identification    MCP Tools
              gap_identification    profile_analysis      (backend/config.py)
              profile_analysis      workflow_complete
```

### LangGraph Workflow Nodes

1. **`classify_intent`**: Analyzes user message to determine intent
   - `general_chat`: Normal conversation
   - `gap_identification`: Skill/experience gap analysis  
   - `profile_analysis`: Profile review requests
   - `job_analysis`: Job posting analysis

2. **Conditional Routing**: Based on intent classification
   - `general_chat` → `handle_general_chat` → Regular LiteLLM
   - `gap_identification` → `identify_gaps` → Gap analysis workflow
   - Other intents → Route to appropriate handlers

3. **Gap Analysis Workflow**: Multi-step iterative process
   - `identify_gaps`: Find skill/experience gaps
   - `prompt_for_gap_resolution`: Ask user for more details (3 iterations)
   - `validate_gap_resolution`: Check if gaps are addressed
   - `complete_workflow`: Finalize the process

### State Management

LangGraph maintains conversation state across multiple turns:
```python
class WorkflowState(TypedDict):
    messages: List[Dict[str, Any]]           # Conversation history
    current_intent: Optional[str]            # Classified intent
    job_posting_id: Optional[int]           # Optional job context
    identified_gaps: List[Dict[str, Any]]   # Found gaps
    gap_resolution_attempts: int            # Iteration counter
    workflow_complete: bool                 # Completion status
    user_id: Optional[int]                  # User context
    session_data: Dict[str, Any]           # Session persistence
```

### Internal Tool Access

Chat agents can access internal tools via the MCP registry (`backend/config.py`):
- **Database queries**: `get_user_profile`, `get_user_resumes`
- **Analysis tools**: `identify_profile_gaps`, `identify_gaps_per_job` 
- **Context tools**: `get_context`

The chat system automatically injects user context and calls appropriate tools based on conversation needs.

## Legend
- ✅ **Implemented & Working**
- ❌ **Not Implemented** (returns `NotImplementedError`)
- **MCP**: Exposed via Model Context Protocol for AI agent access

# Memory management 
TODO