"""
Resume Generation Workflow
Handles resume creation and optimization
"""
import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from .base_workflow import BaseWorkflow, BaseWorkflowState

logger = logging.getLogger(__name__)


class ResumeGenerationState(BaseWorkflowState):
    """State for resume generation workflow"""
    target_role: str
    resume_sections: Dict[str, Any]


class ResumeGenerationWorkflow(BaseWorkflow):
    """Workflow for generating tailored resumes"""
    
    def get_workflow_name(self) -> str:
        return "resume_generation"
    
    def get_system_prompt(self) -> str:
        return """You are a professional resume writer creating tailored resumes.
        Focus on highlighting relevant experience and achievements."""
    
    def _build_graph(self):
        """Build the resume generation workflow graph"""
        workflow = StateGraph(ResumeGenerationState)
        
        # Add nodes
        workflow.add_node("gather_info", self._gather_info)
        workflow.add_node("generate_resume", self._generate_resume)
        
        # Set entry point
        workflow.set_entry_point("gather_info")
        
        # Add edges
        workflow.add_edge("gather_info", "generate_resume")
        workflow.add_edge("generate_resume", END)
        
        self.graph = workflow.compile()
    
    async def _gather_info(self, state: ResumeGenerationState) -> ResumeGenerationState:
        """Gather information needed for resume"""
        logger.info(f"Gathering info for resume generation - user {state['user_id']}")
        
        # FAKE LOGIC: Simulate gathering user info
        state["target_role"] = "Software Engineer"
        state["resume_sections"] = {
            "summary": "Experienced software engineer with 5 years in full-stack development",
            "skills": ["Python", "JavaScript", "React", "Node.js", "PostgreSQL"],
            "experience": [
                {
                    "title": "Senior Developer",
                    "company": "Tech Corp",
                    "duration": "2021-Present",
                    "achievements": ["Led team of 5", "Improved performance by 40%"]
                }
            ]
        }
        
        state["current_step"] = "info_gathered"
        return state
    
    async def _generate_resume(self, state: ResumeGenerationState) -> ResumeGenerationState:
        """Generate the resume content"""
        sections = state["resume_sections"]
        
        response = f"""I've created a tailored resume for the {state['target_role']} position:

**PROFESSIONAL SUMMARY**
{sections['summary']}

**TECHNICAL SKILLS**
{', '.join(sections['skills'])}

**EXPERIENCE**
{sections['experience'][0]['title']} | {sections['experience'][0]['company']}
{sections['experience'][0]['duration']}
• {chr(10).join('• ' + ach for ach in sections['experience'][0]['achievements'])}

**Next Steps:**
1. Review and customize the content
2. Add specific metrics and achievements
3. Tailor keywords to match job descriptions
4. Format for ATS compatibility"""
        
        state["messages"].append({
            "role": "assistant",
            "content": response,
            "metadata": {
                "resume_data": sections,
                "target_role": state["target_role"]
            }
        })
        
        state["workflow_complete"] = True
        state["current_step"] = "complete"
        
        return state