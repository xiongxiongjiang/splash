"""
Job Gap Analysis Workflow  
Analyzes user's skill gaps against a specific job posting
"""
import logging
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from .base_workflow import BaseWorkflow, BaseWorkflowState

logger = logging.getLogger(__name__)


class JobGapState(BaseWorkflowState):
    """State for job-specific gap analysis workflow"""
    job_posting_id: Optional[int]
    job_title: str
    company: str
    identified_gaps: List[Dict[str, Any]]
    current_gap_index: int  # 0-based index of gap currently being shown  
    total_gaps: int


class JobGapWorkflow(BaseWorkflow):
    """Workflow for analyzing gaps against a specific job posting"""
    
    def get_workflow_name(self) -> str:
        return "gap_analysis_job"
    
    def get_system_prompt(self) -> str:
        return """You are a career coach analyzing how well a candidate matches a job.
        Identify gaps between their profile and job requirements, and suggest improvements."""
    
    def _build_graph(self):
        """Build the job gap analysis workflow graph"""
        workflow = StateGraph(JobGapState)
        
        # Add nodes
        workflow.add_node("analyze_job_requirements", self._analyze_job_requirements)
        workflow.add_node("resolve_gaps", self._resolve_gaps)
        workflow.add_node("complete_analysis", self._complete_analysis)
        
        # Set entry point
        workflow.set_entry_point("analyze_job_requirements")
        
        # Add edges with conditional progression
        workflow.add_edge("analyze_job_requirements", "resolve_gaps")
        
        # Conditional edge: continue resolving gaps or complete
        workflow.add_conditional_edges(
            "resolve_gaps",
            self._should_continue_resolving,
            {
                "continue": END,  # Stay in resolve_gaps state, wait for user
                "complete": "complete_analysis"  # All gaps resolved
            }
        )
        
        workflow.add_edge("complete_analysis", END)
        
        self.graph = workflow.compile()
    
    def _create_initial_state(self, user_message: str, user_id: int, session=None, context: Dict = None) -> Dict[str, Any]:
        """Create initial state with job gap analysis specific fields"""
        state = super()._create_initial_state(user_message, user_id, session, context)
        state.update({
            "job_posting_id": context.get("job_posting_id") if context else None,
            "job_title": "",
            "company": "",
            "identified_gaps": [],
            "current_gap_index": 0,
            "total_gaps": 0
        })
        return state
    
    async def process_message(self, user_message: str, user_id: int, session=None, context: Dict = None):
        """Override to control workflow entry point based on session state"""
        session_key = f"user_{user_id}_{self.get_workflow_name()}"
        
        # Check for escape phrases FIRST
        if self._should_break_session(user_message):
            logger.info(f"User {user_id} triggered escape phrase in gap_job_workflow")
            # Clear this workflow's session
            if session_key in self._global_workflow_sessions:
                del self._global_workflow_sessions[session_key]
            # Return escape message
            return {
                "response": "✅ **Job gap analysis stopped!** I've cleared the workflow. What would you like to do next?",
                "workflow_name": self.get_workflow_name(),
                "workflow_complete": True,
                "metadata": {"action": "workflow_escaped"}
            }
        
        # Check for existing workflow state
        existing_state = self._global_workflow_sessions.get(session_key)
        
        if existing_state and not existing_state.get("workflow_complete"):
            # Continue existing workflow - add user message
            existing_state["messages"].append({"role": "user", "content": user_message})
            
            # Determine which node to run based on progress
            if existing_state["current_gap_index"] >= existing_state["total_gaps"]:
                # All gaps addressed - run completion
                start_node = "complete_analysis"
            else:
                # More gaps to show - run gap handler
                start_node = "resolve_gaps"
                
            # Create graph with appropriate entry point
            self.graph = self._create_graph_with_entry_point(start_node)
            state = existing_state
        else:
            # Start new workflow - clear old session if it exists
            if existing_state:
                logger.info(f"Clearing completed workflow session for user {user_id}")
                del self._global_workflow_sessions[session_key]
                
            state = self._create_initial_state(user_message, user_id, session, context)
            # Use analyze_job_requirements as entry point for new workflows
            self.graph = self._create_graph_with_entry_point("analyze_job_requirements")
            
        # Store state and run workflow
        self._global_workflow_sessions[session_key] = state
        
        try:
            result = await self.graph.ainvoke(state)
            self._global_workflow_sessions[session_key] = result
            return self._format_result(result)
        except Exception as e:
            logger.error(f"Workflow {self.get_workflow_name()} failed: {e}")
            return self._create_error_response(str(e))
            
    def _create_graph_with_entry_point(self, entry_node: str):
        """Create a graph with specified entry point"""
        workflow = StateGraph(JobGapState)
        
        # Add all nodes
        workflow.add_node("analyze_job_requirements", self._analyze_job_requirements)
        workflow.add_node("resolve_gaps", self._resolve_gaps)
        workflow.add_node("complete_analysis", self._complete_analysis)
        
        # Set dynamic entry point
        workflow.set_entry_point(entry_node)
        
        # Each node ends immediately to pause for user input
        workflow.add_edge("analyze_job_requirements", END)
        workflow.add_edge("resolve_gaps", END)  
        workflow.add_edge("complete_analysis", END)
        
        return workflow.compile()
    
    async def _analyze_job_requirements(self, state: JobGapState) -> JobGapState:
        """Analyze job requirements and identify gaps"""
        logger.info(f"Analyzing job gaps for user {state['user_id']}, job {state['job_posting_id']}")
        
        # Fake job data for demo
        job_data = {
            "title": "Senior Full Stack Engineer",
            "company": "TechCorp Inc",
            "requirements": [
                "React Native development",
                "Backend API design", 
                "Cloud infrastructure (AWS)",
                "Team leadership",
                "Agile methodology"
            ]
        }
        
        state["job_title"] = job_data["title"]
        state["company"] = job_data["company"]
        
        # Hardcoded job-specific gaps for demo
        state["identified_gaps"] = [
            {
                "requirement": "React Native Development",
                "job_importance": "critical",
                "user_level": "No experience",
                "required_level": "3+ years", 
                "gap_severity": "high",
                "suggestions": ["Complete React Native bootcamp", "Build 2-3 mobile apps", "Contribute to RN open source"]
            },
            {
                "requirement": "AWS Cloud Infrastructure", 
                "job_importance": "important",
                "user_level": "Basic",
                "required_level": "Intermediate",
                "gap_severity": "medium",
                "suggestions": ["Get AWS Solutions Architect certification", "Deploy production apps on AWS"]
            },
            {
                "requirement": "Team Leadership",
                "job_importance": "preferred", 
                "user_level": "Individual contributor",
                "required_level": "Led 3+ person teams",
                "gap_severity": "low",
                "suggestions": ["Lead a cross-functional project", "Mentor junior developers"]
            }
        ]
        
        state["total_gaps"] = len(state["identified_gaps"])
        
        # Show job-specific gap analysis
        gaps_summary = "\n".join([
            f"• **{gap['requirement']}**: {gap['user_level']} → {gap['required_level']} ({gap['gap_severity']} priority)"
            for gap in state["identified_gaps"]
        ])
        
        response = f"""🎯 **Job Gap Analysis: {state['job_title']}**
**Company:** {state['company']}

I've analyzed your profile against this job and found **{state['total_gaps']} gaps** to address:

{gaps_summary}

Let's tackle the most critical gap first:

**{state['identified_gaps'][0]['requirement']}** ({state['identified_gaps'][0]['gap_severity']} priority)
- Your level: {state['identified_gaps'][0]['user_level']}
- Job needs: {state['identified_gaps'][0]['required_level']}
- Action plan: {', '.join(state['identified_gaps'][0]['suggestions'])}

*How do you plan to bridge this gap? What timeline works for you?*"""

        state["messages"].append({
            "role": "assistant",
            "content": response,
            "metadata": {
                "action": "gap_resolution_prompt",
                "job_title": state["job_title"],
                "total_gaps": state["total_gaps"],
                "gap_number": 1
            }
        })
        
        state["current_gap_index"] = 0  # User needs to respond to gap 1
        
        return state
    
    async def _resolve_gaps(self, state: JobGapState) -> JobGapState:
        """Handle job gap resolution process - shows next gap to resolve"""
        
        # current_gap_index is the 0-based index of the gap the user just responded to
        just_completed_gap_index = state["current_gap_index"]  
        just_completed_gap_number = just_completed_gap_index + 1  # Convert to 1-based for display
        next_gap_to_show_number = just_completed_gap_number + 1
        
        if next_gap_to_show_number <= state["total_gaps"]:
            # Show next gap with acknowledgment of previous
            next_gap_index = next_gap_to_show_number - 1  # Convert to 0-based index
            gap = state["identified_gaps"][next_gap_index]
            
            response = f"""✅ **Gap {just_completed_gap_number}/{state['total_gaps']} - Plan Set!**

Great strategy! Next requirement to address:

**Gap {next_gap_to_show_number}/{state['total_gaps']}: {gap['requirement']}** ({gap['gap_severity']} priority)
- Your level: {gap['user_level']}
- Job needs: {gap['required_level']}
- Suggested path: {', '.join(gap['suggestions'])}

*What's your approach for this requirement?*"""

            state["messages"].append({
                "role": "assistant",
                "content": response,
                "metadata": {
                    "action": "gap_resolution_prompt",
                    "gap_number": next_gap_to_show_number,
                    "total_gaps": state["total_gaps"]
                }
            })
            
            # User now needs to respond to next gap
            state["current_gap_index"] = next_gap_index
            state["workflow_complete"] = False
        else:
            # User just completed final gap - acknowledge and trigger completion
            response = f"""✅ **Gap {just_completed_gap_number}/{state['total_gaps']} - Plan Set!**

Excellent work! You've addressed all job requirements."""
            
            state["messages"].append({
                "role": "assistant", 
                "content": response,
                "metadata": {
                    "action": "final_gap_acknowledgment",
                    "gap_number": just_completed_gap_number,
                    "total_gaps": state["total_gaps"]
                }
            })
            
            # Trigger completion flow - will call complete_analysis next
            state["current_gap_index"] = state["total_gaps"]  # Mark as completed
            state["workflow_complete"] = False
        
        return state
    
    def _should_continue_resolving(self, state: JobGapState) -> str:
        """Determine if we should continue resolving gaps or complete"""
        # If all gaps have been shown and user responded to the last one
        if state["current_gap_index"] >= state["total_gaps"]:
            return "complete"
        else:
            return "continue"  # Stay in resolve_gaps, wait for user input
    
    async def _complete_analysis(self, state: JobGapState) -> JobGapState:
        """Complete the job gap analysis"""
        response = f"""🎉 **Job Gap Analysis Complete!**

**Position:** {state['job_title']} at {state['company']}

You've created action plans for all **{state['total_gaps']} identified gaps**:

"""
        
        for i, gap in enumerate(state["identified_gaps"], 1):
            response += f"✅ **{i}. {gap['requirement']}** ({gap['gap_severity']} priority) - Plan ready\n"
        
        response += f"""
**Application Readiness Assessment:**
- Critical gaps: {len([g for g in state['identified_gaps'] if g['gap_severity'] == 'high'])} addressed
- Timeline needed: 2-6 months depending on gap severity
- Recommendation: Start working on critical gaps immediately

**Next Steps:**
1. Prioritize high-severity gaps first
2. Set specific milestones and deadlines
3. Consider applying once critical gaps are addressed
4. Update your resume as you gain these skills

*You now have a clear roadmap to become competitive for this role!*"""
        
        state["messages"].append({
            "role": "assistant",
            "content": response,
            "metadata": {
                "action": "analysis_complete",
                "workflow_complete": True,
                "job_title": state["job_title"],
                "gaps_addressed": state["total_gaps"],
                "total_gaps": state["total_gaps"],
                "gap_number": state["total_gaps"]
            }
        })
        
        # Add follow-up prompt for next steps
        followup_response = """🚀 **What would you like to do next?**

Here are some options to continue your job application preparation:

1. **📄 Generate a tailored resume** - Create a resume optimized for this specific role
2. **📊 Analyze general profile gaps** - Work on overall career development  
3. **✉️ Create outreach messages** - Generate personalized networking messages for this company
4. **💬 General career advice** - Ask me anything about your career path

*Just let me know what interests you most!*"""

        state["messages"].append({
            "role": "assistant",
            "content": followup_response,
            "metadata": {
                "action": "next_steps_prompt",
                "workflow_complete": True
            }
        })
        
        state["workflow_complete"] = True
        state["current_step"] = "complete"
        
        return state