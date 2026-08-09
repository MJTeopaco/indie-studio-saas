import sys
import os
import json

# Ensure orchestration modules can be imported
sys.path.insert(0, os.path.dirname(__file__))

from orchestration.intent_parser import parse_task_from_text, decompose_project_into_tasks
from orchestration.embedding_service import EmbeddingService
from orchestration.cpa import CPAEngine
from orchestration.response_synthesizer import synthesize_assignment_explanation

def run_e2e():
    print("--- 1. Input ---")
    description = "Build a frontend dashboard in React with user authentication, and a backend API in Laravel. The backend API must be completed before the dashboard."
    print("Description:", description)
    
    print("\n--- 2. Decompose into Tasks (LLM) ---")
    tasks = decompose_project_into_tasks(description)
    print(json.dumps(tasks, indent=2))
    
    print("\n--- 3. GNN Fit Scores (Cold-Start Stub) ---")
    # Stubbing employees
    employees = [
        {"id": 101, "display_name": "Alice Backend", "skills": ["Laravel", "PHP"]},
        {"id": 102, "display_name": "Bob Frontend", "skills": ["React", "JavaScript"]}
    ]
    # For simplicity, assign task 0 to Bob, task 1 to Alice
    # GNN fit scores stub:
    gnn_results = [
        {"user_id": 101, "display_name": "Alice Backend", "match_fit_score": 0.95, "match_source": "gnn", "skill_overlap": ["Laravel"]},
        {"user_id": 102, "display_name": "Bob Frontend", "match_fit_score": 0.88, "match_source": "gnn", "skill_overlap": ["React"]}
    ]
    print(json.dumps(gnn_results, indent=2))
    
    print("\n--- 4. CPA Validation ---")
    cpa_tasks = []
    assignments = []
    
    for i, t in enumerate(tasks):
        tid = f"T{i}"
        hours = getattr(t, 'estimated_hours', t.get('estimated_hours', 8))
        depends_on = t.get("suggested_depends_on", [])
        # map depends_on indices to T_i
        mapped_deps = [f"T{dep}" for dep in depends_on if isinstance(dep, int)]
        cpa_tasks.append({
            "id": tid,
            "estimated_hours": hours,
            "depends_on": mapped_deps
        })
        assignments.append({
            "task_id": tid,
            "employee_user_id": employees[i % 2]["id"]
        })
        
    engine = CPAEngine()
    cpa_result = engine.validate_assignments(cpa_tasks, assignments)
    print("CPA Valid?", cpa_result["valid"])
    print("Project Finish:", cpa_result["cpa_result"]["project_finish"])
    print("Critical Path:", cpa_result["cpa_result"]["critical_path_task_ids"])
    
    print("\n--- 5. Response Synthesis (LLM) ---")
    explanation = synthesize_assignment_explanation(gnn_results, cpa_result["cpa_result"])
    print("Explanation:\n", explanation)
    
if __name__ == "__main__":
    run_e2e()
