"""
Workflow Visualization and Documentation
Dynamically generates visual representations of the routing system and workflow DAGs
"""
import logging
from typing import Dict, List, Any
from .chat_router import ChatRouter
from .profile_analysis_workflow import ProfileAnalysisWorkflow
from .gap_profile_workflow import GapProfileWorkflow
from .gap_job_workflow import JobGapWorkflow
from .resume_generation_workflow import ResumeGenerationWorkflow
from .generate_reachout_workflow import GenerateReachoutWorkflow

logger = logging.getLogger(__name__)


class WorkflowVisualizer:
    """Generates visual documentation of the workflow system"""
    
    def __init__(self):
        self.workflows = {
            "ProfileAnalysisWorkflow": ProfileAnalysisWorkflow(),
            "GapProfileWorkflow": GapProfileWorkflow(),
            "JobGapWorkflow": JobGapWorkflow(),
            "ResumeGenerationWorkflow": ResumeGenerationWorkflow(),
            "GenerateReachoutWorkflow": GenerateReachoutWorkflow()
        }
    
    def print_routing_map(self):
        """Print ASCII visualization of how ChatRouter routes to workflows"""
        print("\n" + "="*80)
        print("🤖 UNIFIED CHAT ARCHITECTURE - ROUTING MAP")
        print("="*80)
        
        # Router decision tree
        router_map = """
    User Message
         │
         ▼
    ┌─────────────┐
    │ ChatRouter  │ ◄─── AI-powered intent classification
    │ (Gemini)    │      using ROUTER_SYSTEM_PROMPT
    └─────────────┘
         │
         ▼
    ┌─────────────┴─────────────┐
    │     Route Decision        │
    └─┬─┬─┬─┬─┬─┬───────────────┘
      │ │ │ │ │ │
      ▼ ▼ ▼ ▼ ▼ ▼
      
📋 DIRECT_RESPONSE ──────► Regular chat with function calling
   "What's 2+2?"             • get_user_profile()
   "Hello"                   • get_user_resumes()
                            • identify_gaps_per_job()
                            
🧑 PROFILE_ANALYSIS ─────► ProfileAnalysisWorkflow
   "Tell me about my profile" • Analyze strengths
   "What are my skills?"      • Career insights
                            • Experience summary
                            
📊 PROFILE_GAP_ANALYSIS ──► GapProfileWorkflow
   "What skills am I missing?" • General skill gap analysis
   "How can I improve?"       • Career development focus
                            • Skill recommendations
                            
🎯 JOB_GAP_ANALYSIS ──────► JobGapWorkflow
   "How do I match this job?" • Job-specific analysis
   "Gaps for this position?"  • Targeted improvements
                            
📄 RESUME_GENERATION ─────► ResumeGenerationWorkflow
   "Generate a resume"        • Job-tailored resumes
   "Create my CV"            • Format optimization
                            
💼 GENERATE_REACHOUT ─────► GenerateReachoutWorkflow
   "Write outreach message"   • Personalized messages
   "Help me reach out"       • Networking templates
        """
        
        print(router_map)
        
        # Show routing logic
        print("\n📝 ROUTING LOGIC:")
        print("• ChatRouter uses Gemini 1.5-flash to classify user intent")
        print("• Routes are determined by analyzing message content + conversation history")
        print("• Each workflow maintains session state for multi-turn conversations")
        print("• Fallback to DIRECT_RESPONSE for unknown/general queries")
    
    def print_workflow_dags(self):
        """Print ASCII DAGs for each workflow"""
        print("\n" + "="*80)
        print("🔄 WORKFLOW DAG STRUCTURES")
        print("="*80)
        
        for workflow_name, workflow_instance in self.workflows.items():
            print(f"\n🔹 {workflow_name}")
            print("-" * 50)
            
            try:
                # Try to get the graph structure
                if hasattr(workflow_instance, 'graph') and workflow_instance.graph:
                    # Get the graph representation
                    graph = workflow_instance.graph
                    
                    # Print basic structure info
                    print(f"Workflow Name: {workflow_instance.get_workflow_name()}")
                    print(f"System Prompt: {workflow_instance.get_system_prompt()[:100]}...")
                    
                    # Special handling for gap analysis workflows
                    if workflow_name == "GapProfileWorkflow":
                        print("\n🔀 Profile Gap Analysis:")
                        print("   • Focus: General career development")
                        print("   • Input: User profile only")
                        print("   • Output: Skill improvement recommendations")
                    elif workflow_name == "JobGapWorkflow":
                        print("\n🔀 Job Gap Analysis:")
                        print("   • Focus: Job-specific requirements")
                        print("   • Input: User profile + job_posting_id")
                        print("   • Output: Job readiness assessment")
                    
                    # Generate DAG visualization - try ASCII first, fallback to PNG
                    try:
                        graph_obj = graph.get_graph()
                        
                        # Try ASCII visualization first
                        try:
                            ascii_graph = graph_obj.draw_ascii()
                            print(f"\n📊 DAG Structure:")
                            print(ascii_graph)
                            
                        except Exception as ascii_e:
                            # ASCII failed - fallback to PNG and save locally
                            print(f"\n📊 DAG Structure: ASCII failed ({ascii_e}), using PNG fallback")
                            try:
                                png_data = graph_obj.draw_mermaid_png()
                                png_filename = f"{workflow_name.lower()}_workflow.png"
                                with open(png_filename, "wb") as f:
                                    f.write(png_data)
                                print(f"\n✅ DAG visualization saved to: {png_filename}")
                                
                                # Clean up - delete the PNG file after showing path
                                import os
                                try:
                                    os.remove(png_filename)
                                    print(f"   (Temporary file {png_filename} cleaned up)")
                                except:
                                    pass
                                    
                            except Exception as png_e:
                                print(f"❌ PNG fallback also failed: {png_e}")
                            
                    except Exception as e:
                        print(f"❌ Visualization failed: {str(e)}")
                        # Final fallback to basic node/edge info
                        try:
                            graph_obj = graph.get_graph()
                            print(f"\n📊 Graph Structure:")
                            print(f"   Nodes: {list(graph_obj.nodes.keys())}")
                            print(f"   Edges: {len(graph_obj.edges)}")
                            
                            # Show conditional edges info
                            if hasattr(graph_obj, 'branches') and graph_obj.branches:
                                print(f"   Conditional edges: {len(graph_obj.branches)} found")
                                for node, branches in graph_obj.branches.items():
                                    print(f"     {node} → {list(branches.keys())}")
                        except:
                            print("   Unable to analyze graph structure")
                else:
                    print("❌ No graph available")
                    
            except Exception as e:
                logger.error(f"Error processing {workflow_name}: {e}")
                print(f"❌ Error: {e}")
    
    
    def print_session_management(self):
        """Print information about workflow session management"""
        print("\n" + "="*80)
        print("💾 SESSION MANAGEMENT")
        print("="*80)
        
        session_info = """
🔑 Session Keys: "user_{user_id}_{workflow_name}"
   Example: "user_123_gap_analysis_general"

🗃️  Storage: BaseWorkflow._global_workflow_sessions (class-level dict)
   • Shared across all workflow instances
   • Persists between HTTP requests
   • Cleared when workflow_complete = True

📊 Session State Structure:
   {
     "messages": [{"role": "user/assistant", "content": "..."}],
     "user_id": 123,
     "session_data": {"session": db_session, "context": {}},
     "workflow_complete": false,
     "current_step": "resolving_gaps",
     
     # Workflow-specific fields:
     "identified_gaps": [...],
     "gaps_resolved": 2,
     "analysis_type": "general"
   }

🔄 Flow:
   1. New message → Check existing session
   2. If session exists + not complete → Continue workflow
   3. If no session → Start new workflow
   4. Update session state after each step
   5. Session deleted when workflow_complete = true
        """
        
        print(session_info)
    
    def generate_full_report(self):
        """Generate complete workflow system documentation"""
        print("\n🚀 TALLY CHAT WORKFLOW SYSTEM INITIALIZATION")
        print("Generated at server startup for development reference")
        
        self.print_routing_map()
        self.print_workflow_dags() 
        self.print_session_management()
        
        print("\n" + "="*80)
        print("✅ WORKFLOW SYSTEM READY")
        print("="*80)
        print("• All workflows initialized successfully")
        print("• ChatRouter ready for intent classification")
        print("• Session management active")
        print("• Ready to handle chat requests")
        print()


# Singleton instance
workflow_visualizer = WorkflowVisualizer()