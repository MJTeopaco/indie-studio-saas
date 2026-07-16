#!/usr/bin/env python3
"""
workspace_qa.py
================================================================================
Deterministic Workspace Q&A Layer

Handles simple factual questions about workspace data (member counts, task
counts by status, overdue counts, project counts) by pattern-matching the
user's message against common query patterns and reading the pre-computed
`stats` and `members` fields from the context dict.

Falls through (returns None) if no pattern matches, letting the LLM handle
complex or ambiguous questions.

Context shape expected (from Laravel workspaceAssistant):
{
    "studio": { "id": "...", "name": "..." },
    "members": [
        { "id": int, "name": str, "role": str, "is_owner": bool, "active_task_count": int }
    ],
    "projects": [ { "id", "name", "status", "task_count" } ],
    "tasks": [
        { "id", "title", "status", "priority", "assigned_to", "days_until_deadline",
          "is_overdue", "project_id", "estimated_hours" }
    ],
    "stats": {
        "total_members":  int,   # count including the studio owner
        "total_projects": int,
        "total_tasks":    int,
        "total_overdue":  int,
        "by_status":      { "todo": int, "in_progress": int, "review": int, ... }
    }
}
================================================================================
"""

from __future__ import annotations

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Status aliases — map common natural-language terms to DB status keys
# ---------------------------------------------------------------------------

_STATUS_ALIASES: dict[str, str] = {
    # "todo" variants
    "todo":       "todo",
    "to do":      "todo",
    "to-do":      "todo",
    "not started": "todo",
    "open":       "todo",
    "pending":    "todo",

    # "in_progress" variants
    "in progress":  "in_progress",
    "in-progress":  "in_progress",
    "in_progress":  "in_progress",
    "ongoing":      "in_progress",
    "active":       "in_progress",
    "wip":          "in_progress",
    "working":      "in_progress",

    # "review" variants
    "review":       "review",
    "in review":    "review",
    "in-review":    "review",
    "under review": "review",
    "reviewing":    "review",
    "code review":  "review",

    # "completed" variants
    "completed":  "completed",
    "done":       "completed",
    "finished":   "completed",
    "closed":     "completed",
    "complete":   "completed",
}


def _normalize(text: str) -> str:
    """Lowercase and collapse whitespace for reliable matching."""
    return re.sub(r"\s+", " ", text.lower().strip())


def _extract_status(message: str) -> str | None:
    """Return the DB status key if the message mentions a recognizable status."""
    msg = _normalize(message)
    # Try longest matches first (e.g. "in progress" before "progress")
    for alias in sorted(_STATUS_ALIASES, key=len, reverse=True):
        if alias in msg:
            return _STATUS_ALIASES[alias]
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def answer_workspace_question(
    message: str,
    context: dict[str, Any],
) -> str | None:
    """
    Try to answer a simple factual workspace question deterministically.

    Returns a plain-string answer if a pattern matches, or None if the
    question should be forwarded to the LLM.

    Parameters
    ----------
    message : str
        The user's natural-language message.
    context : dict
        The enriched workspace context built by workspaceAssistant() in Laravel.
    """
    msg = _normalize(message)
    stats  = context.get("stats", {})
    members = context.get("members", [])
    projects = context.get("projects", [])
    studio_name = (context.get("studio") or {}).get("name", "your studio")

    # ── Member count ──────────────────────────────────────────────────────
    _MEMBER_PATTERNS = [
        r"how many (studio\s*)?(members?|team\s*members?|teammates?|people|users?)",
        r"(member|team|user|teammate)\s*(count|size|total|number)",
        r"how (big|large) is (the|my|our)?\s*(team|studio|group)",
        r"(total|count|number) of (members?|team)",
    ]
    for pat in _MEMBER_PATTERNS:
        if re.search(pat, msg):
            total = stats.get("total_members", len(members))
            # Identify the owner explicitly for clarity
            owner = next((m for m in members if m.get("is_owner")), None)
            owner_note = f" (including the studio owner, {owner['name']})" if owner else ""
            if total == 0:
                return f"{studio_name} has no members yet."
            if total == 1:
                return f"{studio_name} has 1 member{owner_note}."
            return f"{studio_name} has {total} member(s){owner_note}."

    # ── Overdue task count ────────────────────────────────────────────────
    _OVERDUE_PATTERNS = [
        r"how many (tasks?|tickets?|items?)\s*(are\s*)?(overdue|past due|late|behind|missed deadline)",
        r"overdue (tasks?|tickets?|items?|count|total)",
        r"tasks?\s*(that\s*)?(are\s*)?(overdue|past due|late|behind)",
        r"how many (are|have)\s*overdue",
    ]
    for pat in _OVERDUE_PATTERNS:
        if re.search(pat, msg):
            overdue = stats.get("total_overdue", 0)
            if overdue == 0:
                return "Great news — there are no overdue tasks in your workspace right now."
            return (
                f"There are {overdue} overdue task(s) across all projects in {studio_name}. "
                "These are incomplete tasks whose deadline has already passed."
            )

    # ── Tasks by status ───────────────────────────────────────────────────
    _BY_STATUS_PATTERNS = [
        r"how many (tasks?|tickets?|items?)\s*(are\s*)?(in\s+)?{status}",
        r"(tasks?|tickets?|items?)\s*(in|with|that are|marked as|status)\s*['\"]?{status}['\"]?",
        r"(count|total|number) of\s*(tasks?|tickets?)\s*(in\s+)?{status}",
    ]
    matched_status = _extract_status(msg)
    if matched_status and bool(re.search(r"how many|count|total|number|tasks?|tickets?", msg)):
        by_status = stats.get("by_status", {})
        count = by_status.get(matched_status, 0)
        human_status = matched_status.replace("_", " ")
        if count == 0:
            return f"There are currently no tasks with status '{human_status}' in your workspace."
        return f"There are {count} task(s) with status '{human_status}' in your workspace."

    # ── Project count ─────────────────────────────────────────────────────
    _PROJECT_PATTERNS = [
        r"how many (active\s*)?(projects?|workstreams?)",
        r"(project|projects)\s*(count|total|number)",
        r"(total|number) of (my\s*)?(projects?|workstreams?)",
    ]
    for pat in _PROJECT_PATTERNS:
        if re.search(pat, msg):
            total = stats.get("total_projects", len(projects))
            if total == 0:
                return f"{studio_name} has no projects yet."
            if total == 1:
                return f"{studio_name} has 1 project."
            active_count = sum(1 for p in projects if p.get("status") == "active")
            if active_count and active_count < total:
                return (
                    f"{studio_name} has {total} project(s) in total, "
                    f"of which {active_count} are currently active."
                )
            return f"{studio_name} has {total} project(s)."

    # ── Total task count ──────────────────────────────────────────────────
    _TOTAL_TASK_PATTERNS = [
        r"how many (total\s*)?(tasks?|tickets?|items?)\s*(do (i|we|my studio) have|are there|in total|overall)?",
        r"(total|count|number) of (all\s*)?(tasks?|tickets?)",
    ]
    for pat in _TOTAL_TASK_PATTERNS:
        if re.search(pat, msg):
            # Avoid triggering on "how many tasks are overdue/in review" — those
            # are already handled above; only trigger on bare count questions.
            if not matched_status and not re.search(r"overdue|past due|late|behind", msg):
                total = stats.get("total_tasks", 0)
                by_status = stats.get("by_status", {})
                completed = by_status.get("completed", 0)
                if total == 0:
                    return f"{studio_name} has no tasks yet."
                return (
                    f"{studio_name} has {total} task(s) in total "
                    f"({completed} completed, {total - completed} remaining)."
                )

    # ── Member list / who is on the team ─────────────────────────────────
    _LIST_MEMBER_PATTERNS = [
        r"(who|list|show me|what are|name).*(members?|team|teammates?|people|staff)",
        r"(members?|team|teammates?).*(list|who|names?)",
    ]
    for pat in _LIST_MEMBER_PATTERNS:
        if re.search(pat, msg):
            if not members:
                return f"{studio_name} has no members yet."
            names = []
            for m in members:
                role_label = "Owner" if m.get("is_owner") else m.get("role", "Member").title()
                names.append(f"{m['name']} ({role_label})")
            return f"{studio_name} has {len(members)} member(s): {', '.join(names)}."

    # No deterministic match — fall through to LLM
    return None
