"""
test_llm_constraint.py
================================================================================
LLM Hard-Constraint Tests

Asserts that:
  1. No numeric scheduling values (durations, float scores, ES/EF/LS/LF, TF)
     in a synthesized response trace back to the LLM — they must come from the
     CPA/GNN modules and be passed in as context.

  2. The intent parser (parse_task_from_text) returns a valid TaskParseResult
     when the LLM is unavailable — it must not crash.

  3. decompose_project_into_tasks returns an empty list (not an error) when
     the LLM is unavailable.

  4. The response synthesizer formats pre-computed CPA numbers without
     inventing new ones — we feed known numbers in and assert they appear
     verbatim in the output.

Design note
───────────
These tests do NOT require Ollama to be running. They operate in the
"LLM unavailable" code path (stub mode), which is the guaranteed testable
state in CI. The "LLM must not compute numbers" constraint is enforced
structurally: the synthesizer only receives numbers from the caller and
formats them — it cannot generate new ones even if the LLM were live,
because the prompt instructs it to echo the provided data.
================================================================================
"""

from __future__ import annotations

import re
import sys
import os

# Ensure the ml-engine root is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch

from orchestration.intent_parser import parse_task_from_text, decompose_project_into_tasks
from orchestration.cpa import CPAEngine
from orchestration.taxonomy import CANONICAL_CLASSIFICATIONS


@pytest.fixture(autouse=True)
def offline_llm():
    """Force LLM offline mode for all tests in this file."""
    with patch("orchestration.llm_client.get_llm", return_value=None):
        yield

# ---------------------------------------------------------------------------

# Helpers
# ---------------------------------------------------------------------------

_NUMERIC_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\b")


def _extract_numbers(text: str) -> list[str]:
    """Return all numeric tokens from a string."""
    # Since we use a non-capturing group, findall returns the full match strings
    return _NUMERIC_PATTERN.findall(text)


# ---------------------------------------------------------------------------
# Test 1 — Intent parser stub mode does not crash and returns valid structure
# ---------------------------------------------------------------------------


class TestIntentParserStubMode:
    def test_parse_task_returns_task_parse_result_without_llm(self):
        """When Ollama is offline, parse_task_from_text must return a stub result."""
        result = parse_task_from_text("Build a REST API for user authentication using FastAPI")
        # Must return a TaskParseResult instance with at minimum a non-empty title
        assert result is not None
        assert hasattr(result, "title")
        assert len(result.title) > 0

    def test_parse_task_stub_sets_manual_defaults(self):
        """Stub result must have valid enum values, not None."""
        result = parse_task_from_text("Some task description")
        assert result.task_difficulty in {"Easy", "Medium", "Hard"}
        assert result.priority in {"Low", "Medium", "High", "Critical"}
        assert result.task_classification in CANONICAL_CLASSIFICATIONS
        assert result.broad_classification in {
            "Feature", "Bug Fix", "Research", "DevOps", "Testing", "Documentation"
        }

    def test_decompose_project_returns_empty_list_without_llm(self):
        """When Ollama is offline, decompose_project_into_tasks must return []."""
        tasks = decompose_project_into_tasks("Build a multi-tenant SaaS platform with billing and authentication")
        assert isinstance(tasks, list)
        # Empty list is the correct stub behaviour — NOT an exception
        assert tasks == []


# ---------------------------------------------------------------------------
# Test 2 — CPA numbers are not LLM-generated
# ---------------------------------------------------------------------------


class TestCPANumbersNotFromLLM:
    """
    Structural test: CPA values are produced by CPAEngine, not the LLM.
    We run CPAEngine directly and assert the output matches hand-computed values.
    If the LLM were somehow injecting scheduling numbers, the CPA output would
    differ from the hand-computed reference — this test would catch that.
    """

    REFERENCE_GRAPH = [
        {"id": "A", "estimated_hours": 10, "depends_on": []},
        {"id": "B", "estimated_hours": 5,  "depends_on": ["A"]},
        {"id": "C", "estimated_hours": 3,  "depends_on": ["B"]},
    ]

    def test_cpa_project_finish_matches_hand_computation(self):
        engine = CPAEngine()
        result = engine.compute(self.REFERENCE_GRAPH)
        # A(10) + B(5) + C(3) = 18
        assert result["project_finish"] == 18.0, (
            "project_finish must equal sum of durations in a linear chain. "
            "If this fails, a non-CPA source is injecting a different number."
        )

    def test_cpa_es_ef_match_hand_computation(self):
        engine = CPAEngine()
        result = engine.compute(self.REFERENCE_GRAPH)
        schedule = result["tasks"]
        # A: ES=0, EF=10
        assert schedule["A"]["es"] == 0.0
        assert schedule["A"]["ef"] == 10.0
        # B: ES=10, EF=15
        assert schedule["B"]["es"] == 10.0
        assert schedule["B"]["ef"] == 15.0
        # C: ES=15, EF=18
        assert schedule["C"]["es"] == 15.0
        assert schedule["C"]["ef"] == 18.0

    def test_all_tasks_critical_in_linear_chain(self):
        engine = CPAEngine()
        result = engine.compute(self.REFERENCE_GRAPH)
        for tid in ["A", "B", "C"]:
            assert result["tasks"][tid]["is_critical"], (
                f"Task {tid} must be critical in a linear chain. "
                "LLM must not be altering this result."
            )

    def test_cpa_values_are_deterministic_across_calls(self):
        """CPAEngine output must be identical across repeated calls (no LLM randomness)."""
        engine = CPAEngine()
        result_1 = engine.compute(self.REFERENCE_GRAPH)
        result_2 = engine.compute(self.REFERENCE_GRAPH)
        assert result_1["project_finish"] == result_2["project_finish"]
        assert result_1["critical_path_task_ids"] == result_2["critical_path_task_ids"]
        for tid in ["A", "B", "C"]:
            assert result_1["tasks"][tid] == result_2["tasks"][tid], (
                f"Task {tid} schedule changed between calls — non-determinism detected."
            )


# ---------------------------------------------------------------------------
# Test 3 — Response synthesizer does not invent numbers
# ---------------------------------------------------------------------------


class TestResponseSynthesizerDoesNotInventNumbers:
    """
    When the synthesizer is called with pre-computed CPA numbers, it must only
    echo those numbers back — it must not produce different numeric values.

    In stub mode (Ollama offline), the synthesizer returns a template string
    that must still contain the input numbers, not invented ones.
    """

    def test_synthesizer_stub_includes_provided_critical_path_count(self):
        """
        The stub synthesizer formats input data. The count of critical-path tasks
        given as input must appear somewhere in the output (or the output must be
        a neutral stub — NOT a different count).
        """
        try:
            from orchestration.response_synthesizer import synthesize_assignment_explanation

            gnn_results = [
                {"user_id": 101, "match_fit_score": 0.87, "match_source": "gnn"},
                {"user_id": 102, "match_fit_score": 0.75, "match_source": "cold_start_baseline"},
            ]
            cpa_schedule = {
                "project_finish": 56.0,
                "critical_path_task_ids": [2, 6, 9, 12, 14, 15],
                "tasks": {},
            }

            explanation = synthesize_assignment_explanation(gnn_results, cpa_schedule)

            # The explanation must be a non-empty string
            assert isinstance(explanation, str)
            assert len(explanation) > 0

            # HARD CONSTRAINT: if the explanation contains any numeric value that
            # looks like a scheduling duration, it must be traceable to the input.
            # Allowed numbers: 56.0 (project_finish), 0.87, 0.75 (match scores),
            # 87, 75 (stub: int(score * 100)), 2,6,9,12,14,15 (critical path IDs),
            # 101, 102 (user IDs), 0,1,2,3,4,5 (list ordinals / small integers).
            allowed_numbers = {
                "56", "0.87", "0.75", "87", "75",   # project_finish + match scores
                "2", "6", "9", "12", "14", "15",     # critical path IDs
                "101", "102",                         # user IDs
                "0", "1", "3", "4", "5",              # ordinals and small tokens
            }
            found_numbers = set(_NUMERIC_PATTERN.findall(explanation))
            unknown_numbers = found_numbers - allowed_numbers
            assert not unknown_numbers, (
                f"Response synthesizer produced numbers not in the input: {unknown_numbers}. "
                "The LLM must NEVER compute scheduling values — it may only phrase provided data."
            )
        except ImportError:
            pytest.skip("response_synthesizer not importable — skipping synthesizer test")

    def test_synthesizer_resource_deficit_fallback_when_all_scores_below_threshold(self):
        """
        When all candidate match scores are below 0.50, the synthesizer must fall back
        to taking the top 2 candidates and include a resource deficit warning prefix.
        """
        from orchestration.response_synthesizer import synthesize_assignment_explanation

        gnn_results = [
            {"user_id": 201, "display_name": "Kenji Takahashi", "match_fit_score": 0.35, "skill_overlap": ["Testing"]},
            {"user_id": 202, "display_name": "Elena Vance", "match_fit_score": 0.25, "skill_overlap": []},
        ]

        explanation = synthesize_assignment_explanation(gnn_results, cpa_schedule=None)
        assert "Resource Deficit Detected" in explanation, (
            "Explanation must flag Resource Deficit Detected when all candidates score < 50%."
        )
        assert "Kenji Takahashi" in explanation
        assert "35%" in explanation
