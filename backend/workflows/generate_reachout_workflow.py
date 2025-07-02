"""
Generate Reachout Workflow
Handles personalized outreach message generation
"""
import logging
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from .base_workflow import BaseWorkflow, BaseWorkflowState

logger = logging.getLogger(__name__)


class GenerateReachoutState(BaseWorkflowState):
    """State for reachout generation workflow"""
    referrer_info: Optional[str]
    job_info: Optional[str]
    reachout_type: str  # "referral", "networking", "informational"
    generated_message: str


class GenerateReachoutWorkflow(BaseWorkflow):
    """Workflow for generating personalized outreach messages"""
    
    def get_workflow_name(self) -> str:
        return "generate_reachout"
    
    def get_system_prompt(self) -> str:
        return """You are an expert at crafting personalized, professional outreach messages.
        Create compelling messages that are respectful, concise, and action-oriented."""
    
    def _build_graph(self):
        """Build the reachout generation workflow graph"""
        workflow = StateGraph(GenerateReachoutState)
        
        # Add nodes
        workflow.add_node("analyze_context", self._analyze_context)
        workflow.add_node("generate_message", self._generate_message)
        
        # Set entry point
        workflow.set_entry_point("analyze_context")
        
        # Add edges
        workflow.add_edge("analyze_context", "generate_message")
        workflow.add_edge("generate_message", END)
        
        self.graph = workflow.compile()
    
    async def _analyze_context(self, state: GenerateReachoutState) -> GenerateReachoutState:
        """Analyze the context for the reachout"""
        logger.info(f"Analyzing reachout context for user {state['user_id']}")
        
        # FAKE LOGIC: Determine reachout type and gather info
        user_message = state["messages"][0]["content"].lower()
        
        if "referral" in user_message:
            state["reachout_type"] = "referral"
            state["referrer_info"] = "Senior Engineer at Target Company"
            state["job_info"] = "Software Engineer position"
        else:
            state["reachout_type"] = "networking"
            state["referrer_info"] = "Industry professional"
        
        state["current_step"] = "context_analyzed"
        return state
    
    async def _generate_message(self, state: GenerateReachoutState) -> GenerateReachoutState:
        """Generate the personalized reachout message"""
        
        if state["reachout_type"] == "referral":
            message = f"""Subject: Referral Request - {state.get('job_info', 'Position at Your Company')}

Hi [Name],

I hope this message finds you well. I noticed you're a {state['referrer_info']}, and I'm very interested in the {state['job_info']} role at your company.

With my 5 years of experience in full-stack development and expertise in Python and React, I believe I would be a strong fit for the team. I've led successful projects that improved system performance by 40% and managed cross-functional teams.

Would you be open to a brief 15-minute call to discuss the role and potentially provide a referral? I'd love to learn more about your experience at the company and the team culture.

I've attached my resume for your reference. Thank you for considering my request!

Best regards,
[Your name]"""
        else:
            message = """Subject: Connecting with a Fellow Tech Professional

Hi [Name],

I came across your profile and was impressed by your journey in software engineering. As someone with 5 years in the field, I'm always eager to connect with experienced professionals.

I'd love to learn more about your career path and any insights you might share about [specific topic/company]. Would you be open to a brief virtual coffee chat?

Looking forward to connecting!

Best regards,
[Your name]"""
        
        state["generated_message"] = message
        
        response = f"""I've generated a personalized reachout message for you:

---

{message}

---

**Tips for sending:**
1. Personalize the [Name] and any [bracketed] sections
2. Keep the message concise and respectful
3. Send during business hours (Tue-Thu, 9-11 AM works best)
4. Follow up once after a week if no response
5. Always attach your resume for referral requests"""
        
        state["messages"].append({
            "role": "assistant",
            "content": response,
            "metadata": {
                "reachout_type": state["reachout_type"],
                "message": message
            }
        })
        
        state["workflow_complete"] = True
        state["current_step"] = "complete"
        
        return state