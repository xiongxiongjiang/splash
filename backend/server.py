from fastapi import FastAPI, Query, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn
import logging
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env.local in development
load_dotenv(".env.local")

# Import MCP integration
from fastapi_mcp import FastApiMCP

# Import our modules
from database import (
    init_db, seed_initial_data, get_session, get_all_resumes, get_resume_by_id,
    get_resumes_by_email, create_resume, get_database_stats, get_user_by_email, 
    add_to_waitlist, update_waitlist_info,
    engine, async_session
)
from auth import get_current_user, get_optional_user, get_admin_user
from models import User, UserRead, Resume, ResumeCreate, ResumeRead, Waitlist, WaitlistCreate, WaitlistUpdate, WaitlistRead
from admin import create_admin
from klaviyo_integration import subscribe_to_klaviyo_from_waitlist, update_klaviyo_from_waitlist

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration constants
MCP_MOUNT_PATH = "/mcp"
ALLOWED_ORIGINS = [
    "http://localhost:3000", 
    "http://localhost:3001", 
    "https://osugovugrrthcqelvagj.supabase.co"
]
MCP_OPERATIONS = [
    "search_all_resumes",
    "get_resume_details", 
    "find_resumes_by_skill",
    "get_database_statistics",
    "check_server_health",
    "get_server_info"
]

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
        
        async with async_session() as session:
            await seed_initial_data(session)
        
        await asyncio.sleep(1)  # Ensure database is ready
        await initialize_mcp_server(app)
        
    except Exception as e:
        logger.error("Startup failed: %s", e)
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    app_state.mcp_initialized = False


# Create FastAPI app
app = FastAPI(
    title="Resume Management API", 
    description="REST API for managing and searching resumes with SQLModel and authentication",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLAdmin
admin = create_admin(app, engine)


@app.middleware("http")
async def check_mcp_ready(request, call_next):
    """Check if MCP is ready for MCP requests."""
    if request.url.path.startswith(MCP_MOUNT_PATH) and not app_state.mcp_initialized:
        raise HTTPException(
            status_code=503,
            detail="MCP server is still initializing, please try again in a moment"
        )
    
    response = await call_next(request)
    return response


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
async def get_database_stats_endpoint(session: AsyncSession = Depends(get_session)):
    """Get database statistics."""
    logger.info("GET /stats")
    return await get_database_stats(session)


@app.post("/waitlist", response_model=WaitlistRead, operation_id="add_to_waitlist")
async def add_to_waitlist_endpoint(
    waitlist_data: WaitlistCreate,
    session: AsyncSession = Depends(get_session)
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
    session: AsyncSession = Depends(get_session)
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


# ==================== RESUME ENDPOINTS ====================

@app.get("/resumes", response_model=dict, operation_id="search_all_resumes")
async def search_resumes(
    limit: Optional[int] = Query(None, ge=1, description="Maximum number of resumes to return"),
    skill: Optional[str] = Query(None, description="Filter by skill"),
    min_experience: Optional[int] = Query(None, ge=0, description="Minimum years of experience"),
    current_user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session)
):
    """Get a list of resumes with optional filtering and limiting."""
    logger.info("GET /resumes - limit=%s, skill=%s, min_experience=%s", limit, skill, min_experience)
    logger.info("User: %s", current_user.email if current_user else "Anonymous")
    
    resumes = await get_all_resumes(session, limit=limit, skill=skill, min_experience=min_experience)
    stats = await get_database_stats(session)
    
    return {
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "total_in_db": stats["total_resumes"],
        "returned": len(resumes),
        "filters_applied": {
            "skill": skill,
            "min_experience": min_experience,
            "limit": limit
        },
        "user_authenticated": current_user is not None
    }


@app.get("/resumes/{resume_id}", operation_id="get_resume_details")
async def get_resume_details(
    resume_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session)
):
    """Get a specific resume by ID."""
    logger.info("GET /resumes/%d", resume_id)
    
    resume = await get_resume_by_id(session, resume_id)
    if not resume:
        raise HTTPException(
            status_code=404, 
            detail=f"Resume with ID {resume_id} not found"
        )
    
    return {
        "success": True, 
        "resume": ResumeRead.model_validate(resume),
        "user_authenticated": current_user is not None
    }


@app.get("/resumes/search/skills", operation_id="find_resumes_by_skill")
async def find_resumes_by_skill(
    skill: str = Query(..., description="Skill to search for"),
    current_user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session)
):
    """Search resumes by skill."""
    logger.info("GET /resumes/search/skills - skill=%s", skill)
    
    resumes = await get_all_resumes(session, skill=skill)
    
    return {
        "skill_searched": skill,
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "count": len(resumes),
        "user_authenticated": current_user is not None
    }


# ==================== PROTECTED ENDPOINTS ====================

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
    session: AsyncSession = Depends(get_session)
):
    """Get resumes belonging to the current user. Requires authentication."""
    logger.info("GET /my-resumes for user: %s", current_user.email)
    
    resumes = await get_resumes_by_email(session, current_user.email)
    
    return {
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "count": len(resumes),
        "user_email": current_user.email
    }


@app.post("/resumes", response_model=dict, operation_id="create_resume")
async def create_new_resume(
    resume_data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new resume. Requires authentication."""
    logger.info("POST /resumes for user: %s", current_user.email)
    
    # Convert ResumeCreate to dict and add user_id
    resume_dict = resume_data.model_dump()
    resume_dict["user_id"] = current_user.id
    
    created_resume = await create_resume(session, resume_dict)
    
    return {
        "success": True,
        "resume": ResumeRead.model_validate(created_resume),
        "message": "Resume created successfully"
    }


@app.get("/users/by-email/{email}", operation_id="get_user_by_email")
async def get_user_by_email_endpoint(
    email: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get user information by email. Requires authentication."""
    # Security check: users can only access their own data, admins can access anyone's
    if current_user.email != email and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own user information"
        )
    
    user = await get_user_by_email(session, email)
    if not user:
        raise HTTPException(
            status_code=404, 
            detail=f"User with email {email} not found"
        )
    
    resumes = await get_resumes_by_email(session, email)
    
    return {
        "user": UserRead.model_validate(user),
        "resumes": [ResumeRead.model_validate(resume) for resume in resumes],
        "resume_count": len(resumes)
    }


# ==================== ADMIN ENDPOINTS ====================

@app.get("/admin/users", operation_id="get_all_users")
async def get_all_users_admin(
    admin_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all users (admin only)."""
    logger.info("GET /admin/users by admin: %s", admin_user.email)
    
    # TODO: Implement get_all_users function in database module
    return {
        "message": "Admin endpoint - would return all users",
        "admin_user": admin_user.email,
        "note": "This endpoint needs implementation in the database module"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)