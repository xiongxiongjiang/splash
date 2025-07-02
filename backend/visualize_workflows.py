#!/usr/bin/env python3
"""
Standalone script to visualize the workflow system
Run this to see the routing map and DAG structures without starting the server
"""
import sys
import os

# Add current directory to path so we can import workflows
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

def main():
    """Generate workflow visualization"""
    try:
        from workflows.workflow_visualizer import workflow_visualizer
        workflow_visualizer.generate_full_report()
    except ImportError as e:
        print(f"❌ Error importing workflows: {e}")
        print("Make sure you're running this from the backend directory")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error generating visualization: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()