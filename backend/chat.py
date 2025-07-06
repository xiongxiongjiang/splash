"""
Simplified chat.py using direct function imports
"""
import os
import logging
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
import json
from pydantic import BaseModel, Field

try:
    from litellm import acompletion
    import litellm
except ImportError:
    raise ImportError("litellm is required. Install with: pip install litellm")

from workflows import (
    ChatRouter,
    ProfileAnalysisWorkflow,
    GapProfileWorkflow,
    JobGapWorkflow,
    ResumeGenerationWorkflow,
    GenerateReachoutWorkflow
)
from config import get_openai_tools, execute_function, get_user_required_functions

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
    model: str = Field(default="gemini/gemini-2.0-flash", description="Model to use")
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

async def _build_user_context(current_user, session) -> Dict[str, Any]:
    """Build context about the user for better routing"""
    if not current_user:
        return {}
    
    context = {"user_id": current_user.id}
    
    # Get user profile and resumes for context
    try:
        import functions
        
        # Get profile
        profile_result = await functions.get_user_profile(session=session, user_id=current_user.id)
        context["has_profile"] = profile_result.get("profile") is not None
        
        # Get resumes
        resumes_result = await functions.get_user_resumes(session=session, user_id=current_user.id)
        context["resume_count"] = resumes_result.get("count", 0)
        
    except Exception:
        # If anything fails, just continue with basic context
        pass
    
    return context

async def _handle_workflow_response(workflow, request: ChatCompletionRequest, session, current_user) -> Dict[str, Any]:
    """Handle response from a workflow"""
    latest_message = request.messages[-1].content
    
    result = await workflow.process_message(
        user_message=latest_message,
        user_id=current_user.id if current_user else 0,
        session=session,
        context={}
    )
    
    import time
    return {
        "id": f"chatcmpl-workflow-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": request.model,
        "choices": [{
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": result["response"],
                "role": "assistant",
                "tool_calls": None,
                "function_call": None
            }
        }],
        "usage": {
            "completion_tokens": len(result["response"].split()),
            "prompt_tokens": sum(len(msg.content.split()) for msg in request.messages),
            "total_tokens": len(result["response"].split()) + sum(len(msg.content.split()) for msg in request.messages)
        },
        "workflow_metadata": {
            "workflow_name": result.get("workflow_name"),
            "workflow_complete": result.get("workflow_complete", False),
            "current_step": result.get("current_step"),
            **result.get("metadata", {})  # Flatten metadata to top level
        }
    }

async def _handle_direct_response(request: ChatCompletionRequest, session, current_user) -> Dict[str, Any]:
    """Handle direct response without workflow"""
    
    # Check if user is asking about tools and provide formatted response
    latest_message = request.messages[-1].content.lower()
    if any(phrase in latest_message for phrase in ["what tools", "available tools", "tools do you have", "list tools", "show tools"]):
        tools_response = """🛠️ **Available Tools & Capabilities**

I have access to several specialized tools organized by category:

## 📊 **Profile Management**
• **Get User Profile** - Access your complete professional profile including experience, skills, and background
• **Get Context** - Retrieve your current context including profile status and recent activity

## 📄 **Resume Management** 
• **Get User Resumes** - Access all your stored resumes and their details
• **Resume Analysis** - Analyze resume content and structure for optimization

## 🎯 **Gap Analysis & Career Development**
• **Identify Profile Gaps** - Analyze your profile for general career improvement opportunities
• **Job-Specific Gap Analysis** - Compare your profile against specific job requirements and identify skill gaps
• **Skill Recommendations** - Get targeted suggestions for skill development

## 📈 **Database & Analytics**
• **Database Statistics** - Access platform-wide statistics and insights

## 🤖 **Workflow Capabilities**
Beyond these individual tools, I can also guide you through comprehensive workflows for:
- **Complete profile analysis** with personalized career insights
- **Step-by-step gap resolution** for targeted skill development  
- **Resume generation** tailored to specific roles
- **Professional outreach messages** for networking and referrals

**How to use:** Simply describe what you need help with, and I'll automatically use the appropriate tools and workflows to assist you!"""

        import time
        return {
            "id": f"chatcmpl-tools-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model,
            "choices": [{
                "finish_reason": "stop", 
                "index": 0,
                "message": {
                    "content": tools_response,
                    "role": "assistant",
                    "tool_calls": None,
                    "function_call": None
                }
            }],
            "usage": {
                "completion_tokens": len(tools_response.split()),
                "prompt_tokens": sum(len(msg.content.split()) for msg in request.messages),
                "total_tokens": len(tools_response.split()) + sum(len(msg.content.split()) for msg in request.messages)
            }
        }
    
    # Continue with normal direct response
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    # Add system message to give context about user access
    if current_user:
        system_message = {
            "role": "system", 
            "content": f"""You are Tally, an AI career assistant. You are currently helping user {current_user.email} (ID: {current_user.id}).

IMPORTANT: You already have access to this user's profile and resume data through your available functions. You DO NOT need to ask for their user ID or permission to access their information - you can directly call functions like get_user_profile() and get_user_resumes() to help them.

When they ask about their profile, experience, or skills, immediately call the appropriate functions to get their actual data and provide helpful insights based on their real information.

Be helpful, direct, and use their actual profile data to give personalized advice."""
        }
        messages.insert(0, system_message)
    
    # Log the request details
    logger.info(f"Chat request - Model: {request.model}, User: {current_user.email if current_user else 'None'}")
    
    # Get tools from simple config - no complex registry!
    tools = get_openai_tools()
    logger.info(f"Available tools for AI: {[tool['function']['name'] for tool in tools]}")
    
    try:
        response = await acompletion(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tools=tools,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        
        if hasattr(message, 'tool_calls') and message.tool_calls:
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
                
                # Execute using simple function execution
                user_id = current_user.id if current_user else None
                function_result = await execute_function(function_name, arguments, session, user_id)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(function_result)
                })
            
            # Get final response
            final_response = await acompletion(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            
            response = final_response
        
        # Convert to dict format
        return {
            "id": response.id,
            "object": response.object,
            "created": response.created,
            "model": response.model,
            "choices": [
                {
                    "finish_reason": choice.finish_reason,
                    "index": choice.index,
                    "message": {
                        "content": choice.message.content or "",
                        "role": choice.message.role,
                        "tool_calls": choice.message.tool_calls,
                        "function_call": choice.message.function_call
                    }
                }
                for choice in response.choices
            ],
            "usage": {
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error in direct response: {str(e)}")
        raise

async def _handle_escape_response(request: ChatCompletionRequest, session, current_user) -> Dict[str, Any]:
    """Handle escape response with helpful feedback"""
    import time
    
    escape_message = (
        "✅ **Workflow cleared!** I've reset our conversation and cleared any ongoing workflows. "
        "What would you like to do next? I can help you with:\n\n"
        "• **Profile analysis** - Analyze your professional background\n"
        "• **Gap analysis** - Compare your profile to job requirements\n" 
        "• **Resume generation** - Create tailored resumes\n"
        "• **General questions** - Ask me anything!\n\n"
        "Just let me know how I can assist you."
    )
    
    return {
        "id": f"chatcmpl-escape-{int(time.time())}",
        "object": "chat.completion", 
        "created": int(time.time()),
        "model": request.model,
        "choices": [{
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": escape_message,
                "role": "assistant",
                "tool_calls": None,
                "function_call": None
            }
        }],
        "usage": {
            "completion_tokens": len(escape_message.split()),
            "prompt_tokens": sum(len(msg.content.split()) for msg in request.messages),
            "total_tokens": len(escape_message.split()) + sum(len(msg.content.split()) for msg in request.messages)
        }
    }

async def create_chat_completion(
    request: ChatCompletionRequest,
    session=None,
    current_user=None
) -> ChatCompletionResponse:
    """Create a chat completion using simple function approach"""
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")
    
    # Get the latest user message
    user_messages = [msg for msg in request.messages if msg.role == "user"]
    if not user_messages:
        return await _handle_direct_response(request, session, current_user)
    
    latest_message = user_messages[-1].content
    
    # Build conversation history for routing
    conversation_history = [
        {"role": msg.role, "content": msg.content} 
        for msg in request.messages[:-1]
    ]
    
    # Build user context
    user_context = await _build_user_context(current_user, session)
    
    # AI-powered routing
    route = await ChatRouter.route_message(
        user_message=latest_message,
        conversation_history=conversation_history,
        user_context=user_context
    )
    
    logger.info(f"Routed to: {route}")
    
    # COMBINED SOLUTION: Check for escape phrases and clear sessions if needed
    user_id = current_user.id if current_user else 0
    
    # Import workflows to check for escape phrases and manage sessions
    from workflows.base_workflow import BaseWorkflow
    from workflows.profile_analysis_workflow import ProfileAnalysisWorkflow
    from workflows.gap_profile_workflow import GapProfileWorkflow
    from workflows.gap_job_workflow import JobGapWorkflow
    from workflows.resume_generation_workflow import ResumeGenerationWorkflow
    from workflows.generate_reachout_workflow import GenerateReachoutWorkflow
    
    # Map routes to workflow names for session management
    ROUTE_TO_WORKFLOW_NAME = {
        "PROFILE_ANALYSIS": "profile_analysis",
        "PROFILE_GAP_ANALYSIS": "gap_analysis_profile",
        "JOB_GAP_ANALYSIS": "gap_analysis_job",
        "RESUME_GENERATION": "resume_generation",
        "GENERATE_REACHOUT": "generate_reachout"
    }
    
    # Check if user wants to escape any existing workflow
    should_escape = any(phrase in latest_message.lower() for phrase in BaseWorkflow.ESCAPE_PHRASES)
    
    if should_escape:
        logger.info(f"User triggered escape phrase, clearing all workflow sessions for user {user_id}")
        # Clear all workflow sessions for this user
        sessions_to_clear = [key for key in BaseWorkflow._global_workflow_sessions.keys() 
                           if key.startswith(f"user_{user_id}_")]
        for session_key in sessions_to_clear:
            del BaseWorkflow._global_workflow_sessions[session_key]
        
        # If user explicitly wanted to escape, give them confirmation and route to direct response
        if sessions_to_clear:
            logger.info(f"Cleared {len(sessions_to_clear)} workflow sessions for user escape")
            # Override route to direct response with a helpful message
            return await _handle_escape_response(request, session, current_user)
    
    # Option 1: Respect router decisions - clear incompatible sessions
    if route != "DIRECT_RESPONSE" and not should_escape:
        routed_workflow_name = ROUTE_TO_WORKFLOW_NAME.get(route)
        if routed_workflow_name:
            # Check for existing sessions from different workflows
            existing_workflow_sessions = [key for key in BaseWorkflow._global_workflow_sessions.keys() 
                                        if key.startswith(f"user_{user_id}_") and not key.endswith(f"_{routed_workflow_name}")]
            
            if existing_workflow_sessions:
                logger.info(f"Router decided on {route}, but found existing sessions: {existing_workflow_sessions}")
                logger.info(f"Clearing incompatible sessions to respect router decision")
                # Clear sessions from different workflows
                for session_key in existing_workflow_sessions:
                    del BaseWorkflow._global_workflow_sessions[session_key]
    
    # Handle based on route
    if route == "DIRECT_RESPONSE":
        # Clear all workflow sessions when going to direct response
        sessions_to_clear = [key for key in BaseWorkflow._global_workflow_sessions.keys() 
                           if key.startswith(f"user_{user_id}_")]
        for session_key in sessions_to_clear:
            del BaseWorkflow._global_workflow_sessions[session_key]
        return await _handle_direct_response(request, session, current_user)
    elif route == "PROFILE_ANALYSIS":
        workflow = ProfileAnalysisWorkflow()
        return await _handle_workflow_response(workflow, request, session, current_user)
    elif route == "PROFILE_GAP_ANALYSIS":
        workflow = GapProfileWorkflow()
        return await _handle_workflow_response(workflow, request, session, current_user)
    elif route == "JOB_GAP_ANALYSIS":
        # For job gap analysis, we need to pass job_posting_id in context
        context = {"job_posting_id": user_context.get("job_posting_id", 1)}  # Default to job ID 1 for demo
        workflow = JobGapWorkflow()
        result = await workflow.process_message(
            user_message=request.messages[-1].content,
            user_id=current_user.id if current_user else 0,
            session=session,
            context=context
        )
        
        import time
        return {
            "id": f"chatcmpl-workflow-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model,
            "choices": [{
                "finish_reason": "stop",
                "index": 0,
                "message": {
                    "content": result["response"],
                    "role": "assistant",
                    "tool_calls": None,
                    "function_call": None
                }
            }],
            "usage": {
                "completion_tokens": len(result["response"].split()),
                "prompt_tokens": sum(len(msg.content.split()) for msg in request.messages),
                "total_tokens": len(result["response"].split()) + sum(len(msg.content.split()) for msg in request.messages)
            },
            "workflow_metadata": {
                "workflow_name": result.get("workflow_name"),
                "workflow_complete": result.get("workflow_complete", False),
                "current_step": result.get("current_step"),
                **result.get("metadata", {})
            }
        }
    elif route == "RESUME_GENERATION":
        workflow = ResumeGenerationWorkflow()
        return await _handle_workflow_response(workflow, request, session, current_user)
    elif route == "GENERATE_REACHOUT":
        workflow = GenerateReachoutWorkflow()
        return await _handle_workflow_response(workflow, request, session, current_user)
    else:
        logger.warning(f"Unknown route {route}, falling back to direct response")
        return await _handle_direct_response(request, session, current_user)

async def create_chat_completion_stream(
    request: ChatCompletionRequest,
    session=None,
    current_user=None
) -> AsyncGenerator[Dict[str, Any], None]:
    """Create a streaming chat completion"""
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")
    
    # For streaming with function calls, we need to fall back to non-streaming 
    # because Gemini 2.0 Flash doesn't properly support function calling in streaming mode
    logger.info("Streaming with function calls - falling back to non-streaming for proper function execution")
    
    # Convert to non-streaming and simulate streaming response
    try:
        response = await create_chat_completion(request, session, current_user)
        
        # Simulate streaming by breaking the response into chunks
        content = response["choices"][0]["message"]["content"] or ""
        
        # Send chunks word by word for streaming effect
        words = content.split()
        chunk_size = 3  # Send 3 words at a time
        
        import time
        for i in range(0, len(words), chunk_size):
            chunk_words = words[i:i+chunk_size]
            chunk_content = " ".join(chunk_words)
            
            # Add space if not the last chunk
            if i + chunk_size < len(words):
                chunk_content += " "
            
            yield {
                "id": response["id"],
                "object": "chat.completion.chunk",
                "created": response["created"],
                "model": response["model"],
                "choices": [{
                    "index": 0,
                    "delta": {
                        "content": chunk_content,
                        "role": "assistant" if i == 0 else None
                    },
                    "finish_reason": None
                }]
            }
            
            # Small delay for streaming effect
            await asyncio.sleep(0.05)
        
        # Final chunk with finish_reason
        yield {
            "id": response["id"],
            "object": "chat.completion.chunk", 
            "created": response["created"],
            "model": response["model"],
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "stop"
            }]
        }
        
    except Exception as e:
        logger.error(f"Error in streaming chat completion: {str(e)}")
        yield {
            "error": f"Streaming completion failed: {str(e)}"
        }