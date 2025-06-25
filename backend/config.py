"""
Configuration settings for the FastAPI application
"""
import os
from typing import List

# MCP Configuration
MCP_MOUNT_PATH = "/mcp"
MCP_OPERATIONS = [
    "search_all_resumes",
    "get_resume_details", 
    "find_resumes_by_skill",
    "get_database_statistics",
    "check_server_health",
    "get_server_info"
]

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://splash:splash@localhost:5432/splash")

# Admin Configuration
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# Application Settings
APP_TITLE = "Resume Management API"
APP_DESCRIPTION = "REST API for managing and searching resumes with SQLModel and authentication"
APP_VERSION = "2.0.0"

# Pagination defaults
DEFAULT_PAGE_SIZE = 25
PAGE_SIZE_OPTIONS = [25, 50, 100]