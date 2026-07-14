#!/usr/bin/env python3
"""
intent_parser.py
================================================================================
Phase 6 — Semantic Intent Parser

Converts a manager's free-text project/task description into a validated
structured JSON object using the LLM + Pydantic output parsing.

CONSTRAINT: The LLM extracts field values from text. It does NOT compute
durations, fit scores, or schedule dates. All numeric computation stays in
the GNN and CPA modules.

Usage:
    from orchestration.intent_parser import parse_task_from_text
    result = parse_task_from_text("Build a REST API for user auth using FastAPI")
    # result is a TaskParseResult Pydantic model
================================================================================
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator
from orchestration.taxonomy import (
    CANONICAL_CLASSIFICATIONS,
    CANONICAL_TO_BROAD_MAP,
    CLASSIFICATION_MACRO_MAP,
    normalize_task_classification,
    enrich_task_classification,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pydantic output schema — what the LLM must produce
# ---------------------------------------------------------------------------


class SkillRequirement(BaseModel):
    name: str = Field(description="Skill name, e.g. 'FastAPI', 'React', 'Docker'")
    level: int = Field(default=3, ge=1, le=5, description="Minimum proficiency level 1-5")


class TaskParseResult(BaseModel):
    """Structured task parameters extracted from free-text by the LLM."""

    title: str = Field(description="Short task title (max 80 chars)")
    objective: str = Field(description="One-sentence description of what this task achieves")
    task_classification: str = Field(
        default="Feature Implementation",
        description="Granular category (e.g. 'Feature Implementation', 'Bug Resolution & Hotfixing', 'Container Orchestration & Deployment')",
    )
    required_position: Optional[str] = Field(
        default=None, description="Primary role needed, e.g. 'Backend Developer'"
    )
    task_difficulty: str = Field(
        default="Medium", description="Easy | Medium | Hard"
    )
    priority: str = Field(
        default="Medium", description="Low | Medium | High | Critical"
    )
    minimum_experience_years: float = Field(
        default=0.0, ge=0, description="Minimum years of experience required"
    )
    estimated_hours: float = Field(
        default=8.0, ge=0, description="Rough estimate in working hours"
    )
    required_skills: List[SkillRequirement] = Field(
        default_factory=list,
        description="Skills needed for this task"
    )
    macro_domains: List[str] = Field(
        default_factory=list,
        description="Technical domains, e.g. ['Web & API Development', 'Cloud & DevOps']"
    )

    @property
    def broad_classification(self) -> str:
        """Backward-compatible mapping to legacy 6 broad categories."""
        return CANONICAL_TO_BROAD_MAP.get(self.task_classification, "Feature")

    @property
    def macro_domain(self) -> str:
        """Macro technical domain corresponding to the task classification."""
        return CLASSIFICATION_MACRO_MAP.get(self.task_classification, "Backend & Core Systems")

    @field_validator("task_difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        allowed = {"Easy", "Medium", "Hard"}
        if v not in allowed:
            return "Medium"
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = {"Low", "Medium", "High", "Critical"}
        if v not in allowed:
            return "Medium"
        return v

    @field_validator("task_classification", mode="before")
    @classmethod
    def validate_classification(cls, v: str, values: Any = None) -> str:
        skills = []
        if isinstance(values, dict) and "required_skills" in values:
            skills = values.get("required_skills", [])
        return normalize_task_classification(str(v), skills=skills)

    @field_validator("estimated_hours")
    @classmethod
    def keep_tasks_atomic(cls, v: float) -> float:
        """Keep AI-generated tasks small enough for meaningful scheduling."""
        return min(float(v), 40.0)


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_TASK_EXTRACTION_SYSTEM = """You are a technical project management assistant.
Extract structured task parameters from the user's free-text description.
Respond ONLY with a single valid JSON object matching the schema. No markdown, no extra text.

IMPORTANT: Select required_skills 'name' strictly from canonical engineering skills such as: React, JavaScript, TypeScript, Next.js, Vue.js, Figma, Python, PyTorch, Laravel, PHP, PostgreSQL, Docker, Kubernetes, Jest, Cypress, REST APIs. Do not use generic domain descriptors like 'Dark Mode' or 'CSS'.

Select task_classification strictly from these 22 categories:
Product Requirements & Analysis, Sprint & Roadmap Planning, Market Viability Research, Data Pre-processing & Pipeline Engineering, Model Training & Fine-Tuning, LLM Prompt Engineering & RAG Integration, Algorithm Evaluation & Benchmarking, System Architecture Design, Feature Implementation, Algorithm Optimization & Refactoring, Bug Resolution & Hotfixing, Third-Party API Setup, Client-Based Environment Provisioning, Container Orchestration & Deployment, DevSecOps & Security Auditing, Hardware-in-the-Loop Testing, Hardware Sensor Integration, Game Engine Logic & Asset Integration, UI/UX Prototyping & Wireframing, System Mechanics Planning, Unit & Integration Testing, Peer Code Review.

JSON Schema:
{
  "title": string (max 80 chars),
  "objective": string (one sentence),
  "task_classification": string (one of the 22 categories listed above),
  "required_position": string or null,
  "task_difficulty": "Easy" | "Medium" | "Hard",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "minimum_experience_years": number,
  "estimated_hours": number,
  "required_skills": [{"name": string, "level": 1-5}, ...],
  "macro_domains": [string, ...]
}"""

_SPRINT_DECOMPOSE_SYSTEM = """You are a senior engineering lead decomposing a project into tasks.
Given a project description or task instruction:
1. Evaluate if it is a simple, single task (e.g. "update logo", "fix button color"). If so, return a JSON array containing ONLY that single task.
2. If it is a heavy project/sprint goal, decompose it into a list of concrete development tasks (maximum of 5 most important high-level tasks to save time).

Estimate focused implementation effort, not calendar time. Use modern AI-assisted
workflows when appropriate. If the user mentions a date, treat it
as the overall delivery deadline, never as the duration of an individual task.

IMPORTANT: Select required_skills 'name' strictly from canonical engineering skills such as: React, JavaScript, TypeScript, Next.js, Vue.js, Figma, Python, PyTorch, Laravel, PHP, PostgreSQL, Docker, Kubernetes, Jest, Cypress, REST APIs. Do not use generic domain descriptors like 'Dark Mode' or 'CSS'.

Select task_classification strictly from these 22 categories:
Product Requirements & Analysis, Sprint & Roadmap Planning, Market Viability Research, Data Pre-processing & Pipeline Engineering, Model Training & Fine-Tuning, LLM Prompt Engineering & RAG Integration, Algorithm Evaluation & Benchmarking, System Architecture Design, Feature Implementation, Algorithm Optimization & Refactoring, Bug Resolution & Hotfixing, Third-Party API Setup, Client-Based Environment Provisioning, Container Orchestration & Deployment, DevSecOps & Security Auditing, Hardware-in-the-Loop Testing, Hardware Sensor Integration, Game Engine Logic & Asset Integration, UI/UX Prototyping & Wireframing, System Mechanics Planning, Unit & Integration Testing, Peer Code Review.

Respond ONLY with a valid JSON array. Each element must match:
{
  "title": string,
  "objective": string,
  "task_classification": string (one of the 22 categories listed above),
  "required_position": string or null,
  "task_difficulty": "Easy"|"Medium"|"Hard",
  "priority": "Low"|"Medium"|"High"|"Critical",
  "minimum_experience_years": number,
  "estimated_hours": number,
  "required_skills": [{"name": string, "level": 1-5}],
  "macro_domains": [string],
  "suggested_depends_on": [int]
}
"suggested_depends_on" contains 0-based indices of tasks in the array that must complete first.
Do not assign developer names, durations, or specific dates — only hours estimates."""


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------


def _extract_json_from_response(text: str) -> str:
    """Strip markdown fences if the LLM wraps its JSON in ```json ... ```."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Remove first and last fence lines
        inner = [l for l in lines if not l.startswith("```")]
        text = "\n".join(inner).strip()
    return text


def _stub_task_parse(raw_text: str) -> TaskParseResult:
    """Fallback when Ollama is not available — extracts only the title."""
    logger.info("LLM unavailable — returning stub TaskParseResult for text: %s", raw_text[:80])
    return TaskParseResult(
        title=raw_text[:80].strip(),
        objective="(LLM unavailable — please fill in manually)",
        task_classification="Feature Implementation",
        task_difficulty="Medium",
        priority="Medium",
        minimum_experience_years=0.0,
        estimated_hours=8.0,
        required_skills=[],
        macro_domains=[],
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_task_from_text(raw_text: str) -> TaskParseResult:
    """
    Given a free-text task description, extract structured task parameters.
    Returns a validated TaskParseResult. Raises ValueError if the LLM
    produces malformed JSON after 2 retries.
    """
    from orchestration.llm_client import get_llm

    llm = get_llm()
    if llm is None:
        return _stub_task_parse(raw_text)

    from langchain_core.messages import HumanMessage, SystemMessage

    messages = [
        SystemMessage(content=_TASK_EXTRACTION_SYSTEM),
        HumanMessage(content=raw_text),
    ]

    last_error: Exception | None = None
    for attempt in range(1, 3):
        try:
            response = llm.invoke(messages)
            raw_json = _extract_json_from_response(response.content)
            data = json.loads(raw_json)
            return TaskParseResult(**data)
        except (json.JSONDecodeError, Exception) as exc:
            last_error = exc
            logger.warning("Task parse attempt %d failed: %s", attempt, exc)

    raise ValueError(
        f"LLM failed to produce valid task JSON after 2 attempts. Last error: {last_error}"
    )


def decompose_project_into_tasks(project_description: str) -> list[dict]:
    """
    Given a plain-language project description, ask the LLM to decompose it
    into a structured list of tasks (each matching TaskParseResult + suggested_depends_on).

    The list is validated but returned as raw dicts — callers should pass each
    through TaskParseResult(**task) before persisting.

    Returns a list of dicts (empty list if LLM is unavailable).
    """
    from orchestration.llm_client import get_llm

    llm = get_llm()
    if llm is None:
        logger.info("LLM unavailable — returning empty task decomposition.")
        return []

    from langchain_core.messages import HumanMessage, SystemMessage

    messages = [
        SystemMessage(content=_SPRINT_DECOMPOSE_SYSTEM),
        HumanMessage(content=project_description),
    ]

    last_error: Exception | None = None
    for attempt in range(1, 3):
        try:
            response = llm.invoke(messages)
            raw_json = _extract_json_from_response(response.content)
            tasks = json.loads(raw_json)
            if not isinstance(tasks, list):
                raise ValueError("LLM returned non-list JSON")
            # Validate each task
            validated = []
            for t in tasks:
                depends_on = t.pop("suggested_depends_on", [])
                parsed = TaskParseResult(**t)
                d = parsed.model_dump()
                d["suggested_depends_on"] = depends_on
                validated.append(d)
            return validated
        except Exception as exc:
            last_error = exc
            logger.warning("Sprint decompose attempt %d failed: %s", attempt, exc)

    logger.error("Sprint decomposition failed after 2 attempts: %s", last_error)
    return []
