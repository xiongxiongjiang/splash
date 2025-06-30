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

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Dify API Configuration
DIFY_API_BASE_URL = "https://api.dify.ai/v1"
DIFY_RESUME_PARSE_API_KEY = os.getenv("DIFY_RESUME_PARSE_API_KEY", "")

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "")

# Application Settings
APP_TITLE = "Resume Management API"
APP_DESCRIPTION = "REST API for managing and searching resumes with Supabase and authentication"
APP_VERSION = "2.0.0"

# Pagination defaults
DEFAULT_PAGE_SIZE = 25
PAGE_SIZE_OPTIONS = [25, 50, 100]