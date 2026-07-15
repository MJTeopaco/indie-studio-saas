#!/usr/bin/env python3
"""
test_groq_endpoints.py
================================================================================
End-to-end smoke test for all 6 LLM endpoints against the live Groq API.

Usage (from ml-engine/):
    Start the FastAPI server first in one terminal:
        .\\venv\\Scripts\\uvicorn main:app --host 127.0.0.1 --port 8001 --reload

    Then in a second terminal run:
        .\\venv\\Scripts\\python test_groq_endpoints.py

Each test prints PASS/FAIL + the response snippet.
Exit code 0 = all passed, 1 = at least one failed.
================================================================================
"""

import json
import sys
import textwrap
import urllib.request
import urllib.error

# Force UTF-8 output so Windows cp1252 terminals don't crash on LLM Unicode.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8001"
PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

results: list[bool] = []


def post(path: str, payload: dict) -> dict:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())


def check(name: str, path: str, payload: dict, *, required_keys: list[str]) -> None:
    print(f"\n{'-'*60}")
    print(f"Testing: {name}")
    print(f"  POST {path}")
    try:
        resp = post(path, payload)
        missing = [k for k in required_keys if k not in resp]
        if resp.get("status") == "success" and not missing:
            print(f"  {PASS}")
        else:
            print(f"  {FAIL}  status={resp.get('status')}  missing={missing}")
            results.append(False)
            print("  Response:", textwrap.shorten(json.dumps(resp), 200))
            return
        # Print a short snippet of the result
        for k in required_keys:
            val = resp[k]
            snippet = json.dumps(val)[:300] if not isinstance(val, str) else val[:300]
            print(f"  [{k}]: {snippet}")
        results.append(True)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")[:400]
        print(f"  {FAIL}  HTTP {exc.code}: {body}")
        results.append(False)
    except Exception as exc:
        print(f"  {FAIL}  {exc}")
        results.append(False)


# ---------------------------------------------------------------------------
# 1. /api/llm/parse-task
# ---------------------------------------------------------------------------
check(
    "parse-task",
    "/api/llm/parse-task",
    {"text": "Build a REST API for user authentication using FastAPI and PostgreSQL"},
    required_keys=["status", "task"],
)

# ---------------------------------------------------------------------------
# 2. /api/llm/decompose-project
# ---------------------------------------------------------------------------
check(
    "decompose-project",
    "/api/llm/decompose-project",
    {"description": "Build a multi-tenant SaaS project management tool with sprint planning, "
                    "task assignment, and a real-time dashboard. Target: 3-month delivery."},
    required_keys=["status", "tasks", "count", "explanation"],
)

# ---------------------------------------------------------------------------
# 3. /api/llm/synthesize-assignment
# ---------------------------------------------------------------------------
check(
    "synthesize-assignment",
    "/api/llm/synthesize-assignment",
    {
        "gnn_results": [
            {
                "employee_user_id": 1,
                "display_name": "Alice Chen",
                "match_fit_score": 0.87,
                "skill_overlap": ["FastAPI", "Python", "PostgreSQL"],
                "match_source": "gnn",
            },
            {
                "employee_user_id": 2,
                "display_name": "Bob Torres",
                "match_fit_score": 0.71,
                "skill_overlap": ["Python", "REST APIs"],
                "match_source": "gnn",
            },
        ],
        "task": {
            "title": "Build Auth REST API",
            "task_difficulty": "Medium",
            "required_skills": [{"name": "FastAPI", "level": 3}, {"name": "PostgreSQL", "level": 2}],
        },
        "cpa_schedule": None,
    },
    required_keys=["status", "explanation"],
)

# ---------------------------------------------------------------------------
# 4. /api/llm/risk-scan
# ---------------------------------------------------------------------------
check(
    "risk-scan",
    "/api/llm/risk-scan",
    {
        "tasks": [
            {"id": 1, "title": "API Design", "status": "overdue", "estimated_hours": 8.0, "due_date": "2025-01-01"},
            {"id": 2, "title": "DB Schema", "status": "in_progress", "estimated_hours": 16.0},
        ],
        "assignments": [
            {"task_id": 1, "employee_user_id": 1, "display_name": "Alice Chen"},
            {"task_id": 2, "employee_user_id": 1, "display_name": "Alice Chen"},
        ],
        "critical_path_task_ids": [1, 2],
    },
    required_keys=["status", "explanation"],
)

# ---------------------------------------------------------------------------
# 5. /api/llm/project-summary
# ---------------------------------------------------------------------------
check(
    "project-summary",
    "/api/llm/project-summary",
    {
        "stats": {
            "project_name": "SprintStudio MVP",
            "total_tasks": 24,
            "completed": 10,
            "in_progress": 8,
            "overdue": 2,
            "estimated_completion_date": "2025-09-01",
            "velocity_tasks_per_day": 0.8,
        }
    },
    required_keys=["status", "summary"],
)

# ---------------------------------------------------------------------------
# 6. /api/llm/chat
# ---------------------------------------------------------------------------
check(
    "chat",
    "/api/llm/chat",
    {
        "message": "Which developer is best suited for the authentication task?",
        "project_context": {
            "project": {"name": "SprintStudio MVP", "status": "active"},
            "tasks": [{"id": 1, "title": "Build Auth REST API", "status": "todo"}],
            "members": [
                {"user_id": 1, "name": "Alice Chen", "skills": ["FastAPI", "Python", "PostgreSQL"]},
                {"user_id": 2, "name": "Bob Torres", "skills": ["React", "JavaScript"]},
            ],
        },
        "conversation_history": [],
    },
    required_keys=["status", "reply"],
)

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
total = len(results)
passed = sum(results)
print(f"\n{'='*60}")
print(f"Results: {passed}/{total} passed")
if passed < total:
    print("Some tests FAILED — check output above.")
    sys.exit(1)
else:
    print("All tests PASSED ✓")
    sys.exit(0)
