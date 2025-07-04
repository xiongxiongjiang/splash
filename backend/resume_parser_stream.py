# Streaming Resume Parser with progress updates
from typing import Dict, Optional, AsyncGenerator
from langgraph.graph import StateGraph, END
from litellm import completion
import PyPDF2
from io import BytesIO
import json
import asyncio
from datetime import datetime

class StreamingGraphState(Dict):
    pdf_content: bytes
    extracted_text: str
    parsed_profile: Optional[Dict]
    error: Optional[str]
    validation_passed: bool
    model_name: str
    progress_callback: Optional[callable]

async def emit_progress(state: StreamingGraphState, step: str, progress: int, message: str):
    """Emit progress update if callback is available"""
    if state.get("progress_callback"):
        await state["progress_callback"]({
            "step": step,
            "progress": progress,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        })


async def extract_pdf_text_stream(state: StreamingGraphState) -> StreamingGraphState:
    """Extract text from PDF content"""
    try:
        pdf_file = BytesIO(state["pdf_content"])
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"

        state["extracted_text"] = text.strip()
        return state
    except Exception as e:
        state["error"] = f"PDF extraction failed: {str(e)}"
        return state

async def parse_resume_with_llm_stream(state: StreamingGraphState) -> StreamingGraphState:
    """Parse resume text using LLM"""
    if state.get("error"):
        return state

    try:
        model_name = state.get("model_name", "gemini/gemini-1.5-flash")
        
        # Set API key if available
        import os
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            os.environ["GEMINI_API_KEY"] = api_key
        
        from resume_parser import RESUME_PARSER_PROMPT
        
        response = completion(
            model=model_name,
            messages=[{
                "role": "user",
                "content": RESUME_PARSER_PROMPT.format(resume_text=state["extracted_text"])
            }],
            temperature=0.1,
            api_key=api_key if api_key else None
        )
        
        response_content = response.choices[0].message.content

        # Handle JSON extraction from markdown
        try:
            parsed_data = json.loads(response_content)
        except json.JSONDecodeError:
            if "```json" in response_content:
                json_start = response_content.find("```json") + 7
                json_end = response_content.find("```", json_start)
                if json_end != -1:
                    response_content = response_content[json_start:json_end].strip()
                    parsed_data = json.loads(response_content)
                else:
                    raise
            else:
                raise
        
        # Check for error in parsed data
        if "error" in parsed_data:
            state["error"] = parsed_data["error"]
        else:
            state["parsed_profile"] = parsed_data

        return state
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        state["error"] = f"LLM parsing failed: {str(e)}"
        return state

async def validate_profile_stream(state: StreamingGraphState) -> StreamingGraphState:
    """Validate the parsed profile"""
    if state.get("error"):
        state["validation_passed"] = False
        return state
    
    profile = state.get("parsed_profile")
    if not profile or not profile.get("name"):
        state["error"] = "Missing required field: name"
        state["validation_passed"] = False
    else:
        state["validation_passed"] = True

    return state

def should_continue(state: StreamingGraphState) -> str:
    """Decide whether to continue or end based on validation"""
    return "success" if state.get("validation_passed") else "error"

def create_streaming_resume_parser_dag():
    """Create and compile the streaming resume parser DAG"""
    workflow = StateGraph(StreamingGraphState)

    # Add nodes
    workflow.add_node("extract_pdf", extract_pdf_text_stream)
    workflow.add_node("parse_resume", parse_resume_with_llm_stream)
    workflow.add_node("validate", validate_profile_stream)

    # Add edges
    workflow.set_entry_point("extract_pdf")
    workflow.add_edge("extract_pdf", "parse_resume")
    workflow.add_edge("parse_resume", "validate")

    # Add conditional edge
    workflow.add_conditional_edges(
        "validate",
        should_continue,
        {"success": END, "error": END}
    )

    return workflow.compile()

async def parse_resume_pdf_stream(
    pdf_bytes: bytes,
    progress_callback: callable,
    model_name: str = "gemini/gemini-1.5-flash"
) -> AsyncGenerator[Dict, None]:
    """
    Parse resume with streaming progress updates
    Yields progress events and final result
    """
    # Create the DAG
    app = create_streaming_resume_parser_dag()

    # Initialize state
    initial_state = {
        "pdf_content": pdf_bytes,
        "extracted_text": "",
        "parsed_profile": None,
        "error": None,
        "validation_passed": False,
        "model_name": model_name,
        "progress_callback": progress_callback
    }

    # Run the DAG
    final_state = await app.ainvoke(initial_state)

    # Return final result
    if final_state.get("validation_passed"):
        return {
            "success": True,
            "profile": final_state["parsed_profile"]
        }
    else:
        return {
            "success": False,
            "error": final_state.get("error", "Unknown error")
        }