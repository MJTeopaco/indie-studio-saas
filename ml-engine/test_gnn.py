import sys
import os
import json

# Ensure orchestration modules can be imported
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
from scripts.single_task_recommendation.gnn_recommendation_inference import simulate_task_input

client = TestClient(app)

def test_api():
    raw = simulate_task_input()
    task_dict = {
        "title": raw.get("task_title", ""),
        "description": raw.get("task_description", ""),
        "task_classification": raw.get("task_classification", ""),
        "required_position": raw.get("required_position", ""),
        "task_difficulty": raw.get("task_difficulty", "Medium"),
        "target_macro_domains": raw.get("target_macro_domains", []),
        "required_skills": [{"name": k, "level": v} for k, v in raw.get("required_skills", {}).items()]
    }
    
    print("\nCalling POST /api/best-fit...")
    response = client.post("/api/best-fit", json=task_dict)
    
    print("Status Code:", response.status_code)
    if response.status_code == 200:
        results = response.json().get("results", [])
        for r in results:
            print(f"Rank {results.index(r)+1}: ID {r['user_id']} ({r['display_name']}) - {r['position']} - Score: {r['match_fit_score']:.4f} - Skills: {r['skill_overlap']} - Status: {r['operational_capacity']}")
    else:
        print("Error:", response.text)

if __name__ == "__main__":
    test_api()

