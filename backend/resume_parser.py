# Core Resume Parser for FastAPI
from typing import Dict, Optional
from langgraph.graph import StateGraph, END
from litellm import completion
import PyPDF2
from io import BytesIO
import json
import time

class GraphState(Dict):
    pdf_content: bytes
    extracted_text: str
    parsed_profile: Optional[Dict]
    error: Optional[str]
    validation_passed: bool
    model_name: str

RESUME_PARSER_PROMPT = """You are an automated resume parser. Follow these steps exactly:

1. **Validate**
   - If the text is not a resume, return: {{"error": "Not a valid resume"}}

2. **Extract** the following information into JSON:
   - name: Full name
   - email: Email address  
   - phone: Phone number
   - location: City, State/Country
   - summary: Professional summary (2-3 sentences)
   - experience: Array of job objects
   - education: Array of education objects
   - skills: Array of skill strings
   - certifications: Array of certification objects (optional)
   - languages: Array of language objects (optional)

3. **Output**
   - Return ONLY the JSON object
   - Use null for missing required fields

Resume Text:
{resume_text}
"""

def extract_pdf_text(state: GraphState) -> GraphState:
    """Extract text from PDF content"""
    try:
        pdf_file = BytesIO(state["pdf_content"])
        pdf_reader = PyPDF2.PdfReader(pdf_file)

        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"

        state["extracted_text"] = text.strip()
        print(f"Extracted PDF text (first 200 chars): {text[:200]}")
        return state
    except Exception as e:
        state["error"] = f"PDF extraction failed: {str(e)}"
        return state

def parse_resume_with_llm(state: GraphState) -> GraphState:
    """Parse resume text using LLM"""
    if state.get("error"):
        return state

    try:
        # Try different model names
        model_name = state.get("model_name", "gemini/gemini-1.5-flash")
        
        # Set API key if available
        import os
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            os.environ["GEMINI_API_KEY"] = api_key

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
        print(f"LLM response content: {response_content}")

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

        print(f"Parsed data: {parsed_data}")
        
        # Check for error in parsed data
        if "error" in parsed_data:
            state["error"] = parsed_data["error"]
            print(f"LLM returned error: {parsed_data['error']}")
        else:
            state["parsed_profile"] = parsed_data

        return state
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"LLM parsing error details: {error_detail}")
        state["error"] = f"LLM parsing failed: {str(e)}"
        return state

def validate_profile(state: GraphState) -> GraphState:
    """Validate the parsed profile has minimum required fields"""
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

def should_continue(state: GraphState) -> str:
    """Decide whether to continue or end based on validation"""
    return "success" if state.get("validation_passed") else "error"

def create_resume_parser_dag():
    """Create and compile the resume parser DAG"""
    workflow = StateGraph(GraphState)

    # Add nodes
    workflow.add_node("extract_pdf", extract_pdf_text)
    workflow.add_node("parse_resume", parse_resume_with_llm)
    workflow.add_node("validate", validate_profile)

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

async def parse_resume_pdf(
    pdf_bytes: bytes, 
    model_name: str = "gemini/gemini-1.5-flash"
) -> Dict:
    """
    Main function: Parse resume and return JSON or failure
    """
    # Create the DAG
    app = create_resume_parser_dag()

    # Initialize state
    initial_state = {
        "pdf_content": pdf_bytes,
        "extracted_text": "",
        "parsed_profile": None,
        "error": None,
        "validation_passed": False,
        "model_name": model_name
    }

    # Run the DAG
    final_state = await app.ainvoke(initial_state)

    # Return result
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