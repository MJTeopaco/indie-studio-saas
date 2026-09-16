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
import re
from typing import Any, List, Optional

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


class EpicTaskParseResult(TaskParseResult):
    suggested_depends_on: List[int] = Field(
        default_factory=list,
        description="0-based indices of prerequisite tasks across all epics"
    )


class SprintSuggestion(BaseModel):
    name: str = Field(description="Sprint name, e.g., 'Sprint 1 — Core Infrastructure'")
    goal: str = Field(description="Sprint goal, e.g., 'Establish the data layer and auth flows'")
    epic_indices: List[int] = Field(
        default_factory=list,
        description="0-based indices into the epics array assigned to this sprint"
    )


class EpicDraft(BaseModel):
    epic_name: str = Field(description="Epic name, e.g., 'User Authentication System'")
    epic_description: str = Field(description="One-sentence scope statement for the epic")
    phase_label: str = Field(description="Phase label, e.g., 'Development', 'QA', 'Planning'")
    priority_label: str = Field(description="Priority label, e.g., 'High', 'Medium'")
    tasks: List[EpicTaskParseResult] = Field(description="Tasks belonging to this epic")


class HierarchicalDecomposition(BaseModel):
    epics: List[EpicDraft]
    sprint_suggestions: List[SprintSuggestion] = Field(default_factory=list)


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
1. Return ONE task only when the request is a narrowly scoped atomic change (e.g. "update logo", "fix one button color").
2. For a project, sprint, feature set, application, or implementation request, return as many concrete development tasks as the scope genuinely requires — no artificial minimum or maximum. A small focused feature may need 2-4 tasks; a full application or multi-feature sprint may need 8-15 or more. Scale the count to the work, not to a fixed target.
3. If the request mentions multiple deliverables, every deliverable must be represented by at least one task. IMPORTANT: If defining Sprint names in your own reasoning, number them starting from Sprint 1 (do not use Sprint 0).

CRITICAL REQUIREMENT FOR DEPENDENCIES (Critical Path Analysis):
You MUST establish logical, realistic inter-task dependencies using "suggested_depends_on".
Do NOT return standalone/unconnected tasks unless they are genuinely independent.
Order tasks chronologically into chained workflow phases (e.g., Requirements/Planning → Architecture/Design → Core Backend Implementation → Frontend & API Integration → QA & Integration Testing).
For each downstream task, include the 0-based array indices of its prerequisite tasks in "suggested_depends_on" (e.g., Task index 1 depends on [0], Task index 2 depends on [1], Task index 3 depends on [1, 2]).

Estimate focused implementation effort, not calendar time. Use modern AI-assisted
workflows when appropriate. If the user mentions a date, treat it
as the overall delivery deadline, never as the duration of an individual task.

IMPORTANT: Select required_skills 'name' strictly from canonical engineering skills such as: React, JavaScript, TypeScript, Next.js, Vue.js, Figma, Python, PyTorch, Laravel, PHP, PostgreSQL, Docker, Kubernetes, Jest, Cypress, REST APIs. Do not use generic domain descriptors like 'Dark Mode' or 'CSS'.

Select task_classification strictly from these 22 categories:
Product Requirements & Analysis, Sprint & Roadmap Planning, Market Viability Research, Data Pre-processing & Pipeline Engineering, Model Training & Fine-Tuning, LLM Prompt Engineering & RAG Integration, Algorithm Evaluation & Benchmarking, System Architecture Design, Feature Implementation, Algorithm Optimization & Refactoring, Bug Resolution & Hotfixing, Third-Party API Setup, Client-Based Environment Provisioning, Container Orchestration & Deployment, DevSecOps & Security Auditing, Hardware-in-the-Loop Testing, Hardware Sensor Integration, Game Engine Logic & Asset Integration, UI/UX Prototyping & Wireframing, System Mechanics Planning, Unit & Integration Testing, Peer Code Review.

Respond ONLY with a valid JSON object containing a single key "tasks" which is an array. Each element in the "tasks" array must match:
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


_HIERARCHICAL_DECOMPOSE_SYSTEM = """You are a senior engineering lead decomposing a project into tasks.
Given a project description or task instruction:
1. Group related tasks into logical Epics. A project should typically have at least 2-4 Epics, but use as many as genuinely needed.
2. For each Epic, define concrete development tasks as the scope genuinely requires — no artificial minimum or maximum. A small focused Epic may need 2-4 tasks; a complex one may need 8-15 or more.
3. If the request mentions multiple deliverables, every deliverable must be represented by at least one task.
4. Propose sprint batching by grouping epics into Sprint Suggestions. Group epics that have strong affinity or sequential dependency into the same sprint. Use 0-based indices into the epics array to assign them to sprints. IMPORTANT: Name sprints starting from Sprint 1 (do not use Sprint 0).

CRITICAL REQUIREMENT FOR DEPENDENCIES (Critical Path Analysis):
You MUST establish logical, realistic inter-task dependencies using "suggested_depends_on".
Do NOT return standalone/unconnected tasks unless they are genuinely independent.
Order tasks chronologically into chained workflow phases.
For each downstream task, include the 0-based indices of its prerequisite tasks in "suggested_depends_on". 
IMPORTANT: The "suggested_depends_on" indices must refer to the 0-based index of the prerequisite task across ALL tasks in the entire project, AS IF ALL TASKS WERE FLATTENED into a single array (e.g., if Epic 1 has 3 tasks, their flattened indices are 0,1,2. If Epic 2 has 2 tasks, their indices are 3,4. If task index 3 depends on task index 2, put 2).

Estimate focused implementation effort, not calendar time. Use modern AI-assisted
workflows when appropriate. If the user mentions a date, treat it
as the overall delivery deadline, never as the duration of an individual task.

IMPORTANT: Select required_skills 'name' strictly from canonical engineering skills such as: React, JavaScript, TypeScript, Next.js, Vue.js, Figma, Python, PyTorch, Laravel, PHP, PostgreSQL, Docker, Kubernetes, Jest, Cypress, REST APIs. Do not use generic domain descriptors like 'Dark Mode' or 'CSS'.

Select task_classification strictly from these 22 categories:
Product Requirements & Analysis, Sprint & Roadmap Planning, Market Viability Research, Data Pre-processing & Pipeline Engineering, Model Training & Fine-Tuning, LLM Prompt Engineering & RAG Integration, Algorithm Evaluation & Benchmarking, System Architecture Design, Feature Implementation, Algorithm Optimization & Refactoring, Bug Resolution & Hotfixing, Third-Party API Setup, Client-Based Environment Provisioning, Container Orchestration & Deployment, DevSecOps & Security Auditing, Hardware-in-the-Loop Testing, Hardware Sensor Integration, Game Engine Logic & Asset Integration, UI/UX Prototyping & Wireframing, System Mechanics Planning, Unit & Integration Testing, Peer Code Review.

Respond ONLY with a valid JSON object matching this schema:
{
  "epics": [
    {
      "epic_name": string,
      "epic_description": string,
      "phase_label": string (e.g., "Development", "QA", "Planning"),
      "priority_label": string (e.g., "High", "Medium"),
      "tasks": [
        {
          "title": string,
          "objective": string,
          "task_classification": string,
          "required_position": string or null,
          "task_difficulty": "Easy"|"Medium"|"Hard",
          "priority": "Low"|"Medium"|"High"|"Critical",
          "minimum_experience_years": number,
          "estimated_hours": number,
          "required_skills": [{"name": string, "level": 1-5}],
          "macro_domains": [string],
          "suggested_depends_on": [int]
        }
      ]
    }
  ],
  "sprint_suggestions": [
    {
      "name": string,
      "goal": string,
      "epic_indices": [int]
    }
  ]
}"""


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------


def _extract_json_from_response(text: str) -> str:
    """Extract clean JSON object/array string from LLM response text."""
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        for part in parts[1::2]:
            lines = part.strip().splitlines()
            if lines and lines[0].strip().lower() in ("json", "js", "python"):
                lines = lines[1:]
            candidate = "\n".join(lines).strip()
            if candidate.startswith("[") or candidate.startswith("{"):
                text = candidate
                break
        else:
            for part in parts[1::2]:
                lines = part.strip().splitlines()
                if lines and lines[0].strip().lower() in ("json", "js", "python"):
                    lines = lines[1:]
                text = "\n".join(lines).strip()
                break

    first_bracket = text.find("[")
    first_brace = text.find("{")
    if first_bracket != -1 and (first_brace == -1 or first_bracket < first_brace):
        last_bracket = text.rfind("]")
        if last_bracket != -1 and last_bracket > first_bracket:
            text = text[first_bracket:last_bracket + 1]
    elif first_brace != -1:
        last_brace = text.rfind("}")
        if last_brace != -1 and last_brace > first_brace:
            text = text[first_brace:last_brace + 1]

    # Clean trailing commas right before ] or }
    text = re.sub(r',\s*([\]}])', r'\1', text)
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

    llm = get_llm(json_mode=True)
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
            if attempt == 1:
                messages.append(HumanMessage(content=f"Your previous output failed validation/parsing ({exc}). Respond STRICTLY with a single valid JSON object matching the schema only. No trailing commas or markdown notes."))

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
            parsed_data = json.loads(raw_json)
            
            if isinstance(parsed_data, dict) and "tasks" in parsed_data:
                tasks = parsed_data["tasks"]
            else:
                tasks = parsed_data
                
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
            # A project-level request should not silently collapse into a single
            # card. Ask once more with an explicit correction when it does.
            project_signals = ("project", "sprint", "app", "application", "website", "system", "platform", "feature", "build", "develop", "implement", "create", "plan")
            is_complex_request = len(project_description.split()) >= 8 and any(signal in project_description.lower() for signal in project_signals)
            if len(validated) == 1 and is_complex_request:
                if attempt == 1:
                    messages.append(HumanMessage(content="Your previous answer had only one task. This request covers multiple concerns; return as many tasks as genuinely needed, with dependency chains."))
                    continue
            return validated
        except Exception as exc:
            last_error = exc
            logger.warning("Sprint decompose attempt %d failed: %s", attempt, exc)
            if attempt == 1:
                messages.append(HumanMessage(content=f"Your previous output failed validation/parsing ({exc}). Respond STRICTLY with a single valid JSON array of tasks matching the schema. Ensure no trailing commas and no truncation."))

    raise ValueError(f"Sprint decomposition failed after 2 attempts: {last_error}")


def decompose_project_hierarchically(project_description: str) -> dict:
    """
    Given a plain-language project description, ask the LLM to decompose it
    into a structured hierarchy of Epics -> Tasks and Sprint Suggestions.
    """
    from orchestration.llm_client import get_llm
    from langchain_core.messages import HumanMessage, SystemMessage

    llm = get_llm(json_mode=True)
    if llm is None:
        logger.info("LLM unavailable — returning empty task list.")
        return {"epics": [], "sprint_suggestions": []}

    messages = [
        SystemMessage(content=_HIERARCHICAL_DECOMPOSE_SYSTEM),
        HumanMessage(content=project_description),
    ]

    last_error: Exception | None = None
    for attempt in range(1, 3):
        try:
            response = llm.invoke(messages)
            raw_json = _extract_json_from_response(response.content)
            parsed_data = json.loads(raw_json)
            
            validated = HierarchicalDecomposition(**parsed_data)
            return validated.model_dump()
        except Exception as exc:
            last_error = exc
            logger.warning("Hierarchical decompose attempt %d failed: %s", attempt, exc)
            if attempt == 1:
                messages.append(HumanMessage(content=f"Your previous output failed validation/parsing ({exc}). Respond STRICTLY with a single valid JSON object matching the schema. Ensure no trailing commas and no truncation."))

    raise ValueError(f"Hierarchical decomposition failed after 2 attempts: {last_error}")

# ---------------------------------------------------------------------------
# Routing / Intent Parsing
# ---------------------------------------------------------------------------

class SemanticIntent(BaseModel):
    intent: str = Field(description="One of: CREATE_TASK, NEW_PROJECT, or GENERAL_CHAT")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")

_ROUTING_SYSTEM = """
Categorize the following user input into one of three intents:
1. CREATE_TASK: The user wants to break down a feature into tasks, plan a sprint, or create tasks.
2. NEW_PROJECT: The user wants to start, build, or create a completely new project.
3. GENERAL_CHAT: The user is asking a general question, querying the database, or just chatting.

Output strictly in JSON format matching this schema:
{ "intent": "CREATE_TASK", "confidence": 0.95 }
"""

def parse_semantic_intent(raw_text: str) -> SemanticIntent:
    """
    Categorize user input into an actionable routing intent.
    Used by the frontend to decide which AI modal to open.
    """
    from orchestration.llm_client import get_llm
    from langchain_core.messages import HumanMessage, SystemMessage

    llm = get_llm(json_mode=True)
    if llm is None:
        return SemanticIntent(intent="GENERAL_CHAT", confidence=0.0)

    messages = [
        SystemMessage(content=_ROUTING_SYSTEM),
        HumanMessage(content=raw_text),
    ]
    
    try:
        response = llm.invoke(messages)
        raw_json = _extract_json_from_response(response.content)
        data = json.loads(raw_json)
        return SemanticIntent(**data)
    except Exception as exc:
        logger.warning("Semantic intent parse failed: %s", exc)
        return SemanticIntent(intent="GENERAL_CHAT", confidence=0.0)

