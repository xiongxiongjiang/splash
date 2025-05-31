from fastapi import FastAPI, Query, HTTPException
from fastmcp import FastMCP
from typing import List, Optional
from pydantic import BaseModel
import uvicorn
import logging
import sys
import asyncio

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for better validation and documentation
class Resume(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    title: str
    experience_years: int
    skills: List[str]
    education: str
    summary: str

class ResumeResponse(BaseModel):
    resumes: List[Resume]
    total: int

RESUMES = [
    {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@email.com",
        "phone": "(555) 123-4567",
        "title": "Senior Software Engineer",
        "experience_years": 8,
        "skills": ["Python", "JavaScript", "React", "FastAPI", "PostgreSQL"],
        "education": "BS Computer Science - Stanford University",
        "summary": "Experienced full-stack developer with expertise in Python and modern web technologies."
    },
    {
        "id": 2, 
        "name": "Jane Smith",
        "email": "jane.smith@email.com",
        "phone": "(555) 987-6543", 
        "title": "Product Manager",
        "experience_years": 6,
        "skills": ["Product Strategy", "Agile", "Data Analysis", "SQL", "Figma"],
        "education": "MBA - Harvard Business School",
        "summary": "Results-driven product manager with proven track record of launching successful products."
    },
    {
        "id": 3,
        "name": "Mike Johnson", 
        "email": "mike.johnson@email.com",
        "phone": "(555) 456-7890",
        "title": "UX Designer",
        "experience_years": 4,
        "skills": ["UI/UX Design", "Figma", "Adobe Creative Suite", "User Research", "Prototyping"],
        "education": "BFA Design - Art Center College of Design",
        "summary": "Creative UX designer focused on user-centered design and accessibility."
    },
    {
        "id": 4,
        "name": "Sarah Wilson",
        "email": "sarah.wilson@email.com", 
        "phone": "(555) 321-9876",
        "title": "Data Scientist",
        "experience_years": 5,
        "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics"],
        "education": "PhD Statistics - MIT",
        "summary": "Data scientist specializing in machine learning and predictive analytics."
    },
    {
        "id": 5,
        "name": "David Chen",
        "email": "david.chen@email.com",
        "phone": "(555) 654-3210", 
        "title": "DevOps Engineer",
        "experience_years": 7,
        "skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "CI/CD"],
        "education": "BS Computer Engineering - UC Berkeley",
        "summary": "DevOps engineer with expertise in cloud infrastructure and automation."
    }
]

# Helper functions
def find_resume_by_id(resume_id: int) -> Optional[dict]:
    """Find a resume by ID"""
    return next((resume for resume in RESUMES if resume["id"] == resume_id), None)

def filter_resumes_by_skill(skill: str) -> List[dict]:
    """Filter resumes by skill (case-insensitive)"""
    return [
        resume for resume in RESUMES 
        if any(skill.lower() in s.lower() for s in resume["skills"])
    ]

def filter_resumes_by_experience(min_years: int) -> List[dict]:
    """Filter resumes by minimum experience years"""
    return [resume for resume in RESUMES if resume["experience_years"] >= min_years]

# Create FastAPI app for REST API
app = FastAPI(
    title="Resume Management API", 
    description="REST API for managing and searching resumes",
    version="1.0.0"
)

# Create FastMCP server for MCP protocol
mcp = FastMCP(
    name="Resume Management Server", 
    instructions="Server that provides resume data via MCP protocol. Use this to search, filter, and retrieve resume information."
)

# FastAPI REST endpoints
@app.get("/resumes", response_model=dict)
async def get_resumes_rest(
    limit: Optional[int] = Query(None, ge=1, description="Maximum number of resumes to return"),
    skill: Optional[str] = Query(None, description="Filter by skill"),
    min_experience: Optional[int] = Query(None, ge=0, description="Minimum years of experience")
):
    """
    Get a list of resumes with optional filtering and limiting.
    """
    logger.info(f"GET /resumes - limit={limit}, skill={skill}, min_experience={min_experience}")
    
    resumes = RESUMES
    
    # Apply filters
    if skill:
        resumes = filter_resumes_by_skill(skill)
    
    if min_experience is not None:
        resumes = filter_resumes_by_experience(min_experience)
    
    # Apply limit
    if limit is not None:
        resumes = resumes[:limit]
    
    return {
        "resumes": resumes,
        "total_in_db": len(RESUMES),
        "returned": len(resumes),
        "filters_applied": {
            "skill": skill,
            "min_experience": min_experience,
            "limit": limit
        }
    }

@app.get("/resumes/{resume_id}")
async def get_resume_by_id(resume_id: int):
    """
    Get a specific resume by ID.
    """
    logger.info(f"GET /resumes/{resume_id}")
    
    resume = find_resume_by_id(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume with ID {resume_id} not found")
    
    return {"success": True, "resume": resume}

@app.get("/resumes/search/skills")
async def search_by_skill(skill: str = Query(..., description="Skill to search for")):
    """
    Search resumes by skill.
    """
    logger.info(f"GET /resumes/search/skills - skill={skill}")
    
    matching_resumes = filter_resumes_by_skill(skill)
    return {
        "skill_searched": skill,
        "resumes": matching_resumes,
        "count": len(matching_resumes)
    }

@app.get("/stats")
async def get_stats():
    """
    Get database statistics.
    """
    logger.info("GET /stats")
    
    all_skills = []
    total_experience = 0
    
    for resume in RESUMES:
        all_skills.extend(resume["skills"])
        total_experience += resume["experience_years"]
    
    skill_counts = {}
    for skill in all_skills:
        skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    return {
        "total_resumes": len(RESUMES),
        "average_experience_years": round(total_experience / len(RESUMES), 1),
        "most_common_skills": sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:5],
        "unique_skills": len(set(all_skills))
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "service": "Resume Management Server"}

@app.get("/")
async def root():
    """
    Root endpoint with information about available services.
    """
    return {
        "message": "Resume Management Server",
        "version": "1.0.0",
        "services": {
            "rest_api": {
                "base_url": "http://localhost:8000",
                "endpoints": [
                    "GET /resumes - Get all resumes (with optional filters)",
                    "GET /resumes/{id} - Get resume by ID",
                    "GET /resumes/search/skills?skill={skill} - Search by skill",
                    "GET /stats - Get database statistics",
                    "GET /health - Health check"
                ],
                "documentation": "/docs"
            }
        }
    }

# MCP Tools - using the same business logic as FastAPI
@mcp.tool()
def get_all_resumes(limit: Optional[int] = None) -> dict:
    """
    Get a list of all resumes with an optional limit parameter.
    
    Args:
        limit: Maximum number of resumes to return (optional)
    
    Returns:
        Dictionary containing resumes list and total count
    """
    resumes = RESUMES[:limit] if limit is not None else RESUMES
    return {
        "resumes": resumes,
        "total": len(RESUMES),
        "returned": len(resumes)
    }

@mcp.tool()
def get_resume_by_id_mcp(resume_id: int) -> dict:
    """
    Get a specific resume by ID.
    
    Args:
        resume_id: The ID of the resume to retrieve
        
    Returns:
        Resume data or error message
    """
    resume = find_resume_by_id(resume_id)
    if resume:
        return {"success": True, "resume": resume}
    return {"success": False, "error": f"Resume with ID {resume_id} not found"}

@mcp.tool()
def search_resumes_by_skill(skill: str) -> dict:
    """
    Search resumes by a specific skill (case-insensitive).
    
    Args:
        skill: The skill to search for
        
    Returns:
        Dictionary containing matching resumes and count
    """
    matching_resumes = filter_resumes_by_skill(skill)
    return {
        "skill_searched": skill,
        "resumes": matching_resumes,
        "count": len(matching_resumes)
    }

@mcp.tool()
def search_resumes_by_experience(min_years: int) -> dict:
    """
    Search resumes by minimum years of experience.
    
    Args:
        min_years: Minimum years of experience required
        
    Returns:
        Dictionary containing matching resumes and count
    """
    matching_resumes = filter_resumes_by_experience(min_years)
    return {
        "min_experience_years": min_years,
        "resumes": matching_resumes,
        "count": len(matching_resumes)
    }

@mcp.tool()
def get_resume_stats() -> dict:
    """
    Get statistics about the resume database.
    
    Returns:
        Dictionary containing various statistics
    """
    all_skills = []
    total_experience = 0
    
    for resume in RESUMES:
        all_skills.extend(resume["skills"])
        total_experience += resume["experience_years"]
    
    skill_counts = {}
    for skill in all_skills:
        skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    return {
        "total_resumes": len(RESUMES),
        "average_experience_years": round(total_experience / len(RESUMES), 1),
        "most_common_skills": sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:5],
        "unique_skills": len(set(all_skills))
    }

if __name__ == "__main__":
    import asyncio
    
    print("🚀 Starting Resume Management Servers...")
    print(f"📋 FastAPI REST API: http://localhost:8000")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔧 MCP Server: http://localhost:8001/mcp")
    print(f"💡 Health Check: http://localhost:8000/health")
    print("\n📡 Available REST endpoints:")
    print("  • GET /resumes (with filtering)")
    print("  • GET /resumes/{id}")
    print("  • GET /resumes/search/skills")
    print("  • GET /stats")
    print("  • GET /health")
    print("\n🛠️  Available MCP tools:")
    print("  • get_all_resumes")
    print("  • get_resume_by_id_mcp")
    print("  • search_resumes_by_skill")
    print("  • search_resumes_by_experience")
    print("  • get_resume_stats")
    print("\n💡 For MCP Inspector: Use Streamable HTTP with http://localhost:8001/mcp")
    
    async def run_servers():
        """Run both FastAPI and MCP servers concurrently"""
        # Create MCP app
        mcp_app = mcp.http_app(path="/mcp")
        
        # Create server configurations
        fastapi_config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
        mcp_config = uvicorn.Config(mcp_app, host="0.0.0.0", port=8001, log_level="info")
        
        # Create server instances
        fastapi_server = uvicorn.Server(fastapi_config)
        mcp_server = uvicorn.Server(mcp_config)
        
        # Run both servers concurrently
        await asyncio.gather(
            fastapi_server.serve(),
            mcp_server.serve()
        )
    
    # Run both servers
    try:
        asyncio.run(run_servers())
    except KeyboardInterrupt:
        print("\n👋 Shutting down servers...")