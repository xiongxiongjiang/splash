"""
Profile Gap Analysis Workflow
Analyzes user's general skill gaps and career development areas
"""
import logging
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from .base_workflow import BaseWorkflow, BaseWorkflowState

logger = logging.getLogger(__name__)


class GapProfileState(BaseWorkflowState):
    """State for profile gap analysis workflow"""
    identified_gaps: List[Dict[str, Any]]
    current_gap_index: int  # 0-based index of gap currently being shown
    total_gaps: int


class GapProfileWorkflow(BaseWorkflow):
    """Workflow for analyzing general profile skill gaps"""
    
    def get_workflow_name(self) -> str:
        return "gap_analysis_profile"
    
    def get_system_prompt(self) -> str:
        return """You are a career coach helping identify skill gaps and growth areas.
        Be constructive and provide actionable advice for improvement."""
    
    def _build_graph(self):
        """Build the profile gap analysis workflow graph"""
        # Default graph - will be overridden with dynamic entry points
        workflow = StateGraph(GapProfileState)
        
        workflow.add_node("identify_gaps", self._identify_gaps)
        workflow.add_node("show_next_gap", self._show_next_gap)
        workflow.add_node("complete_analysis", self._complete_analysis)
        
        workflow.set_entry_point("identify_gaps")
        
        workflow.add_edge("identify_gaps", END)
        workflow.add_edge("show_next_gap", END)  
        workflow.add_edge("complete_analysis", END)
        
        self.graph = workflow.compile()
    
    def _create_initial_state(self, user_message: str, user_id: int, session=None, context: Dict = None) -> Dict[str, Any]:
        """Create initial state with profile gap analysis specific fields"""
        state = super()._create_initial_state(user_message, user_id, session, context)
        state.update({
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
            logger.info(f"User {user_id} triggered escape phrase in gap_profile_workflow")
            # Clear this workflow's session
            if session_key in self._global_workflow_sessions:
                del self._global_workflow_sessions[session_key]
            # Return escape message
            return {
                "response": "✅ **Gap analysis stopped!** I've cleared the workflow. What would you like to do next?",
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
                start_node = "show_next_gap"
                
            # Create graph with appropriate entry point
            self.graph = self._create_graph_with_entry_point(start_node)
            state = existing_state
        else:
            # Start new workflow - clear old session if it exists
            if existing_state:
                logger.info(f"Clearing completed workflow session for user {user_id}")
                del self._global_workflow_sessions[session_key]
                
            state = self._create_initial_state(user_message, user_id, session, context)
            # Use identify_gaps as entry point for new workflows
            self.graph = self._create_graph_with_entry_point("identify_gaps")
            
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
        workflow = StateGraph(GapProfileState)
        
        # Add all nodes
        workflow.add_node("identify_gaps", self._identify_gaps)
        workflow.add_node("show_next_gap", self._show_next_gap)
        workflow.add_node("complete_analysis", self._complete_analysis)
        
        # Set dynamic entry point
        workflow.set_entry_point(entry_node)
        
        # Each node ends immediately to pause for user input
        workflow.add_edge("identify_gaps", END)
        workflow.add_edge("show_next_gap", END)  
        workflow.add_edge("complete_analysis", END)
        
        return workflow.compile()
    
    async def _identify_gaps(self, state: GapProfileState) -> GapProfileState:
        """Identify profile skill gaps and show first gap"""
        logger.info(f"Identifying profile gaps for user {state['user_id']}")
        
        # Hardcoded profile gaps for demo
        state["identified_gaps"] = [
            {
                "skill": "Cloud Technologies",
                "current_level": "Basic",
                "required_level": "Advanced", 
                "importance": "high",
                "suggestions": ["Take AWS certification", "Build cloud projects"]
            },
            {
                "skill": "Leadership Experience", 
                "current_level": "Individual Contributor",
                "required_level": "Team Lead",
                "importance": "medium",
                "suggestions": ["Lead a project", "Mentor junior developers"]
            },
            {
                "skill": "System Design",
                "current_level": "Junior Level",
                "required_level": "Senior Level", 
                "importance": "high",
                "suggestions": ["Study system design patterns", "Practice design interviews"]
            }
        ]
        
        state["total_gaps"] = len(state["identified_gaps"])
        
        # Show first gap immediately
        gap = state["identified_gaps"][0]
        response = f"""📊 **Profile Gap Analysis**

I've identified **{state['total_gaps']} key areas** for improvement. Let's address them one by one:

**Gap 1/{state['total_gaps']}: {gap['skill']}**
- Current: {gap['current_level']}
- Target: {gap['required_level']}
- Suggestions: {', '.join(gap['suggestions'])}

*What's your plan to improve this skill?*"""

        state["messages"].append({
            "role": "assistant",
            "content": response,
            "metadata": {
                "action": "gap_resolution_prompt",
                "gap_number": 1,
                "total_gaps": state["total_gaps"]
            }
        })
        
        state["current_gap_index"] = 0  # User needs to respond to gap 1
        state["workflow_complete"] = False
        
        return state
    
    async def _show_next_gap(self, state: GapProfileState) -> GapProfileState:
        """Show the next gap after user responded"""
        
        # current_gap_index is the 0-based index of the gap the user just responded to
        just_completed_gap_index = state["current_gap_index"]  
        just_completed_gap_number = just_completed_gap_index + 1  # Convert to 1-based for display
        next_gap_to_show_number = just_completed_gap_number + 1
        
        if next_gap_to_show_number <= state["total_gaps"]:
            # Show next gap with acknowledgment of previous
            next_gap_index = next_gap_to_show_number - 1  # Convert to 0-based index
            gap = state["identified_gaps"][next_gap_index]
            
            response = f"""✅ **Gap {just_completed_gap_number}/{state['total_gaps']} - Plan Set!**

Great approach! Now let's work on:

**Gap {next_gap_to_show_number}/{state['total_gaps']}: {gap['skill']}**
- Current: {gap['current_level']}
- Target: {gap['required_level']}
- Suggestions: {', '.join(gap['suggestions'])}

*What's your strategy for this skill gap?*"""

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

Excellent work! You've addressed all skill gaps."""
            
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
    
    async def _complete_analysis(self, state: GapProfileState) -> GapProfileState:
        """Complete the profile gap analysis"""
        response = f"""🎉 **Profile Gap Analysis Complete!**

Excellent work! You've addressed all **{state['total_gaps']} skill gaps**:

"""
        
        for i, gap in enumerate(state["identified_gaps"], 1):
            response += f"✅ **{i}. {gap['skill']}** - Plan created\n"
        
        response += f"""
**Next Steps:**
- Follow through on your improvement plans
- Track progress over the next 3-6 months  
- Consider setting specific milestones
- Update your profile as you develop these skills

*Your career development roadmap is now much clearer!*"""
        
        state["messages"].append({
            "role": "assistant",
            "content": response,
            "metadata": {
                "action": "analysis_complete",
                "workflow_complete": True,
                "gaps_addressed": state["total_gaps"],
                "total_gaps": state["total_gaps"],
                "gap_number": state["total_gaps"]
            }
        })
        
        # Add follow-up prompt for next steps
        followup_response = """🚀 **What would you like to do next?**

Here are some options to continue your career development:

1. **📄 Generate a tailored resume** - Create a resume optimized for specific roles
2. **🎯 Analyze job gaps** - Compare your profile against a specific job posting  
3. **✉️ Create outreach messages** - Generate personalized networking messages
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