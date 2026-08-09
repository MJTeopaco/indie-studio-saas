#!/usr/bin/env python3
"""
test_taxonomy.py
================================================================================
Unit tests for StudioSprint taxonomy synchronization, reverse lookup, and
skill-centroid fallback resolution.
================================================================================
"""

import pytest
from orchestration.taxonomy import (
    CANONICAL_CLASSIFICATIONS,
    CANONICAL_TO_BROAD_MAP,
    CLASSIFICATION_MACRO_MAP,
    normalize_task_classification,
    enrich_task_classification,
)
from orchestration.intent_parser import TaskParseResult


def test_canonical_classifications_count():
    """Verify exactly 22 canonical categories exist."""
    assert len(CANONICAL_CLASSIFICATIONS) == 22


def test_reverse_lookup_coverage():
    """Verify every canonical classification has both broad and macro mappings."""
    for cls in CANONICAL_CLASSIFICATIONS:
        assert cls in CANONICAL_TO_BROAD_MAP
        assert cls in CLASSIFICATION_MACRO_MAP
        assert CANONICAL_TO_BROAD_MAP[cls] in {
            "Feature", "Bug Fix", "Research", "DevOps", "Testing", "Documentation"
        }


def test_normalize_exact_granular_passthrough():
    """If exact granular category is given, return it untouched."""
    res = normalize_task_classification("Container Orchestration & Deployment")
    assert res == "Container Orchestration & Deployment"


def test_normalize_broad_fallback_with_skills():
    """If broad category 'DevOps' is given with Docker skills, resolve to Container Orchestration."""
    res = normalize_task_classification(
        raw_classification="DevOps",
        skills=["docker", "kubernetes", "aws"]
    )
    assert res == "Container Orchestration & Deployment"


def test_normalize_broad_fallback_with_feature_ui():
    """If broad category 'Feature' is given with UI/UX skills, resolve to UI/UX Prototyping."""
    res = normalize_task_classification(
        raw_classification="Feature",
        skills=["figma", "tailwind", "react"]
    )
    assert res == "UI/UX Prototyping & Wireframing"


def test_enrich_task_classification():
    """Verify enrichment returns granular, broad, and macro fields."""
    enriched = enrich_task_classification("System Architecture Design")
    assert enriched["granular_classification"] == "System Architecture Design"
    assert enriched["broad_classification"] == "Feature"
    assert enriched["macro_domain"] == "Backend & Core Systems"


def test_task_parse_result_broad_property():
    """Verify TaskParseResult automatically computes broad_classification."""
    tpr = TaskParseResult(
        title="Setup Redis Cache",
        objective="Implement Redis memory caching for API endpoints",
        task_classification="System Architecture Design",
        task_difficulty="Medium",
        priority="High"
    )
    assert tpr.task_classification == "System Architecture Design"
    assert tpr.broad_classification == "Feature"
    assert tpr.macro_domain == "Backend & Core Systems"
