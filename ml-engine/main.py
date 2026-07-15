#!/usr/bin/env python3
"""
main.py
================================================================================
StudioSprint ML Engine — FastAPI Application

Exposes endpoints for:
  Phase 3 — Cold-Start Engine (embedding + cosine similarity ranking)
  Phase 6 — LLM Orchestration (intent parsing, sprint decomposition,
             response synthesis, risk detection, AI chatbot)

Phase 4 (GNN /best-fit) and Phase 5 (CPA /schedule) endpoints are stubs
that will be wired to the PyTorch Geometric model in a later phase.
================================================================================
"""

import asyncio
import json
import logging
import sys
from typing import Any, AsyncGenerator, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StudioSprint ML Engine",
    description="GNN, CPA, Cold-Start, and LLM orchestration for StudioSprint.",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================================================
# Health check
# ===========================================================================


@app.get("/health", tags=["system"])
def health_check():
    from orchestration.llm_client import llm_available

    return {
        "status": "ok",
        "llm_available": llm_available(),
        "version": "0.3.0",
    }


# ===========================================================================
# Phase 3 — Cold-Start Engine
# ===========================================================================


class EmployeeProfile(BaseModel):
    user_id: int
    display_name: str
    position: Optional[str] = None
    experience_years: float = 0.0
    skills: List[dict] = Field(default_factory=list)
    macro_domains: List[str] = Field(default_factory=list)


class TaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    task_classification: Optional[str] = None
    required_position: Optional[str] = None
    task_difficulty: str = "Medium"
    required_skills: List[Any] = Field(default_factory=list)
    target_macro_domains: List[Any] = Field(default_factory=list)


class ColdStartRankRequest(BaseModel):
    task: TaskInput
    employee_profiles: List[EmployeeProfile]


@app.post("/api/cold-start/rank", tags=["cold-start"])
def cold_start_rank(request: ColdStartRankRequest):
    """
    Rank employees for a task using text-embedding cosine similarity.
    Used when no GNN model is trained yet for the studio.
    Returns ranked candidates with match_source='cold_start_baseline'.
    """
    try:
        from orchestration.cold_start import cold_start_rank_employees

        task_dict = request.task.model_dump()
        profiles = [p.model_dump() for p in request.employee_profiles]
        ranked = cold_start_rank_employees(task_dict, profiles)
        return {"status": "success", "match_source": "cold_start_baseline", "results": ranked}
    except Exception as exc:
        logger.exception("Cold-start ranking failed")
        raise HTTPException(status_code=500, detail=str(exc))


class EmbedRequest(BaseModel):
    text: str


@app.post("/api/embed", tags=["cold-start"])
def embed_text(request: EmbedRequest):
    """Return the 384-dim embedding vector for a text string."""
    try:
        from orchestration.embedding_service import EmbeddingService

        svc = EmbeddingService()
        vector = svc.embed(request.text)
        return {"vector": vector, "dimensions": len(vector)}
    except Exception as exc:
        logger.exception("Embedding failed")
        raise HTTPException(status_code=500, detail=str(exc))


class GNNBestFitRequest(BaseModel):
    task: TaskInput
    employee_profiles: List[EmployeeProfile] = Field(default_factory=list)


@app.post("/api/best-fit", tags=["gnn"])
def best_fit(request: GNNBestFitRequest):
    """
    Returns ranked candidates using the trained GNN model.
    """
    try:
        from orchestration.gnn import gnn_rank_employees

        task_dict = request.task.model_dump()
        profiles = [p.model_dump() for p in request.employee_profiles]
        ranked = gnn_rank_employees(task_dict, employee_profiles=profiles)
        return {"status": "success", "match_source": "gnn", "results": ranked}
    except Exception as exc:
        logger.exception("GNN ranking failed")
        raise HTTPException(status_code=500, detail=str(exc))



# ===========================================================================
# Phase 5 — CPA /schedule
# ===========================================================================


class TaskScheduleInput(BaseModel):
    id: Any = Field(description="Task identifier (int or string)")
    estimated_hours: float = Field(ge=0, description="Task duration in hours")
    depends_on: List[Any] = Field(
        default_factory=list, description="List of predecessor task IDs"
    )
    hard_constraint_hours: Optional[float] = Field(
        default=None, description="Optional hard constraint offset in hours from project start"
    )


class AssignmentInput(BaseModel):
    task_id: Any = Field(description="Task identifier")
    employee_user_id: Any = Field(description="Employee user identifier")


class ComputeScheduleRequest(BaseModel):
    tasks: List[TaskScheduleInput] = Field(description="All tasks in the project")
    deadline_hours: Optional[float] = Field(default=None, description="Project deadline in working hours")


class ValidateAssignmentsRequest(BaseModel):
    tasks: List[TaskScheduleInput] = Field(description="All tasks in the project")
    assignments: List[AssignmentInput] = Field(
        description="Proposed or existing assignments to validate"
    )


@app.post("/api/schedule/compute", tags=["cpa"])
def schedule_compute(request: ComputeScheduleRequest):
    """
    Critical Path Algorithm — forward/backward pass.

    Returns per-task ES, EF, LS, LF, total_float, is_critical and
    the list of critical_path_task_ids.
    """
    try:
        from orchestration.cpa import CPAEngine

        engine = CPAEngine()
        task_dicts = [t.model_dump() for t in request.tasks]
        result = engine.compute(task_dicts, request.deadline_hours)
        return {"status": "success", **result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("CPA compute failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/schedule/validate-assignments", tags=["cpa"])
def schedule_validate(request: ValidateAssignmentsRequest):
    """
    CPA guardrail: validate proposed assignments against critical-path constraints.

    Checks:
    - No double-booking of the same employee across overlapping critical-path tasks.
    - No predecessor-order violations (task starts before its predecessor finishes).
    """
    try:
        from orchestration.cpa import CPAEngine

        engine = CPAEngine()
        task_dicts = [t.model_dump() for t in request.tasks]
        asgn_dicts = [a.model_dump() for a in request.assignments]
        result = engine.validate_assignments(task_dicts, asgn_dicts)
        return {"status": "success", **result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("CPA validate-assignments failed")
        raise HTTPException(status_code=500, detail=str(exc))



# ===========================================================================
# Phase 6 — LLM Orchestration
# ===========================================================================


class ParseTaskRequest(BaseModel):
    text: str = Field(description="Free-text task description from the manager")


@app.post("/api/llm/parse-task", tags=["llm"])
def parse_task(request: ParseTaskRequest):
    """
    Semantic Intent Parser: free-text → structured TaskParseResult.
    Returns a stub with only the title if LLM is unavailable.
    """
    try:
        from orchestration.intent_parser import parse_task_from_text

        result = parse_task_from_text(request.text)
        return {"status": "success", "task": result.model_dump()}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Task parse endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc))


class DecomposeProjectRequest(BaseModel):
    description: str = Field(description="Full project description to decompose into tasks")


@app.post("/api/llm/decompose-project", tags=["llm"])
def decompose_project(request: DecomposeProjectRequest):
    """
    Sprint Plan Generator: project description → list of structured tasks
    with suggested dependencies. Returns empty list if LLM unavailable.
    """
    try:
        from orchestration.intent_parser import decompose_project_into_tasks

        tasks = decompose_project_into_tasks(request.description)
        return {"status": "success", "tasks": tasks, "count": len(tasks)}
    except Exception as exc:
        logger.exception("Project decomposition endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/llm/decompose-project/stream", tags=["llm"])
async def decompose_project_stream(request: DecomposeProjectRequest):
    """
    SSE streaming endpoint for sprint decomposition.
    Sends progress events while the LLM is running, then emits the final
    task list as a 'done' event. The React frontend uses EventSource
    (or a POST-based fetch with ReadableStream) to read these live.
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        def _sse(event: str, data: dict) -> str:
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"

        try:
            from orchestration.intent_parser import decompose_project_into_tasks

            # ---- Stage 1: intent analysis ----
            yield _sse("progress", {"stage": "intent", "message": "Analysing project description...", "pct": 10})
            await asyncio.sleep(0)  # yield control so response headers flush

            # ---- Stage 2: LLM running (blocking in executor so event loop stays live) ----
            yield _sse("progress", {"stage": "llm", "message": "AI is generating tasks — this may take a minute...", "pct": 30})
            await asyncio.sleep(0)

            loop = asyncio.get_running_loop()
            work = loop.run_in_executor(None, decompose_project_into_tasks, request.description)
            elapsed_seconds = 0.0
            # The LLM does not expose token-level progress. Emit a smooth,
            # bounded heartbeat while its background work is genuinely running.
            while not work.done():
                await asyncio.sleep(0.4)
                elapsed_seconds += 0.4
                pct = min(84, 30 + int(55 * (1 - 1 / (1 + elapsed_seconds / 12))))
                yield _sse("progress", {"stage": "llm", "message": "AI is generating tasks — still working...", "pct": pct})
            tasks = await work

            # ---- Stage 3: validation ----
            yield _sse("progress", {"stage": "validate", "message": f"Validating {len(tasks)} generated tasks...", "pct": 90})
            await asyncio.sleep(0)

            # ---- Done ----
            yield _sse("done", {"status": "success", "tasks": tasks, "count": len(tasks)})

        except Exception as exc:
            logger.exception("SSE decompose stream failed")
            yield _sse("error", {"message": str(exc)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


class SynthesizeAssignmentRequest(BaseModel):
    gnn_results: List[dict] = Field(description="Ranked candidates from GNN or cold-start")
    cpa_schedule: Optional[dict] = None
    task: Optional[dict] = None


@app.post("/api/llm/synthesize-assignment", tags=["llm"])
def synthesize_assignment(request: SynthesizeAssignmentRequest):
    """
    Response Synthesizer: translate GNN results + CPA schedule into a
    plain-language manager-facing explanation.
    """
    try:
        from orchestration.response_synthesizer import synthesize_assignment_explanation

        explanation = synthesize_assignment_explanation(
            request.gnn_results, request.cpa_schedule, request.task
        )
        return {"status": "success", "explanation": explanation}
    except Exception as exc:
        logger.exception("Assignment synthesis endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc))


class RiskScanRequest(BaseModel):
    tasks: List[dict]
    assignments: List[dict]
    critical_path_task_ids: Optional[List[int]] = None


@app.post("/api/llm/risk-scan", tags=["llm"])
def risk_scan(request: RiskScanRequest):
    """
    AI Risk Detection: deterministic scan + LLM-phrased explanation.
    Works even without Ollama (deterministic part still runs).
    """
    try:
        from orchestration.risk_detector import detect_and_explain_risks

        result = detect_and_explain_risks(
            request.tasks,
            request.assignments,
            request.critical_path_task_ids,
        )
        return {"status": "success", **result}
    except Exception as exc:
        logger.exception("Risk scan endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc))


class ProjectSummaryRequest(BaseModel):
    stats: dict = Field(description="Project stats: project_name, total_tasks, completed, etc.")


@app.post("/api/llm/project-summary", tags=["llm"])
def project_summary(request: ProjectSummaryRequest):
    """AI Project Summary: plain-language status update from computed stats."""
    try:
        from orchestration.response_synthesizer import synthesize_project_summary

        summary = synthesize_project_summary(request.stats)
        return {"status": "success", "summary": summary}
    except Exception as exc:
        logger.exception("Project summary endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc))


class ChatRequest(BaseModel):
    message: str
    project_context: dict = Field(default_factory=dict)
    conversation_history: Optional[List[dict]] = None


@app.post("/api/llm/chat", tags=["llm"])
def chat(request: ChatRequest):
    """
    AI Project Assistant chatbot: natural-language Q&A grounded in real
    project data. Returns offline message if Ollama is not running.
    """
    try:
        from orchestration.response_synthesizer import chat_with_project_data

        reply = chat_with_project_data(
            request.message,
            request.project_context,
            request.conversation_history,
        )
        return {"status": "success", "reply": reply}
    except Exception as exc:
        logger.exception("Chat endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/llm/chat-with-intent", tags=["llm"])
def chat_with_intent(request: ChatRequest):
    """
    Agentic AI Assistant endpoint:
    Classifies intent (qa vs create_task vs decompose_sprint).
    - If qa: returns reply grounded in project data (`action_payload: None`).
    - If create_task: parses single task via semantic intent parser (`action_payload: task_dict`, `reply: confirmation text`).
    - If decompose_sprint: returns prompt (`action_payload: {"prompt": request.message}`, `reply: confirmation text`).
    """
    try:
        from orchestration.response_synthesizer import classify_chat_intent, chat_with_project_data
        from orchestration.intent_parser import parse_task_from_text

        classification = classify_chat_intent(request.message)
        intent = classification.get("intent", "qa")
        confidence = classification.get("confidence", 1.0)

        if intent == "create_task":
            task_result = parse_task_from_text(request.message)
            return {
                "status": "success",
                "intent": "create_task",
                "confidence": confidence,
                "reply": "I've parsed your task specifications. Here's what I'll create — please review and confirm:",
                "action_payload": task_result.model_dump(),
            }
        elif intent == "decompose_sprint":
            return {
                "status": "success",
                "intent": "decompose_sprint",
                "confidence": confidence,
                "reply": "I've detected a request to plan and decompose multiple tasks for a sprint or feature. I can launch our AI Sprint Decomposer to generate draft task cards, assign team members via GNN, and compute the dynamic CPA timeline:",
                "action_payload": {"prompt": request.message},
            }
        else:
            reply = chat_with_project_data(
                request.message,
                request.project_context,
                request.conversation_history,
            )
            return {
                "status": "success",
                "intent": "qa",
                "confidence": confidence,
                "reply": reply,
                "action_payload": None,
            }
    except Exception as exc:
        logger.exception("Chat with intent endpoint failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ===========================================================================
# Legacy Phase 0 stub — kept for backward compatibility
# ===========================================================================


class LegacyScheduleRequest(BaseModel):
    studio_id: str
    tasks: list
    employees: list


@app.post("/api/optimize", tags=["legacy"])
async def optimize_schedule(data: LegacyScheduleRequest):
    """
    Legacy endpoint. Use /api/best-fit + /api/schedule/compute instead.
    TODO Phase 4+5: wire to GNN + CPA pipeline.
    """
    return {
        "status": "stub",
        "message": "Use /api/best-fit and /api/schedule/compute for the new pipeline.",
        "optimized_schedule": [],
    }
