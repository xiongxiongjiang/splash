from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
import uvicorn
import logging
import asyncio
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables from .env.local in development
load_dotenv(".env.local")

# Import MCP integration
from fastapi_mcp import FastApiMCP

# Import our modules
from database import (
    init_db, get_session,
    get_resumes_by_email, create_resume, delete_resume, get_database_stats, 
    add_to_waitlist, update_waitlist_info, SupabaseSession, create_profile, clear_profile, get_profile_by_user_id
)
from auth import get_current_user
from models import User, UserRead, ResumeRead, WaitlistCreate, WaitlistUpdate, WaitlistRead, ProfileRead
from resume_parser import parse_resume_pdf
from admin import create_admin
from klaviyo_integration import subscribe_to_klaviyo_from_waitlist, update_klaviyo_from_waitlist
from middleware import custom_cors_middleware, https_redirect_middleware
from config import MCP_MOUNT_PATH, MCP_OPERATIONS, APP_TITLE, APP_DESCRIPTION, APP_VERSION
from chat import (
    ChatCompletionRequest, 
    create_chat_completion, 
    create_chat_completion_stream
)
from workflows import workflow_visualizer
from controllers import upload_router, resume_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
class AppState:
    def __init__(self):
        self.mcp_server = None
        self.mcp_initialized = False

app_state = AppState()


async def initialize_mcp_server(app: FastAPI) -> None:
    """Initialize and mount the MCP server."""
    try:
        logger.info("Initializing MCP Server...")
        
        app_state.mcp_server = FastApiMCP(
            fastapi=app,
            name="Resume Management MCP Server",
            description="MCP server for Resume Management API - provides tools for managing users and resumes",
            include_operations=MCP_OPERATIONS,
            describe_full_response_schema=True,
            describe_all_responses=True
        )
        
        app_state.mcp_server.mount(app, mount_path=MCP_MOUNT_PATH)
        await asyncio.sleep(0.5)  # Small delay after mounting
        
        app_state.mcp_initialized = True
        
        logger.info("🔗 MCP Server initialized and mounted at %s!", MCP_MOUNT_PATH)
        logger.info("🤖 AI tools can now access Resume Management API via MCP")
        logger.info("📋 Available MCP tools: %s", ", ".join(MCP_OPERATIONS))
        logger.info("🌐 MCP endpoint: http://localhost:8000%s", MCP_MOUNT_PATH)
        
    except Exception as e:
        logger.error("Failed to initialize MCP server: %s", e)
        app_state.mcp_initialized = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    try:
        # Startup
        logger.info("Starting up...")
        await init_db()
        
        # Note: Seed data is now handled via .seed.sql file
        # Run manually in Supabase dashboard when needed
        
        await asyncio.sleep(1)  # Ensure database is ready
        await initialize_mcp_server(app)
        
        # Generate workflow system documentation
        logger.info("🔄 Generating workflow system documentation...")
        
        # Temporarily reduce logging level to avoid noise during visualization
        original_level = logging.getLogger("workflows.workflow_visualizer").level
        logging.getLogger("workflows.workflow_visualizer").setLevel(logging.ERROR)
        
        workflow_visualizer.generate_full_report()
        
        # Restore original logging level
        logging.getLogger("workflows.workflow_visualizer").setLevel(original_level)
        
    except Exception as e:
        logger.error("Startup failed: %s", e)
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    app_state.mcp_initialized = False


# Create FastAPI app
app = FastAPI(
    title=APP_TITLE, 
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan
)

# ==================== ENDPOINT ORGANIZATION ====================
# 
# PUBLIC ENDPOINTS: No authentication required
# BASIC CRUD ENDPOINTS: Basic user/profile/resume operations (most MCP exposed)
# HIGH LEVEL WORKFLOW ENDPOINTS: AI-powered workflows (select endpoints MCP exposed)
# ADMIN ENDPOINTS: Admin interface (not MCP exposed)
# CHAT ENDPOINTS: AI chat with function calling (MCP enabled)
#
# MCP Exposure Policy:
# - Basic CRUD operations: Exposed for chat agent access
# - Analysis/gap identification: Exposed for chat agent access  
# - File uploads: Not exposed (handled via direct API calls)
# - Generation endpoints: Not exposed (called directly by frontend)
# ====================================================================

# Add middleware
app.middleware("http")(custom_cors_middleware)
app.middleware("http")(https_redirect_middleware)

# Include routers
app.include_router(upload_router)
app.include_router(resume_router)

# Initialize Admin (disabled for Supabase)
create_admin(app)


@app.middleware("http")
async def check_mcp_ready(request, call_next):
    """Check if MCP is ready for MCP requests."""
    if request.url.path.startswith(MCP_MOUNT_PATH) and not app_state.mcp_initialized:
        raise HTTPException(
            status_code=503,
            detail="MCP server is still initializing, please try again in a moment"
        )
    return await call_next(request)


# ==================== PUBLIC ENDPOINTS ====================

@app.get("/", operation_id="get_server_info")
async def get_server_info():
    """Get server information and status."""
    return {
        "message": "Resume Management API v2.0", 
        "status": "running",
        "features": [
            "SQLModel", 
            "Async SQLAlchemy", 
            "Supabase authentication", 
            "Protected endpoints", 
            "Admin interface", 
            "MCP server"
        ],
        "admin_url": "/admin",
        "mcp_available": app_state.mcp_initialized,
        "mcp_endpoint": MCP_MOUNT_PATH if app_state.mcp_initialized else None,
        "mcp_tools": MCP_OPERATIONS if app_state.mcp_initialized else []
    }


@app.get("/health", operation_id="check_server_health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mcp_ready": app_state.mcp_initialized
    }


@app.get("/mcp-info", operation_id="get_mcp_info")
async def get_mcp_info():
    """Get MCP server information and available tools."""
    if not app_state.mcp_initialized:
        raise HTTPException(
            status_code=503,
            detail="MCP server is not yet initialized"
        )
    
    return {
        "mcp_server": "Resume Management MCP Server",
        "mcp_endpoint": MCP_MOUNT_PATH,
        "mcp_ready": app_state.mcp_initialized,
        "available_tools": MCP_OPERATIONS,
        "description": "MCP server for Resume Management API - provides tools for managing users and resumes"
    }


@app.get("/stats", operation_id="get_database_statistics")
async def get_database_stats_endpoint(session: SupabaseSession = Depends(get_session)):
    """Get database statistics."""
    logger.info("GET /stats")
    return await get_database_stats(session)


@app.post("/waitlist", response_model=WaitlistRead, operation_id="add_to_waitlist")
async def add_to_waitlist_endpoint(
    waitlist_data: WaitlistCreate,
    session: SupabaseSession = Depends(get_session)
):
    """Add an email to the waitlist and automatically subscribe to Klaviyo."""
    logger.info("POST /waitlist - email=%s", waitlist_data.email)
    
    # Add to waitlist
    waitlist_entry = await add_to_waitlist(
        session, 
        email=waitlist_data.email, 
        info=waitlist_data.info or {}
    )
    
    # Automatically subscribe to Klaviyo (non-blocking)
    await subscribe_to_klaviyo_from_waitlist(
        email=waitlist_data.email,
        info=waitlist_data.info or {}
    )
    
    return WaitlistRead.model_validate(waitlist_entry)


@app.patch("/waitlist/{email}", response_model=WaitlistRead, operation_id="update_waitlist_info")
async def update_waitlist_info_endpoint(
    email: str,
    update_data: WaitlistUpdate,
    session: SupabaseSession = Depends(get_session)
):
    """Update waitlist info for an email (merges with existing info) and sync to Klaviyo."""
    logger.info("PATCH /waitlist/%s", email)
    
    waitlist_entry = await update_waitlist_info(
        session,
        email=email,
        new_info=update_data.info
    )
    
    if not waitlist_entry:
        raise HTTPException(
            status_code=404,
            detail=f"Email {email} not found in waitlist"
        )
    
    # Automatically update Klaviyo profile properties (non-blocking)
    await update_klaviyo_from_waitlist(
        email=email,
        updated_info=update_data.info
    )
    
    return WaitlistRead.model_validate(waitlist_entry)


# ==================== BASIC CRUD ENDPOINTS ====================

# Basic user and data management endpoints (MCP exposed)


@app.get("/me", response_model=dict, operation_id="get_current_user_info")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information. Requires authentication."""
    return {
        "user": UserRead.model_validate(current_user),
        "message": "You are successfully authenticated!"
    }


@app.get("/my-resumes", response_model=dict, operation_id="get_user_resumes")
async def get_user_resumes(
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Get resumes belonging to the current user. Requires authentication."""
    logger.info("GET /my-resumes for user: %s", current_user.email)
    
    resumes = await get_resumes_by_email(session, current_user.email)
    
    return {
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "count": len(resumes),
        "user_email": current_user.email
    }


@app.get("/my-profile", response_model=dict, operation_id="get_user_profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Get profile for the current user. Requires authentication."""
    logger.info("GET /my-profile for user: %s", current_user.email)
    
    profile = await get_profile_by_user_id(session, current_user.id)
    
    if profile:
        return {
            "profile": ProfileRead.model_validate(profile),
            "user_email": current_user.email
        }
    else:
        return {
            "profile": None,
            "user_email": current_user.email,
            "message": "No profile found for user"
        }


@app.delete("/resumes/{resume_id}", operation_id="delete_resume")
async def delete_resume_endpoint(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Delete a resume by ID. Requires authentication and ownership."""
    logger.info("DELETE /resumes/%d for user: %s", resume_id, current_user.email)
    
    success = await delete_resume(session, resume_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Resume not found or you don't have permission to delete it"
        )
    
    return {
        "success": True,
        "message": "Resume deleted successfully"
    }


@app.delete("/clear-profile", operation_id="clear_profile")
async def clear_profile_endpoint(
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Clear user's profile and all associated resumes (for testing/reset). Requires authentication."""
    logger.info("DELETE /clear-profile for user: %s", current_user.email)
    
    success = await clear_profile(session, current_user.id)
    
    if success:
        return {
            "success": True,
            "message": "Profile and all associated resumes cleared successfully"
        }
    else:
        return {
            "success": True,
            "message": "No profile found to clear"
        }


@app.patch("/my-profile", response_model=dict, operation_id="update_user_profile")
async def update_user_profile(
    profile_updates: dict,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Update user's profile with provided changes. Requires authentication."""
    logger.info("PATCH /my-profile for user: %s", current_user.email)
    raise NotImplementedError("Profile updating not yet implemented")


@app.patch("/my-resumes/{resume_id}", response_model=dict, operation_id="update_resume")
async def update_resume(
    resume_id: int,
    resume_updates: dict,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Update a specific resume with provided changes. Requires authentication and ownership."""
    logger.info("PATCH /my-resumes/%d for user: %s", resume_id, current_user.email)
    raise NotImplementedError("Resume updating not yet implemented")


# ==================== HIGH LEVEL WORKFLOW ENDPOINTS ====================

# Advanced AI-powered workflows (select endpoints MCP exposed)


@app.post("/parse-job-posting", response_model=dict, operation_id="parse_job_posting")
async def parse_job_posting(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Parse uploaded job posting PDF and extract requirements, responsibilities, and qualifications."""
    logger.info("POST /parse-job-posting for user: %s", current_user.email)
    raise NotImplementedError("Job posting parsing not yet implemented")


@app.get("/identify-profile-gaps", response_model=dict, operation_id="identify_profile_gaps")
async def identify_profile_gaps(
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Analyze user's profile to identify missing skills, experience gaps, and improvement areas."""
    logger.info("GET /identify-profile-gaps for user: %s", current_user.email)
    raise NotImplementedError("Profile gap analysis not yet implemented")


@app.post("/identify-gaps-per-job", response_model=dict, operation_id="identify_gaps_per_job")
async def identify_gaps_per_job(
    job_posting_id: int,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Compare user's profile against a specific job posting to identify skill/experience gaps."""
    logger.info("POST /identify-gaps-per-job job=%d for user: %s", job_posting_id, current_user.email)
    raise NotImplementedError("Job-specific gap analysis not yet implemented")


@app.post("/generate-resume", response_model=dict, operation_id="generate_resume")
async def generate_resume(
    job_posting_id: int,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Generate a customized resume tailored to a specific job posting. Validates no critical gaps exist."""
    logger.info("POST /generate-resume job=%d for user: %s", job_posting_id, current_user.email)
    raise NotImplementedError("Resume generation not yet implemented")


@app.post("/generate-referral", response_model=dict, operation_id="generate_referral")
async def generate_referral(
    job_posting_id: int,
    referrer_info: dict,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Generate personalized referral request message for a specific job and referrer. Validates profile completeness."""
    logger.info("POST /generate-referral job=%d for user: %s", job_posting_id, current_user.email)
    raise NotImplementedError("Referral generation not yet implemented")


@app.get("/get-context", response_model=dict, operation_id="get_context")
async def get_context(
    job_posting_id: int = None,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Get relevant context data including user profile, job details (if provided), and static reference data."""
    logger.info("GET /get-context job=%s for user: %s", job_posting_id, current_user.email)
    raise NotImplementedError("Context retrieval not yet implemented")


@app.post("/parse-resume", response_model=dict, operation_id="parse_resume")
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    session: SupabaseSession = Depends(get_session)
):
    """Parse uploaded resume PDF. This is a public endpoint."""
    logger.info("POST /parse-resume - public endpoint")
    
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    try:
        # Read PDF content
        pdf_bytes = await file.read()
        
        # Parse resume using LLM DAG
        parse_result = await parse_resume_pdf(pdf_bytes)
        
        if not parse_result["success"]:
            return {
                "success": False,
                "error": parse_result["error"]
            }
        
        # Create profile from parsed data
        parsed_data = parse_result["profile"]
        
        # Convert parsed resume data to profile format
        profile_data = {
            "name": parsed_data.get("name"),
            "email": parsed_data.get("email"),
            "phone": parsed_data.get("phone"),
            "location": parsed_data.get("location"),
            "professional_summary": parsed_data.get("summary"),
            "years_experience": len(parsed_data.get("experience", [])),
            "skills": {"raw_skills": parsed_data.get("skills", [])},
            "experience": {"jobs": parsed_data.get("experience", [])},
            "education": {"degrees": parsed_data.get("education", [])},
            "languages": {"spoken": parsed_data.get("languages", [])},
            "source_documents": {"original_resume": file.filename},
            "processing_quality": 0.85,  # Default quality score
            "user_id": current_user.id,
            "enhancement_status": "basic",
            "data_sources": {"sources": ["resume_upload"]}
        }
        
        # Create profile in database
        profile = await create_profile(session, profile_data)
        
        # Also create a resume entry for backward compatibility with dashboard
        resume_data = {
            "name": parsed_data.get("name"),
            "email": parsed_data.get("email"),
            "phone": parsed_data.get("phone"),
            "professional_summary": parsed_data.get("summary"),
            "years_experience": len(parsed_data.get("experience", [])),
            "skills": {"raw_skills": parsed_data.get("skills", [])},
            "education": {"degrees": parsed_data.get("education", [])},
            "user_id": current_user.id
        }
        
        resume = await create_resume(session, resume_data)
        
        return {
            "success": True,
            "profile": ProfileRead.model_validate(profile),
            "resume": ResumeRead.model_validate(resume),
            "message": "Resume parsed and saved successfully"
        }
        
    except Exception as e:
        import traceback
        logger.error("Error parsing resume: %s", e)
        logger.error("Full traceback: %s", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse resume: {str(e)}"
        )


@app.post("/parse-resume-stream", operation_id="parse_resume_stream")
async def parse_resume_stream_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Parse uploaded resume PDF with streaming progress updates. Requires authentication."""
    logger.info("POST /parse-resume-stream for user: %s", current_user.email)
    
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    from fastapi.responses import StreamingResponse
    import json
    from resume_parser_stream import parse_resume_pdf_stream
    
    # Read PDF content before starting the generator
    pdf_bytes = await file.read()
    
    async def generate_events():
        try:
            # Create a queue to collect progress events
            import asyncio
            progress_queue = asyncio.Queue()
            
            # Progress callback that adds to queue
            async def progress_callback(progress_data):
                await progress_queue.put(progress_data)
            
            # Parse resume in background task
            async def parse_task():
                result = await parse_resume_pdf_stream(pdf_bytes, progress_callback)
                await progress_queue.put({"done": True, "result": result})
            
            # Start parsing task
            task = asyncio.create_task(parse_task())
            
            # Yield progress events as they come
            while True:
                item = await progress_queue.get()
                
                if "done" in item:
                    result = item["result"]
                    break
                    
                # Yield progress event
                event = {
                    "event": "progress",
                    "data": item
                }
                yield f"data: {json.dumps(event)}\n\n"
            
            if result["success"]:
                # Get parsed data
                parsed_data = result["profile"]
                
                # Convert parsed resume data to profile format
                profile_data = {
                    "name": parsed_data.get("name"),
                    "email": parsed_data.get("email"),
                    "phone": parsed_data.get("phone"),
                    "location": parsed_data.get("location"),
                    "professional_summary": parsed_data.get("summary"),
                    "years_experience": len(parsed_data.get("experience", [])),
                    "skills": {"raw_skills": parsed_data.get("skills", [])},
                    "experience": {"jobs": parsed_data.get("experience", [])},
                    "education": {"degrees": parsed_data.get("education", [])},
                    "languages": {"spoken": parsed_data.get("languages", [])},
                    "source_documents": {"original_resume": file.filename},
                    "processing_quality": 0.85,  # Default quality score
                    "user_id": current_user.id,
                    "enhancement_status": "basic",
                    "data_sources": {"sources": ["resume_upload"]}
                }
                
                # Create profile in database
                profile = await create_profile(session, profile_data)
                
                # Also create a resume entry for backward compatibility with dashboard
                resume_data = {
                    "name": parsed_data.get("name"),
                    "email": parsed_data.get("email"),
                    "phone": parsed_data.get("phone"),
                    "professional_summary": parsed_data.get("summary"),
                    "years_experience": len(parsed_data.get("experience", [])),
                    "skills": {"raw_skills": parsed_data.get("skills", [])},
                    "education": {"degrees": parsed_data.get("education", [])},
                    "user_id": current_user.id
                }
                
                resume = await create_resume(session, resume_data)
                
                # Send final result
                final_event = {
                    "event": "complete",
                    "data": {
                        "success": True,
                        "profile": ProfileRead.model_validate(profile).model_dump(mode='json'),
                        "resume": ResumeRead.model_validate(resume).model_dump(mode='json'),
                        "message": "Resume parsed and saved successfully"
                    }
                }
                yield f"data: {json.dumps(final_event)}\n\n"
            else:
                # Send error event
                error_event = {
                    "event": "error",
                    "data": {
                        "success": False,
                        "error": result["error"]
                    }
                }
                yield f"data: {json.dumps(error_event)}\n\n"
                
        except Exception as e:
            logger.error("Error in resume stream: %s", e)
            error_event = {
                "event": "error",
                "data": {
                    "success": False,
                    "error": str(e)
                }
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ==================== CHAT ENDPOINTS ====================

# AI chat completions with function calling (MCP enabled)

@app.post("/chat/completions", operation_id="create_chat_completion")
async def create_chat_completion_endpoint(
    request: ChatCompletionRequest,
    current_user: User = Depends(get_current_user),
    session: SupabaseSession = Depends(get_session)
):
    """Create a chat completion with function calling support"""
    logger.info("POST /chat/completions - model=%s, stream=%s", request.model, request.stream)
    
    if request.stream:
        from fastapi.responses import StreamingResponse
        import json
        
        async def generate_stream():
            async for chunk in create_chat_completion_stream(request, session, current_user):
                yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    response = await create_chat_completion(request, session, current_user)
    return response


@app.get("/chat/models", operation_id="list_chat_models")
async def list_chat_models():
    """List available chat models"""
    return {
        "object": "list",
        "data": [
            {
                "id": "gemini/gemini-1.5-flash",
                "object": "model",
                "created": 1640995200,
                "owned_by": "google",
                "root": "gemini/gemini-1.5-flash",
                "parent": None,
                "permission": []
            }
        ]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)