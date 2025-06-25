"""
Chat completion module using liteLLM library
Integrates with Gemini API and provides function calling capabilities
"""
import os
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
import json
from pydantic import BaseModel, Field

# Import liteLLM for AI model integration
try:
    from litellm import acompletion
    import litellm
except ImportError:
    raise ImportError("litellm is required. Install with: pip install litellm")

from database import get_all_resumes, get_resume_by_id, get_database_stats
from models import ResumeRead

logger = logging.getLogger(__name__)

# Configure liteLLM
litellm.drop_params = True
litellm.set_verbose = False

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")

# Pydantic models for chat API
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: user, assistant, or system")
    content: str = Field(..., description="Message content")

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    model: str = Field(default="gemini/gemini-1.5-flash", description="Model to use")
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2, description="Sampling temperature")
    max_tokens: Optional[int] = Field(default=1000, ge=1, description="Maximum tokens to generate")
    stream: Optional[bool] = Field(default=False, description="Whether to stream the response")

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int]

# Function definitions that the AI can call
AVAILABLE_FUNCTIONS = {
    "search_resumes": {
        "name": "search_resumes",
        "description": "Search for resumes in the database with optional filters",
        "parameters": {
            "type": "object",
            "properties": {
                "skill": {
                    "type": "string",
                    "description": "Filter by specific skill (e.g., Python, JavaScript)"
                },
                "min_experience": {
                    "type": "integer",
                    "description": "Minimum years of experience required"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of resumes to return"
                }
            },
            "required": []
        }
    },
    "get_resume_details": {
        "name": "get_resume_details",
        "description": "Get detailed information about a specific resume by ID",
        "parameters": {
            "type": "object",
            "properties": {
                "resume_id": {
                    "type": "integer",
                    "description": "The ID of the resume to retrieve"
                }
            },
            "required": ["resume_id"]
        }
    },
    "get_database_stats": {
        "name": "get_database_stats",
        "description": "Get statistics about the resume database",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
}

async def execute_function(function_name: str, arguments: Dict[str, Any], session) -> Dict[str, Any]:
    """Execute a function call and return the result"""
    try:
        if function_name == "search_resumes":
            skill = arguments.get("skill")
            min_experience = arguments.get("min_experience")
            limit = arguments.get("limit")
            
            resumes = await get_all_resumes(session, limit=limit, skill=skill, min_experience=min_experience)
            resume_data = [ResumeRead.model_validate(resume).model_dump(mode='json') for resume in resumes]
            
            return {
                "success": True,
                "resumes": resume_data,
                "count": len(resume_data),
                "filters": {
                    "skill": skill,
                    "min_experience": min_experience,
                    "limit": limit
                }
            }
            
        elif function_name == "get_resume_details":
            resume_id = arguments.get("resume_id")
            if not resume_id:
                return {"success": False, "error": "resume_id is required"}
                
            resume = await get_resume_by_id(session, resume_id)
            if not resume:
                return {"success": False, "error": f"Resume with ID {resume_id} not found"}
                
            return {
                "success": True,
                "resume": ResumeRead.model_validate(resume).model_dump(mode='json')
            }
            
        elif function_name == "get_database_stats":
            stats = await get_database_stats(session)
            return {
                "success": True,
                "stats": stats
            }
            
        else:
            return {"success": False, "error": f"Unknown function: {function_name}"}
            
    except Exception as e:
        logger.error(f"Error executing function {function_name}: {str(e)}")
        return {"success": False, "error": f"Function execution failed: {str(e)}"}

async def create_chat_completion(
    request: ChatCompletionRequest,
    session=None
) -> ChatCompletionResponse:
    """Create a chat completion using liteLLM with function calling support"""
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")
    
    # Convert messages to liteLLM format
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    # Prepare function tools
    tools = []
    for func_name, func_def in AVAILABLE_FUNCTIONS.items():
        tools.append({
            "type": "function",
            "function": func_def
        })
    
    try:
        # Make the completion request with function calling
        response = await acompletion(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tools=tools,
            tool_choice="auto"
        )
        
        # Check if the model wants to call a function
        message = response.choices[0].message
        
        if hasattr(message, 'tool_calls') and message.tool_calls:
            # Execute function calls
            messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": message.tool_calls
            })
            
            for tool_call in message.tool_calls:
                function_name = tool_call.function.name
                try:
                    arguments = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    arguments = {}
                
                # Execute the function
                if session:
                    function_result = await execute_function(function_name, arguments, session)
                else:
                    function_result = {"success": False, "error": "Database session not available"}
                
                # Add function result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(function_result)
                })
            
            # Get the final response after function execution
            final_response = await acompletion(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            
            return final_response
        
        return response
        
    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}")
        raise

async def create_chat_completion_stream(
    request: ChatCompletionRequest,
    session=None
) -> AsyncGenerator[Dict[str, Any], None]:
    """Create a streaming chat completion"""
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")
    
    # Convert messages to liteLLM format
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    # Prepare function tools
    tools = []
    for func_name, func_def in AVAILABLE_FUNCTIONS.items():
        tools.append({
            "type": "function",
            "function": func_def
        })
    
    try:
        # Make the streaming completion request
        response = await acompletion(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tools=tools,
            tool_choice="auto",
            stream=True
        )
        
        async for chunk in response:
            yield {
                "id": chunk.id,
                "object": "chat.completion.chunk",
                "created": chunk.created,
                "model": chunk.model,
                "choices": [choice.model_dump() for choice in chunk.choices]
            }
            
    except Exception as e:
        logger.error(f"Error in streaming chat completion: {str(e)}")
        yield {
            "error": f"Streaming completion failed: {str(e)}"
        }