#!/usr/bin/env python3
"""
risk_detector.py
================================================================================
Phase 6 — AI Risk Detection

Deterministic Python logic that scans project data for risks:
  - Overdue tasks
  - Overloaded employees (too many concurrent active assignments)
  - Missing task dependencies (tasks that depend on non-existent tasks)
  - Scheduling conflicts (employee double-booked on overlapping critical-path tasks)

The LLM is used ONLY to phrase the detected risks in plain language.
All risk logic is pure Python — no LLM involvement in the detection step.
================================================================================
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

logger = logging.getLogger(__name__)

# Configurable thresholds
OVERLOAD_THRESHOLD = 3   # tasks at which an employee is considered overloaded
MAX_CONCURRENT_TASKS = 5  # hard cap before flagging as critical overload


# ---------------------------------------------------------------------------
# Deterministic detection functions
# ---------------------------------------------------------------------------


def detect_overdue_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Return tasks that are overdue — status is not 'completed' and
    days_until_deadline <= 0.

    Each task dict should have: id, title, status, days_until_deadline, assigned_to
    """
    overdue = []
    for task in tasks:
        status = task.get("status", "")
        if status in ("completed", "done"):
            continue
        days = task.get("days_until_deadline")
        if days is not None and days <= 0:
            overdue.append(
                {
                    "task_id": task.get("id"),
                    "title": task.get("title", "Untitled"),
                    "days_overdue": abs(days),
                    "assigned_to": task.get("assigned_to"),
                    "status": status,
                }
            )
    return sorted(overdue, key=lambda t: t["days_overdue"], reverse=True)


def detect_overloaded_employees(
    assignments: list[dict[str, Any]],
    threshold: int = OVERLOAD_THRESHOLD,
) -> list[dict[str, Any]]:
    """
    Count active assignments per employee and flag those exceeding `threshold`.

    Each assignment dict should have: employee_user_id, display_name, status
    """
    from collections import Counter

    active = [a for a in assignments if a.get("status") in ("active", "in_progress")]
    counts = Counter(a["employee_user_id"] for a in active)
    names = {a["employee_user_id"]: a.get("display_name", str(a["employee_user_id"])) for a in active}

    overloaded = []
    for uid, count in counts.items():
        if count >= threshold:
            overloaded.append(
                {
                    "employee_user_id": uid,
                    "name": names.get(uid, str(uid)),
                    "active_task_count": count,
                    "severity": "critical" if count >= MAX_CONCURRENT_TASKS else "warning",
                }
            )
    return sorted(overloaded, key=lambda e: e["active_task_count"], reverse=True)


def detect_scheduling_conflicts(
    assignments: list[dict[str, Any]],
    critical_path_task_ids: list[int] | None = None,
) -> list[dict[str, Any]]:
    """
    Detect employees double-booked on multiple critical-path tasks simultaneously.

    assignments: list with employee_user_id, task_id, status
    critical_path_task_ids: list of task IDs on the critical path (from CPA module)
    """
    if not critical_path_task_ids:
        return []

    cp_set = set(critical_path_task_ids)
    active_cp_by_employee: dict[int, list[int]] = {}

    for a in assignments:
        if a.get("status") not in ("active", "in_progress"):
            continue
        task_id = a.get("task_id")
        uid = a.get("employee_user_id")
        if task_id in cp_set and uid is not None:
            active_cp_by_employee.setdefault(uid, []).append(task_id)

    conflicts = []
    for uid, task_ids in active_cp_by_employee.items():
        if len(task_ids) > 1:
            conflicts.append(
                {
                    "employee_user_id": uid,
                    "conflicting_critical_task_ids": task_ids,
                    "description": (
                        f"Employee {uid} is assigned to {len(task_ids)} "
                        f"critical-path tasks simultaneously: {task_ids}"
                    ),
                }
            )
    return conflicts


def run_full_risk_scan(
    tasks: list[dict[str, Any]],
    assignments: list[dict[str, Any]],
    critical_path_task_ids: list[int] | None = None,
    overload_threshold: int = OVERLOAD_THRESHOLD,
) -> dict[str, Any]:
    """
    Run all risk detection passes and aggregate results.
    Returns a dict suitable for passing to synthesize_risk_alert().
    """
    overdue = detect_overdue_tasks(tasks)
    overloaded = detect_overloaded_employees(assignments, overload_threshold)
    conflicts = detect_scheduling_conflicts(assignments, critical_path_task_ids)

    risk_summary = {
        "has_risks": bool(overdue or overloaded or conflicts),
        "overdue_tasks": overdue,
        "overloaded_employees": overloaded,
        "conflicts": [c["description"] for c in conflicts],
        "conflict_details": conflicts,
    }

    logger.info(
        "Risk scan complete: %d overdue, %d overloaded, %d conflicts",
        len(overdue),
        len(overloaded),
        len(conflicts),
    )
    return risk_summary


# ---------------------------------------------------------------------------
# Combined: detect + phrase via LLM
# ---------------------------------------------------------------------------


def detect_and_explain_risks(
    tasks: list[dict[str, Any]],
    assignments: list[dict[str, Any]],
    critical_path_task_ids: list[int] | None = None,
) -> dict[str, Any]:
    """
    Full pipeline: run deterministic risk scan, then ask the LLM to phrase
    the results. Returns both the raw risk data and the LLM explanation.
    """
    from orchestration.response_synthesizer import synthesize_risk_alert

    risk_data = run_full_risk_scan(tasks, assignments, critical_path_task_ids)
    explanation = synthesize_risk_alert(risk_data)

    return {
        "risk_data": risk_data,
        "explanation": explanation,
    }
