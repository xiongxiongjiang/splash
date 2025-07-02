"""
Base Workflow Class for LangGraph Workflows
Provides common interface and functionality for all chat workflows
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)


class BaseWorkflowState(TypedDict):
    """Common state for all workflows"""
    messages: List[Dict[str, Any]]
    user_id: int
    session_data: Dict[str, Any]
    workflow_complete: bool
    current_step: str
    # Workflow-specific data can be added by subclasses


class BaseWorkflow(ABC):
    """Base class for all chat workflows"""
    
    # Class-level session storage shared across all instances
    _global_workflow_sessions = {}
    
    # Escape phrases that allow users to break out of workflows
    ESCAPE_PHRASES = [
        "start over", "new conversation", "exit", "stop workflow", 
        "reset", "nevermind", "change topic", "something else",
        "different question", "cancel", "quit", "break out"
    ]
    
    def __init__(self):
        self.graph = None
        self._build_graph()
    
    def _should_break_session(self, user_message: str) -> bool:
        """Check if user wants to break out of current workflow"""
        message_lower = user_message.lower().strip()
        return any(phrase in message_lower for phrase in self.ESCAPE_PHRASES)
    
    @abstractmethod
    def _build_graph(self):
        """Build the LangGraph workflow - must be implemented by subclasses"""
        pass
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Get workflow-specific system prompt for AI responses"""
        pass
    
    @abstractmethod
    def get_workflow_name(self) -> str:
        """Get the name of this workflow"""
        pass
    
    async def process_message(
        self, 
        user_message: str, 
        user_id: int, 
        session=None, 
        context: Dict = None
    ) -> Dict[str, Any]:
        """
        Process a message through this workflow
        
        Args:
            user_message: The user's message
            user_id: ID of the user
            session: Database session
            context: Additional context (job posting, etc.)
            
        Returns:
            Workflow result with response and metadata
        """
        session_key = f"user_{user_id}_{self.get_workflow_name()}"
        
        # Check for existing workflow state in global storage
        existing_state = BaseWorkflow._global_workflow_sessions.get(session_key)
        
        if existing_state and not existing_state.get("workflow_complete"):
            # Continue existing workflow
            existing_state["messages"].append({"role": "user", "content": user_message})
            state = existing_state
        else:
            # Start new workflow
            state = self._create_initial_state(user_message, user_id, session, context)
            
        # Store state in global storage
        BaseWorkflow._global_workflow_sessions[session_key] = state
        
        try:
            # Run through workflow
            result = await self.graph.ainvoke(state)
            BaseWorkflow._global_workflow_sessions[session_key] = result
            return self._format_result(result)
        except Exception as e:
            logger.error(f"Workflow {self.get_workflow_name()} failed: {e}")
            return self._create_error_response(str(e))
    
    def _create_initial_state(
        self, 
        user_message: str, 
        user_id: int, 
        session=None, 
        context: Dict = None
    ) -> Dict[str, Any]:
        """Create initial state for a new workflow"""
        return {
            "messages": [{"role": "user", "content": user_message}],
            "user_id": user_id,
            "session_data": {"session": session, "context": context},
            "workflow_complete": False,
            "current_step": "start"
        }
    
    def _format_result(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Format workflow result for return"""
        # Get the last assistant message
        assistant_messages = [
            msg for msg in state["messages"] 
            if msg.get("role") == "assistant"
        ]
        
        # Combine metadata from message and workflow state
        metadata = {}
        if assistant_messages:
            latest_message = assistant_messages[-1]
            metadata.update(latest_message.get("metadata", {}))
            
        # Add workflow-specific state data to metadata
        for key, value in state.items():
            if key.startswith("identified_") or key in ["gap_resolution_attempts", "analysis_type", "job_posting_id"]:
                metadata[key] = value
        
        if assistant_messages:
            latest_message = assistant_messages[-1]
            return {
                "response": latest_message["content"],
                "workflow_name": self.get_workflow_name(),
                "workflow_complete": state.get("workflow_complete", False),
                "current_step": state.get("current_step", "unknown"),
                "metadata": metadata
            }
        else:
            return {
                "response": "",
                "workflow_name": self.get_workflow_name(),
                "workflow_complete": state.get("workflow_complete", False),
                "current_step": state.get("current_step", "unknown"),
                "metadata": metadata
            }
    
    def _create_error_response(self, error: str) -> Dict[str, Any]:
        """Create error response"""
        return {
            "response": f"I encountered an error processing your request. Please try again.",
            "workflow_name": self.get_workflow_name(),
            "workflow_complete": True,
            "error": error
        }
    
    def clear_session(self, user_id: int):
        """Clear workflow session for a user"""
        session_key = f"user_{user_id}_{self.get_workflow_name()}"
        if session_key in BaseWorkflow._global_workflow_sessions:
            del BaseWorkflow._global_workflow_sessions[session_key]