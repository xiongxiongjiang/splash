"""
Simple configuration using direct function imports
"""
import os
from typing import List, Dict, Any, Callable
import inspect
import functions  # Import the functions module


# MCP Configuration
MCP_MOUNT_PATH = "/mcp"

# Simple function mapping - just import and list!
EXPOSED_FUNCTIONS = [
    functions.get_database_statistics,
    functions.get_user_profile,
    functions.get_user_resumes,
    functions.identify_profile_gaps,
    functions.identify_gaps_per_job,
    functions.get_context,
]

# Auto-generate function names for MCP
MCP_OPERATIONS = [func.__name__ for func in EXPOSED_FUNCTIONS]

# Auto-generate OpenAI tool definitions
def get_openai_tools() -> List[Dict[str, Any]]:
    """Generate OpenAI tool definitions from function signatures and docstrings"""
    tools = []
    
    for func in EXPOSED_FUNCTIONS:
        # Get function signature
        sig = inspect.signature(func)
        
        # Build parameters from function signature
        parameters = {
            "type": "object",
            "properties": {},
            "required": []
        }
        
        for param_name, param in sig.parameters.items():
            if param_name in ['session', 'kwargs']:  # Skip internal params
                continue
                
            param_info = {"type": "string"}  # Default type
            
            # Try to infer type from annotation
            if param.annotation != inspect.Parameter.empty:
                if param.annotation == int:
                    param_info["type"] = "integer"
                elif param.annotation == bool:
                    param_info["type"] = "boolean"
            
            parameters["properties"][param_name] = param_info
            
            # Mark as required if no default value
            if param.default == inspect.Parameter.empty and param_name != 'user_id':
                parameters["required"].append(param_name)
        
        tools.append({
            "type": "function",
            "function": {
                "name": func.__name__,
                "description": func.__doc__ or f"Execute {func.__name__}",
                "parameters": parameters
            }
        })
    
    return tools

# Function execution helper
async def execute_function(function_name: str, arguments: Dict[str, Any], session, user_id=None) -> Dict[str, Any]:
    """Execute a function by name"""
    # Find the function
    func = None
    for f in EXPOSED_FUNCTIONS:
        if f.__name__ == function_name:
            func = f
            break
    
    if not func:
        return {"success": False, "error": f"Unknown function: {function_name}"}
    
    try:
        # Call the function with session, user_id, and arguments
        result = await func(session=session, user_id=user_id, **arguments)
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "error": f"Function execution failed: {str(e)}"}

# Function info helper
def get_user_required_functions() -> List[str]:
    """Get list of functions that require user_id"""
    user_functions = []
    for func in EXPOSED_FUNCTIONS:
        sig = inspect.signature(func)
        if 'user_id' in sig.parameters:
            user_functions.append(func.__name__)
    return user_functions

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