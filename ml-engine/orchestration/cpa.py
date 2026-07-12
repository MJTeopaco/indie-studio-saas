#!/usr/bin/env python3
"""
cpa.py
================================================================================
Critical Path Algorithm (CPA) — StudioSprint ML Engine

Implements the classic project-scheduling CPM (Critical Path Method):

  Forward Pass
  ─────────────
  ES_i = 0                                   if task i has no predecessors
  ES_i = max(EF_j for all j in pred(i))     otherwise
  EF_i = ES_i + duration_i

  Backward Pass  (anchored at project_finish = max(EF_i))
  ─────────────
  LF_i = project_finish                      if task i has no successors
  LF_i = min(LS_j for all j in succ(i))     otherwise
  LS_i = LF_i - duration_i

  Slack / Total Float
  ────────────────────
  TF_i = LS_i - ES_i   (= LF_i - EF_i)

  Critical Path
  ─────────────
  TF_i == 0  →  task i is on the critical path

  Assignment Validation
  ──────────────────────
  1. Predecessor-order violation:  an assignment for task i begins before EF_j
     for any predecessor j whose own assignment overlaps in wall-clock time.
  2. Double-booking:  the same employee_user_id appears in two critical-path
     tasks whose [ES, EF) windows overlap.

CONSTRAINT: This module performs ALL numeric computation. The LLM layer must
NEVER call into this logic — it only phrases the results for humans.
================================================================================
"""

from __future__ import annotations

import logging
from collections import defaultdict, deque
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public data types (plain dicts — no Pydantic dependency here so the module
# can be unit-tested without the full FastAPI stack)
# ---------------------------------------------------------------------------

# Task dict expected by CPAEngine:
#   id            int | str
#   estimated_hours  float | int
#   depends_on    list[int | str]   predecessor task ids

# Assignment dict:
#   task_id       int | str
#   employee_user_id  int | str

# CPAResult dict returned by compute():
#   project_finish  float
#   critical_path_task_ids  list[int | str]
#   tasks  dict[id, TaskSchedule]

# TaskSchedule:
#   id, es, ef, ls, lf, total_float, is_critical


class CPAEngine:
    WORK_HOURS_PER_DAY = 8.0
    """
    Stateless computation engine.  Instantiate once; call .compute() per request.
    All methods are pure functions of their arguments — no side effects.
    """

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------

    def compute(self, tasks: list[dict[str, Any]], deadline_hours: float | None = None) -> dict[str, Any]:
        """
        Run the full CPM on a list of task dicts.

        Parameters
        ----------
        tasks : list of dicts with keys:
            id              – unique identifier (int or str)
            estimated_hours – duration in hours (float)
            depends_on      – list of predecessor ids (may be empty / absent)

        Returns
        -------
        dict with keys:
            project_finish         float  – total project duration in hours
            critical_path_task_ids list   – IDs of tasks with TF == 0
            tasks                  dict   – per-task schedule keyed by task id
                each value has: id, es, ef, ls, lf, total_float, is_critical
        """
        if not tasks:
            return {
                "project_finish": 0.0,
                "project_finish_workdays": 0.0,
                "schedule_unit": "working_hours",
                "critical_path_task_ids": [],
                "tasks": {},
            }

        # Index tasks
        task_by_id: dict[Any, dict[str, Any]] = {t["id"]: t for t in tasks}

        # Build adjacency: predecessors and successors
        predecessors: dict[Any, list[Any]] = defaultdict(list)
        successors: dict[Any, list[Any]] = defaultdict(list)
        for t in tasks:
            for pred_id in t.get("depends_on", []):
                predecessors[t["id"]].append(pred_id)
                successors[pred_id].append(t["id"])

        # Topological sort (Kahn's algorithm — detects cycles)
        topo_order = self._topological_sort(tasks, predecessors)

        # Forward pass
        es: dict[Any, float] = {}
        ef: dict[Any, float] = {}
        for task_id in topo_order:
            duration = float(task_by_id[task_id].get("estimated_hours", 0))
            if predecessors[task_id]:
                es[task_id] = max(ef[pred] for pred in predecessors[task_id])
            else:
                es[task_id] = 0.0
            ef[task_id] = es[task_id] + duration

        # Project finish / anchor
        if deadline_hours is not None:
            project_finish = float(deadline_hours)
        else:
            project_finish = max(ef.values()) if ef else 0.0

        # Backward pass (reverse topological order)
        ls: dict[Any, float] = {}
        lf: dict[Any, float] = {}
        for task_id in reversed(topo_order):
            duration = float(task_by_id[task_id].get("estimated_hours", 0))
            if successors[task_id]:
                lf[task_id] = min(ls[succ] for succ in successors[task_id])
            else:
                lf[task_id] = project_finish
            ls[task_id] = lf[task_id] - duration

        # Slack and critical path
        total_float: dict[Any, float] = {}
        critical_path_ids: list[Any] = []
        for task_id in topo_order:
            tf = round(ls[task_id] - es[task_id], 6)
            total_float[task_id] = tf
            if tf == 0.0:
                critical_path_ids.append(task_id)

        # Build per-task schedule output
        schedule: dict[Any, dict[str, Any]] = {}
        for task_id in topo_order:
            schedule[task_id] = {
                "id":           task_id,
                "es":           round(es[task_id], 4),
                "ef":           round(ef[task_id], 4),
                "ls":           round(ls[task_id], 4),
                "lf":           round(lf[task_id], 4),
                "total_float":  round(total_float[task_id], 4),
                "is_critical":  total_float[task_id] == 0.0,
            }

        return {
            "project_finish": round(project_finish, 4),
            "project_finish_workdays": round(project_finish / self.WORK_HOURS_PER_DAY, 4),
            "schedule_unit": "working_hours",
            "critical_path_task_ids": critical_path_ids,
            "tasks": schedule,
        }

    # ------------------------------------------------------------------
    # Assignment validation
    # ------------------------------------------------------------------

    def validate_assignments(
        self,
        tasks: list[dict[str, Any]],
        assignments: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Validate proposed assignments against CPA constraints.

        Parameters
        ----------
        tasks       : same format as compute()
        assignments : list of dicts with keys:
                        task_id          – int | str
                        employee_user_id – int | str

        Returns
        -------
        dict with keys:
            valid       bool
            violations  list of dicts describing each violation
            cpa_result  the full CPAResult for inspection
        """
        cpa_result = self.compute(tasks)
        cp_ids = set(cpa_result["critical_path_task_ids"])
        schedule = cpa_result["tasks"]
        violations: list[dict[str, Any]] = []

        # Build maps for quick lookup
        assignments_by_task: dict[Any, list[dict[str, Any]]] = defaultdict(list)
        assignments_by_employee: dict[Any, list[dict[str, Any]]] = defaultdict(list)
        for asgn in assignments:
            assignments_by_task[asgn["task_id"]].append(asgn)
            assignments_by_employee[asgn["employee_user_id"]].append(asgn)

        task_by_id: dict[Any, dict[str, Any]] = {t["id"]: t for t in tasks}
        predecessors: dict[Any, list[Any]] = defaultdict(list)
        for t in tasks:
            for pred_id in t.get("depends_on", []):
                predecessors[t["id"]].append(pred_id)

        # ------------------------------------------------------------------
        # Violation 1: Predecessor-order — cannot assign a task before all its
        #   predecessors have EF ≤ ES of this task. (Structural: CPA ensures
        #   ES already accounts for this, but validate explicit assignments.)
        # ------------------------------------------------------------------
        for task_id, asgns in assignments_by_task.items():
            if task_id not in schedule:
                violations.append({
                    "type":    "unknown_task",
                    "task_id": task_id,
                    "message": f"Task {task_id} not found in the task list.",
                })
                continue

            task_es = schedule[task_id]["es"]
            for pred_id in predecessors.get(task_id, []):
                if pred_id not in schedule:
                    continue
                pred_ef = schedule[pred_id]["ef"]
                if task_es < pred_ef:
                    violations.append({
                        "type":        "predecessor_order_violation",
                        "task_id":     task_id,
                        "pred_task_id": pred_id,
                        "message": (
                            f"Task {task_id} (ES={task_es}h) cannot start before "
                            f"predecessor task {pred_id} finishes (EF={pred_ef}h)."
                        ),
                    })

        # ------------------------------------------------------------------
        # Violation 2: Double-booking on critical-path tasks — same employee
        #   assigned to two CP tasks whose [ES, EF) windows overlap.
        # ------------------------------------------------------------------
        cp_assignments: list[dict[str, Any]] = [
            asgn for asgn in assignments if asgn["task_id"] in cp_ids
        ]

        # Group CP assignments by employee
        cp_by_employee: dict[Any, list[dict[str, Any]]] = defaultdict(list)
        for asgn in cp_assignments:
            cp_by_employee[asgn["employee_user_id"]].append(asgn)

        for emp_id, emp_assignments in cp_by_employee.items():
            if len(emp_assignments) < 2:
                continue
            # Check every pair for time overlap
            for i in range(len(emp_assignments)):
                for j in range(i + 1, len(emp_assignments)):
                    tid_a = emp_assignments[i]["task_id"]
                    tid_b = emp_assignments[j]["task_id"]
                    if tid_a not in schedule or tid_b not in schedule:
                        continue
                    es_a, ef_a = schedule[tid_a]["es"], schedule[tid_a]["ef"]
                    es_b, ef_b = schedule[tid_b]["es"], schedule[tid_b]["ef"]
                    # Overlap: [es_a, ef_a) ∩ [es_b, ef_b) is non-empty
                    if es_a < ef_b and es_b < ef_a:
                        violations.append({
                            "type":              "double_booking",
                            "employee_user_id":  emp_id,
                            "task_id_a":         tid_a,
                            "task_id_b":         tid_b,
                            "message": (
                                f"Employee {emp_id} is double-booked on critical-path "
                                f"tasks {tid_a} ([{es_a}h–{ef_a}h]) and "
                                f"{tid_b} ([{es_b}h–{ef_b}h]) — windows overlap."
                            ),
                        })

        return {
            "valid":      len(violations) == 0,
            "violations": violations,
            "cpa_result": cpa_result,
        }

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _topological_sort(
        self,
        tasks: list[dict[str, Any]],
        predecessors: dict[Any, list[Any]],
    ) -> list[Any]:
        """
        Kahn's algorithm.  Raises ValueError if a cycle is detected.
        Returns task IDs in dependency-respecting order (sources first).
        """
        in_degree: dict[Any, int] = {t["id"]: len(predecessors[t["id"]]) for t in tasks}
        queue: deque[Any] = deque(tid for tid, deg in in_degree.items() if deg == 0)
        all_ids = {t["id"] for t in tasks}

        # Build successor map from predecessor map
        successors: dict[Any, list[Any]] = defaultdict(list)
        for t in tasks:
            for pred_id in predecessors[t["id"]]:
                successors[pred_id].append(t["id"])

        order: list[Any] = []
        while queue:
            tid = queue.popleft()
            order.append(tid)
            for succ_id in successors[tid]:
                in_degree[succ_id] -= 1
                if in_degree[succ_id] == 0:
                    queue.append(succ_id)

        if len(order) != len(all_ids):
            raise ValueError(
                "Cycle detected in task dependency graph — CPA requires a DAG."
            )

        return order
