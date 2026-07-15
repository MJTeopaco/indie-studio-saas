#!/usr/bin/env python3
"""
response_synthesizer.py
================================================================================
Phase 6 — Response Synthesizer

Takes deterministic computation results (GNN fit scores + CPA-validated
schedule) and produces plain-language explanations for the manager chat
interface.

CONSTRAINT: This module ONLY phrases results. It never computes scores,
schedules, or durations — those come in as arguments from the GNN and CPA
modules and are passed directly to the LLM as grounding data.
================================================================================
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_ASSIGNMENT_EXPLAIN_SYSTEM = """You are a project management assistant explaining AI assignment recommendations.
You will receive JSON data containing the target task (if provided), developer candidate match results, optional schedule constraints, and a resource_deficit_flag.

Write a clear, professional 2-4 sentence summary following these rules:
1. If resource_deficit_flag is true (meaning all candidate match scores are below 50%), DO NOT confidently recommend them. Instead, issue a Capacity Warning explaining why the top candidates scored poorly and suggest options like upskilling, adjusting deadlines, or workload reallocation.
2. If resource_deficit_flag is false, state clearly who is recommended for the task and explain WHY based on their matching skill overlap with the task.
3. ONLY mention critical path or scheduling constraints if 'cpa_schedule' is explicitly provided and non-null in the JSON.
4. CRITICAL RULE: DO NOT mention missing data, null values, or the Critical Path Algorithm if no scheduling constraints are provided in the payload. Do not speculate or invent numbers. Write in plain English."""

_RISK_ALERT_SYSTEM = """You are a project risk analyst. You will receive a JSON object describing
project risks (overdue tasks, overloaded employees, conflicts). Write a brief plain-language
alert (2-4 sentences) that is actionable and specific. Do not add recommendations that
aren't supported by the data. Use only the provided data."""

_SUMMARY_SYSTEM = """You are summarising a software project's current status.
You will receive JSON project stats. Write a 2-3 sentence status update for a manager.
Be factual and brief. Use only the data provided — do NOT guess or extrapolate."""

_CHATBOT_SYSTEM = """You are a helpful project management assistant for a software studio.
You have access to real project data provided in the conversation.
Answer the user's question based ONLY on the data provided.
If the data does not contain enough information to answer, say so.
Do not fabricate task names, developer names, dates, or scores."""

_INTENT_CLASSIFIER_SYSTEM = """You are an intent classifier for a software studio AI Assistant.
Given a user message from a project manager, classify their intent into exactly ONE of these three categories:
1. "create_task" — The user is specifying a SINGLE task they want to create/add (e.g., "Add a bug fix for infinite scroll...", "Create a task: Refactor database schema...", "Bug Fixing & Performance Optimization Task: Resolve an issue where...").
2. "decompose_sprint" — The user is requesting to plan, break down, or generate MULTIPLE tasks for a sprint, epic, or major feature (e.g., "Plan a sprint for the new user authentication module", "Decompose the onboarding flow into tasks...", "Generate sprint tasks for telemetry dashboard").
3. "qa" — The user is asking a question or requesting analysis about existing project data, status, deadlines, risks, or team members (e.g., "How many tasks are in review?", "Summarize the project", "Who is working on task #5?").

Respond ONLY with valid JSON in this exact format:
{"intent": "qa" | "create_task" | "decompose_sprint", "confidence": float}"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _call_llm(system_prompt: str, user_content: str) -> str | None:
    """Generic single-turn LLM call. Returns None if LLM unavailable."""
    from orchestration.llm_client import get_llm

    llm = get_llm()
    if llm is None:
        return None

    from langchain_core.messages import HumanMessage, SystemMessage

    try:
        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_content),
            ]
        )
        return response.content.strip()
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def synthesize_assignment_explanation(
    gnn_results: list[dict[str, Any]],
    cpa_schedule: dict[str, Any] | None = None,
    task: dict[str, Any] | None = None,
) -> str:
    """
    Generate a plain-language explanation for the manager about the proposed
    assignments.

    gnn_results: list of {employee_user_id, display_name, match_fit_score,
                           skill_overlap, match_source, ...}
    cpa_schedule: optional output from /schedule/compute with critical_path list
    task: optional task dict with title, difficulty, required_skills
    """
    payload_candidates = [
        c for c in gnn_results if c.get("match_fit_score", 0) >= 0.50
    ][:3]

    deficit_warning = False
    if not payload_candidates:
        payload_candidates = gnn_results[:2]
        deficit_warning = True

    payload = json.dumps(
        {
            "task": task,
            "gnn_results": payload_candidates,
            "cpa_schedule": cpa_schedule,
            "resource_deficit_flag": deficit_warning,
        },
        indent=2,
    )

    explanation = _call_llm(_ASSIGNMENT_EXPLAIN_SYSTEM, payload)
    if explanation is None:
        # Fallback: build a plain summary without LLM
        lines = []
        if deficit_warning:
            lines.append("⚠️ Resource Deficit Detected: No candidates scored above 50% fit for this task. Closest matches:")
        else:
            lines.append("AI assignment recommendations (LLM offline — summary only):")

        for i, r in enumerate(payload_candidates, 1):
            score_pct = int(r.get("match_fit_score", 0) * 100)
            overlap = ", ".join(r.get("skill_overlap", [])[:4]) or "general fit"
            lines.append(
                f"{i}. {r.get('display_name', 'Developer')} — {score_pct}% fit "
                f"(matched on: {overlap})"
            )

        if cpa_schedule and (
            (cp := cpa_schedule.get("critical_path"))
            or (cp := cpa_schedule.get("critical_path_task_ids"))
        ):
            lines.append(f"Critical path tasks: {', '.join(str(t) for t in cp[:5])}")

        return "\n".join(lines)

    return explanation


def synthesize_risk_alert(risk_data: dict[str, Any]) -> str:
    """
    Generate a plain-language risk alert from deterministic risk detection data.

    risk_data keys (all optional):
        overdue_tasks         (list of task titles)
        overloaded_employees  (list of {name, task_count})
        conflicts             (list of strings describing conflicts)
    """
    if not any(risk_data.get(k) for k in ("overdue_tasks", "overloaded_employees", "conflicts")):
        return "No critical risks detected at this time."

    payload = json.dumps(risk_data, indent=2)
    alert = _call_llm(_RISK_ALERT_SYSTEM, payload)
    if alert is None:
        parts = []
        if risk_data.get("overdue_tasks"):
            parts.append(f"{len(risk_data['overdue_tasks'])} task(s) are overdue.")
        if risk_data.get("overloaded_employees"):
            names = [e.get("name", "Unknown") for e in risk_data["overloaded_employees"]]
            parts.append(f"Overloaded employees: {', '.join(names)}.")
        if risk_data.get("conflicts"):
            parts.append(f"{len(risk_data['conflicts'])} scheduling conflict(s) detected.")
        return " ".join(parts)

    return alert


def synthesize_project_summary(stats: dict[str, Any]) -> str:
    """
    Phrase a project status summary from deterministic stats.

    stats keys:
        project_name, total_tasks, completed, in_progress, overdue,
        estimated_completion_date, velocity_tasks_per_day
    """
    payload = json.dumps(stats, indent=2)
    summary = _call_llm(_SUMMARY_SYSTEM, payload)
    if summary is None:
        done = stats.get("completed", 0)
        total = stats.get("total_tasks", 0)
        pct = int((done / total) * 100) if total else 0
        return (
            f"{stats.get('project_name', 'Project')} is {pct}% complete "
            f"({done}/{total} tasks). "
            f"{stats.get('in_progress', 0)} in progress, "
            f"{stats.get('overdue', 0)} overdue."
        )
    return summary


def chat_with_project_data(
    user_message: str,
    project_context: dict[str, Any],
    conversation_history: Optional[list[dict]] = None,
) -> str:
    """
    Answer a manager's natural-language question about the project,
    grounding all responses in real project_context data.

    project_context should include relevant DB-fetched data: tasks, members,
    assignments, stats — whatever the calling endpoint retrieved.

    conversation_history: list of {"role": "user"|"assistant", "content": str}
    """
    from orchestration.llm_client import get_llm

    llm = get_llm()
    if llm is None:
        return (
            "The AI project assistant is currently unavailable. "
            "Please ensure GROQ_API_KEY is set in ml-engine/.env and "
            "that your Groq daily quota has not been exceeded."
        )

    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

    context_json = json.dumps(project_context, indent=2, default=str)
    system_with_context = (
        f"{_CHATBOT_SYSTEM}\n\nProject data:\n{context_json}"
    )

    messages = [SystemMessage(content=system_with_context)]

    # Replay conversation history
    if conversation_history:
        for turn in conversation_history[-10:]:  # cap at 10 turns to stay within context
            if turn["role"] == "user":
                messages.append(HumanMessage(content=turn["content"]))
            elif turn["role"] == "assistant":
                messages.append(AIMessage(content=turn["content"]))

    messages.append(HumanMessage(content=user_message))

    try:
        response = llm.invoke(messages)
        return response.content.strip()
    except Exception as exc:
        logger.error("Chat LLM call failed: %s", exc)
        return "An error occurred while processing your request. Please try again."


def classify_chat_intent(message: str) -> dict[str, Any]:
    """
    Classify a user chat message into one of three intents:
    - 'create_task': single task specification
    - 'decompose_sprint': multi-task sprint or epic request
    - 'qa': general project question/analysis
    """
    raw = _call_llm(_INTENT_CLASSIFIER_SYSTEM, message)
    if not raw:
        return {"intent": "qa", "confidence": 1.0}

    # Extract JSON if enclosed in markdown code fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    try:
        data = json.loads(cleaned)
        intent = str(data.get("intent", "qa")).lower()
        if intent not in ("create_task", "decompose_sprint", "qa"):
            intent = "qa"
        confidence = float(data.get("confidence", 0.9))
        return {"intent": intent, "confidence": confidence}
    except Exception as exc:
        logger.warning("Failed to parse intent classification JSON: %s. Raw: %s", exc, raw)
        return {"intent": "qa", "confidence": 1.0}

