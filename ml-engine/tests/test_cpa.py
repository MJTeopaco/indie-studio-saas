"""
test_cpa.py
================================================================================
Unit tests for the Critical Path Algorithm (CPA) engine.

All expected values in this file are computed by hand so that test failures
immediately reveal regressions in the CPM logic.

Graph used across most tests (mirror of TenantSeeder DAG, simplified to 6 tasks
for speed):

    T1(8h) ──► T4(4h) ──► T7(12h)
    T2(12h) ──► T5(8h) ──► T7(12h)
    T3(6h) ──────────────────────► T7(12h)

    Critical path: T2 → T5 → T7 = 12 + 8 + 12 = 32h

Full seeder graph test uses the complete 15-task topology to verify the
known critical path T2→T6→T9→T12→T14→T15 = 12+8+4+20+8+4 = 56h.
================================================================================
"""

from __future__ import annotations

import sys
import os

# Ensure the ml-engine root is on sys.path so "orchestration.cpa" resolves
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from orchestration.cpa import CPAEngine


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def engine() -> CPAEngine:
    return CPAEngine()


@pytest.fixture
def simple_graph() -> list[dict]:
    """
    3-source, 1-merge graph (6 tasks):

        T1(8h) ──► T4(4h) ──┐
        T2(12h) ──► T5(8h) ──► T7(12h)
        T3(6h) ──────────────┘

    Hand-computed schedules:
        T1: ES=0  EF=8   LS=12  LF=20  TF=12  not critical
        T2: ES=0  EF=12  LS=0   LF=12  TF=0   CRITICAL
        T3: ES=0  EF=6   LS=14  LF=20  TF=14  not critical
        T4: ES=8  EF=12  LS=20  LF=24  TF=12  not critical (waits for T2→T5 chain)
            Wait — T7 depends on T4,T5,T3 so LF_T4 = LS_T7 = 20
            T4: ES=8, EF=12, LS=20-4=16, LF=20, TF=8  not critical
        T5: ES=12 EF=20  LS=12  LF=20  TF=0   CRITICAL
        T7: ES=20 EF=32  LS=20  LF=32  TF=0   CRITICAL

    project_finish = 32h
    critical_path_task_ids = [T2, T5, T7] (ordered by topo sort)
    """
    return [
        {"id": "T1", "estimated_hours": 8,  "depends_on": []},
        {"id": "T2", "estimated_hours": 12, "depends_on": []},
        {"id": "T3", "estimated_hours": 6,  "depends_on": []},
        {"id": "T4", "estimated_hours": 4,  "depends_on": ["T1"]},
        {"id": "T5", "estimated_hours": 8,  "depends_on": ["T2"]},
        {"id": "T7", "estimated_hours": 12, "depends_on": ["T4", "T5", "T3"]},
    ]


@pytest.fixture
def full_seeder_graph() -> list[dict]:
    """
    The full 15-task seeder graph.  Known critical path:
      T2→T6→T9→T12→T14→T15 = 12+8+4+20+8+4 = 56h
    """
    return [
        {"id": 1,  "estimated_hours": 8,  "depends_on": []},
        {"id": 2,  "estimated_hours": 12, "depends_on": []},
        {"id": 3,  "estimated_hours": 6,  "depends_on": []},
        {"id": 4,  "estimated_hours": 4,  "depends_on": [1]},
        {"id": 5,  "estimated_hours": 16, "depends_on": [1]},
        {"id": 6,  "estimated_hours": 8,  "depends_on": [2]},
        {"id": 7,  "estimated_hours": 12, "depends_on": [4]},
        {"id": 8,  "estimated_hours": 8,  "depends_on": [5]},
        {"id": 9,  "estimated_hours": 4,  "depends_on": [6]},
        {"id": 10, "estimated_hours": 8,  "depends_on": [7]},
        {"id": 11, "estimated_hours": 6,  "depends_on": [8]},
        {"id": 12, "estimated_hours": 20, "depends_on": [9]},
        {"id": 13, "estimated_hours": 4,  "depends_on": [10, 11]},
        {"id": 14, "estimated_hours": 8,  "depends_on": [12]},
        {"id": 15, "estimated_hours": 4,  "depends_on": [13, 14, 3]},
    ]


# ---------------------------------------------------------------------------
# Forward / backward pass — simple graph
# ---------------------------------------------------------------------------


class TestForwardBackwardPass:
    def test_project_finish_is_32h(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        assert result["project_finish"] == 32.0, (
            f"Expected project_finish=32h, got {result['project_finish']}"
        )
        assert result["schedule_unit"] == "working_hours"
        assert result["project_finish_workdays"] == 4.0

    def test_t2_is_critical(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        sched = result["tasks"]
        assert sched["T2"]["is_critical"], "T2 must be on the critical path (TF=0)"
        assert sched["T2"]["es"] == 0.0
        assert sched["T2"]["ef"] == 12.0
        assert sched["T2"]["total_float"] == 0.0

    def test_t5_is_critical(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        sched = result["tasks"]
        assert sched["T5"]["is_critical"], "T5 must be on the critical path (TF=0)"
        assert sched["T5"]["es"] == 12.0
        assert sched["T5"]["ef"] == 20.0

    def test_t7_is_critical(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        sched = result["tasks"]
        assert sched["T7"]["is_critical"], "T7 must be on the critical path (TF=0)"
        assert sched["T7"]["es"] == 20.0
        assert sched["T7"]["ef"] == 32.0

    def test_t1_not_critical_has_positive_float(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        sched = result["tasks"]
        assert not sched["T1"]["is_critical"], "T1 is NOT on the critical path"
        assert sched["T1"]["total_float"] > 0

    def test_t3_not_critical_has_positive_float(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        sched = result["tasks"]
        assert not sched["T3"]["is_critical"], "T3 is NOT on the critical path"
        assert sched["T3"]["total_float"] > 0

    def test_t4_not_critical(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        sched = result["tasks"]
        assert not sched["T4"]["is_critical"], "T4 is NOT on the critical path"

    def test_critical_path_ids_contains_t2_t5_t7(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        cp = set(result["critical_path_task_ids"])
        assert {"T2", "T5", "T7"}.issubset(cp), (
            f"Expected T2, T5, T7 in critical path, got: {cp}"
        )

    def test_source_tasks_have_zero_es(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        for task_id in ["T1", "T2", "T3"]:
            assert result["tasks"][task_id]["es"] == 0.0

    def test_total_float_equals_ls_minus_es(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        for tid, sched in result["tasks"].items():
            expected_tf = round(sched["ls"] - sched["es"], 6)
            assert abs(sched["total_float"] - expected_tf) < 1e-5, (
                f"TF mismatch for {tid}: {sched['total_float']} != {expected_tf}"
            )

    def test_total_float_equals_lf_minus_ef(self, engine, simple_graph):
        result = engine.compute(simple_graph)
        for tid, sched in result["tasks"].items():
            expected_tf = round(sched["lf"] - sched["ef"], 6)
            assert abs(sched["total_float"] - expected_tf) < 1e-5, (
                f"TF(lf-ef) mismatch for {tid}: {sched['total_float']} != {expected_tf}"
            )


# ---------------------------------------------------------------------------
# Full 15-task seeder graph
# ---------------------------------------------------------------------------


class TestFullSeederGraph:
    def test_project_finish_is_56h(self, engine, full_seeder_graph):
        result = engine.compute(full_seeder_graph)
        assert result["project_finish"] == 56.0, (
            f"Expected project_finish=56h, got {result['project_finish']}"
        )

    def test_critical_path_is_t2_t6_t9_t12_t14_t15(self, engine, full_seeder_graph):
        result = engine.compute(full_seeder_graph)
        cp = set(result["critical_path_task_ids"])
        expected_cp = {2, 6, 9, 12, 14, 15}
        assert expected_cp == cp, (
            f"Critical path mismatch.\nExpected: {expected_cp}\nGot:      {cp}"
        )

    def test_non_critical_tasks_have_positive_float(self, engine, full_seeder_graph):
        result = engine.compute(full_seeder_graph)
        non_critical_expected = {1, 3, 4, 5, 7, 8, 10, 11, 13}
        for tid in non_critical_expected:
            sched = result["tasks"][tid]
            assert sched["total_float"] > 0, (
                f"Task {tid} should NOT be critical (TF should be > 0, got {sched['total_float']})"
            )


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


class TestEdgeCases:
    def test_empty_graph_returns_zero_finish(self, engine):
        result = engine.compute([])
        assert result["project_finish"] == 0.0
        assert result["critical_path_task_ids"] == []
        assert result["tasks"] == {}

    def test_single_task_is_critical(self, engine):
        tasks = [{"id": 1, "estimated_hours": 10, "depends_on": []}]
        result = engine.compute(tasks)
        assert result["project_finish"] == 10.0
        assert result["tasks"][1]["is_critical"]

    def test_linear_chain_all_critical(self, engine):
        """A → B → C must all have TF=0."""
        tasks = [
            {"id": "A", "estimated_hours": 5,  "depends_on": []},
            {"id": "B", "estimated_hours": 10, "depends_on": ["A"]},
            {"id": "C", "estimated_hours": 3,  "depends_on": ["B"]},
        ]
        result = engine.compute(tasks)
        assert result["project_finish"] == 18.0
        for tid in ["A", "B", "C"]:
            assert result["tasks"][tid]["is_critical"], f"{tid} must be critical"

    def test_cycle_raises_value_error(self, engine):
        """A → B → C → A is a cycle and must raise ValueError."""
        tasks = [
            {"id": "A", "estimated_hours": 5,  "depends_on": ["C"]},
            {"id": "B", "estimated_hours": 5,  "depends_on": ["A"]},
            {"id": "C", "estimated_hours": 5,  "depends_on": ["B"]},
        ]
        with pytest.raises(ValueError, match="Cycle detected"):
            engine.compute(tasks)

    def test_zero_duration_task_is_critical_if_on_cp(self, engine):
        """Milestones (0h) on the critical path should still be critical."""
        tasks = [
            {"id": "A", "estimated_hours": 10, "depends_on": []},
            {"id": "M", "estimated_hours": 0,  "depends_on": ["A"]},  # milestone
            {"id": "B", "estimated_hours": 5,  "depends_on": ["M"]},
        ]
        result = engine.compute(tasks)
        assert result["project_finish"] == 15.0
        assert result["tasks"]["M"]["is_critical"]


# ---------------------------------------------------------------------------
# Assignment validation
# ---------------------------------------------------------------------------


class TestValidateAssignments:
    def test_valid_assignments_no_violations(self, engine, simple_graph):
        # Assign different employees to each critical-path task
        assignments = [
            {"task_id": "T2", "employee_user_id": 101},
            {"task_id": "T5", "employee_user_id": 102},
            {"task_id": "T7", "employee_user_id": 103},
        ]
        result = engine.validate_assignments(simple_graph, assignments)
        assert result["valid"] is True
        assert result["violations"] == []

    def test_double_booking_on_critical_path_detected(self, engine, simple_graph):
        """
        T2 (ES=0, EF=12) and T5 (ES=12, EF=20) are SEQUENTIAL — no overlap.
        T2 (ES=0, EF=12) and T7 (ES=20, EF=32) are also non-overlapping.
        But T5 (ES=12, EF=20) and T7 (ES=20, EF=32) are adjacent, not overlapping
        ([12,20) and [20,32) share only the endpoint, not an open interval).

        To force a double-booking, give the same employee T2 and T5 — but
        since their windows don't actually overlap ([0,12) and [12,20)), we need
        a parallel critical path.  Use a simpler 2-task parallel graph:
            P1(10h) and P2(10h) both have no predecessors, both critical.
            [0,10) overlaps [0,10) — same employee → double-booking.
        """
        parallel_tasks = [
            {"id": "P1", "estimated_hours": 10, "depends_on": []},
            {"id": "P2", "estimated_hours": 10, "depends_on": []},
        ]
        assignments = [
            {"task_id": "P1", "employee_user_id": 999},
            {"task_id": "P2", "employee_user_id": 999},  # same employee, same window
        ]
        result = engine.validate_assignments(parallel_tasks, assignments)
        assert result["valid"] is False
        violation_types = [v["type"] for v in result["violations"]]
        assert "double_booking" in violation_types

    def test_non_critical_double_booking_not_flagged(self, engine, simple_graph):
        """Double-booking on NON-critical tasks should NOT be flagged."""
        # T1 and T3 are non-critical and their windows overlap ([0,8) vs [0,6))
        assignments = [
            {"task_id": "T1", "employee_user_id": 42},
            {"task_id": "T3", "employee_user_id": 42},  # same employee, both non-critical
        ]
        result = engine.validate_assignments(simple_graph, assignments)
        double_bookings = [v for v in result["violations"] if v["type"] == "double_booking"]
        assert double_bookings == [], (
            "Non-critical task double-booking should not be flagged"
        )

    def test_validate_returns_cpa_result_embedded(self, engine, simple_graph):
        result = engine.validate_assignments(simple_graph, [])
        assert "cpa_result" in result
        assert "project_finish" in result["cpa_result"]
        assert result["cpa_result"]["project_finish"] == 32.0
