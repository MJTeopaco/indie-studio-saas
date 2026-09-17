import os
import logging
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)

LARAVEL_API_URL = os.environ.get("LARAVEL_API_URL", "http://127.0.0.1:8000")
ML_ENGINE_SECRET = os.environ.get("ML_ENGINE_SECRET", "studio_sprint_internal_secret_123")

def _make_internal_request(endpoint: str) -> Dict[str, Any]:
    url = f"{LARAVEL_API_URL.rstrip('/')}/{endpoint.lstrip('/')}"
    headers = {
        "X-ML-Engine-Secret": ML_ENGINE_SECRET,
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch data from {url}: {str(e)}")
        raise RuntimeError("System Error: Could not fetch data from the database.")

def get_studio_workforce_profile(studio_id: int) -> Dict[str, Any]:
    """Fetches team members, their roles, skills, and micro-domains for a studio."""
    return _make_internal_request(f"/api/internal/studios/{studio_id}/workforce-profile")

def get_active_sprint_health(studio_id: int) -> Dict[str, Any]:
    """Fetches current sprint metrics, bottlenecks, and critical path data."""
    return _make_internal_request(f"/api/internal/studios/{studio_id}/sprint-health")

def get_developer_workload(studio_id: int, user_id: int) -> Dict[str, Any]:
    """Fetches a specific developer's task count and allocations."""
    return _make_internal_request(f"/api/internal/studios/{studio_id}/developers/{user_id}/workload")

def get_sprint_tasks(project_id: int, sprint_name: str) -> Dict[str, Any]:
    """Fetches the unassigned tasks for a specific sprint in a project."""
    import urllib.parse
    encoded_sprint = urllib.parse.quote(sprint_name)
    return _make_internal_request(f"/api/internal/projects/{project_id}/sprints/{encoded_sprint}/unassigned-tasks")

# Mapping of tool names to callable functions
AGENT_TOOLS = {
    "get_studio_workforce_profile": get_studio_workforce_profile,
    "get_active_sprint_health": get_active_sprint_health,
    "get_developer_workload": get_developer_workload,
    "get_sprint_tasks": get_sprint_tasks,
}

def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> str:
    """Executes a tool by name and returns the JSON string result or error message."""
    if tool_name not in AGENT_TOOLS:
        return f'{{"error": "Unknown tool: {tool_name}"}}'
    
    try:
        func = AGENT_TOOLS[tool_name]
        result = func(**arguments)
        import json
        return json.dumps(result)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'
