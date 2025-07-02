"""
AI-Powered Chat Router using LiteLLM
Routes user messages to appropriate workflows based on intent classification
"""
import logging
from typing import List, Dict, Optional
from litellm import acompletion

logger = logging.getLogger(__name__)


class ChatRouter:
    """AI-powered router for chat messages"""
    
    ROUTER_SYSTEM_PROMPT = """
    You are a career assistant router. Analyze the user's message to determine 
    the most appropriate workflow.

    Available workflows:
    - DIRECT_RESPONSE: Simple questions, general chat, casual conversation
    - PROFILE_ANALYSIS: "Tell me about my profile", "What are my strengths", "Analyze my background"
    - PROFILE_GAP_ANALYSIS: "What skills am I missing?", "How can I improve?", "What should I learn?"
    - JOB_GAP_ANALYSIS: "How do I match against this job?", "What gaps do I have for this position?"
    - RESUME_GENERATION: "Generate a resume", "Create a tailored resume", "Build my resume"
    - GENERATE_REACHOUT: "Write a reachout message", "Generate outreach", "Help me reach out to someone"

    Respond with ONLY the workflow name.
    """
    
    @staticmethod
    async def route_message(
        user_message: str, 
        conversation_history: List[Dict], 
        user_context: Dict = None
    ) -> str:
        """
        Route a message using AI to classify intent
        
        Args:
            user_message: The user's latest message
            conversation_history: Previous messages in the conversation
            user_context: Optional context about the user (profile, current state, etc.)
            
        Returns:
            The workflow name to route to
        """
        try:
            # Build context message
            context_parts = []
            if conversation_history:
                context_parts.append("Recent conversation:")
                for msg in conversation_history[-3:]:  # Last 3 messages for context
                    context_parts.append(f"{msg.get('role', 'user')}: {msg.get('content', '')[:100]}...")
            
            if user_context:
                context_parts.append(f"User context: {user_context}")
            
            # Create messages for the router
            messages = [
                {"role": "system", "content": ChatRouter.ROUTER_SYSTEM_PROMPT},
                {"role": "user", "content": f"User message: {user_message}\n\n{chr(10).join(context_parts)}"}
            ]
            
            # Call LiteLLM for routing decision
            response = await acompletion(
                model="gemini/gemini-1.5-flash",
                messages=messages,
                temperature=0.1,  # Low temperature for consistent routing
                max_tokens=50     # Short response for route classification
            )
            
            route = response.choices[0].message.content.strip()
            logger.info(f"Routed message '{user_message[:50]}...' to workflow: {route}")
            
            # Validate route
            valid_routes = [
                "DIRECT_RESPONSE", "PROFILE_ANALYSIS", "PROFILE_GAP_ANALYSIS",
                "JOB_GAP_ANALYSIS", "RESUME_GENERATION", "GENERATE_REACHOUT"
            ]
            
            if route not in valid_routes:
                logger.warning(f"Invalid route {route}, defaulting to DIRECT_RESPONSE")
                return "DIRECT_RESPONSE"
                
            return route
            
        except Exception as e:
            logger.error(f"Error in AI routing: {e}")
            # Fallback to simple keyword matching if AI fails
            return ChatRouter._fallback_route(user_message)
    
    @staticmethod
    def _fallback_route(user_message: str) -> str:
        """Simple keyword-based fallback routing"""
        message_lower = user_message.lower()
        
        if any(keyword in message_lower for keyword in ["gap", "missing", "lack", "need to improve"]):
            return "PROFILE_GAP_ANALYSIS"
        elif any(keyword in message_lower for keyword in ["tell me about", "my profile", "my background"]):
            return "PROFILE_ANALYSIS"
        elif any(keyword in message_lower for keyword in ["generate resume", "create resume", "build resume"]):
            return "RESUME_GENERATION"
        elif any(keyword in message_lower for keyword in ["reachout", "outreach", "reach out"]):
            return "GENERATE_REACHOUT"
        elif "job" in message_lower and any(keyword in message_lower for keyword in ["match", "gap", "qualify"]):
            return "JOB_GAP_ANALYSIS"
        else:
            return "DIRECT_RESPONSE"