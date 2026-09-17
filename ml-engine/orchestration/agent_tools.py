import os
import logging
import requests
from typing import Dict, Any

from langchain_core.tools import tool

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

@tool
def get_studio_workforce_profile(studio_id: str) -> Dict[str, Any]:
    """Fetches team members, their roles, skills, and micro-domains for a studio."""
    return _make_internal_request(f"/api/internal/studios/{studio_id}/workforce-profile")

@tool
def get_active_sprint_health(studio_id: str) -> Dict[str, Any]:
    """Fetches current sprint metrics, bottlenecks, and critical path data."""
    return _make_internal_request(f"/api/internal/studios/{studio_id}/sprint-health")

@tool
def get_developer_workload(studio_id: str, user_id: int) -> Dict[str, Any]:
    """Fetches a specific developer's task count and allocations."""
    return _make_internal_request(f"/api/internal/studios/{studio_id}/developers/{user_id}/workload")

@tool
def get_sprint_tasks(studio_id: str, project_id: int, sprint_name: str) -> Dict[str, Any]:
    """Fetches the unassigned tasks for a specific sprint in a project. If the user asks for the current sprint, pass 'current' as the sprint_name."""
    import urllib.parse
    encoded_sprint = urllib.parse.quote(sprint_name)
    return _make_internal_request(f"/api/internal/studios/{studio_id}/projects/{project_id}/sprints/{encoded_sprint}/unassigned-tasks")

@tool
def get_project_tasks(studio_id: str, project_id: int) -> Dict[str, Any]:
    """Fetches all active tasks for a specific project. This includes a maximum of 50 tasks, prioritizing todo and in_progress items."""
    return _make_internal_request(f"/api/internal/studios/{studio_id}/projects/{project_id}/tasks")

# Export list of tools for easy binding
AGENT_TOOLS_LIST = [
    get_studio_workforce_profile,
    get_active_sprint_health,
    get_developer_workload,
    get_sprint_tasks,
    get_project_tasks,
]
