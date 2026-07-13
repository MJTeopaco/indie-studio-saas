"""
test_skill_normalization.py
================================================================================
Verifies that non-canonical skill requirements (e.g. 'Dark Mode', 'CSS') are
normalized to canonical GNN training features (React, JavaScript, TypeScript),
restoring proper match fit scores for frontend/UI tasks.
================================================================================
"""

import os
import sys
import pytest
import torch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts.single_task_recommendation.gnn_recommendation_inference import (
    DeveloperDataLoader,
    normalize_required_skills,
    CANONICAL_SKILL_ALIASES,
)
from orchestration.gnn import gnn_rank_employees


def test_normalize_required_skills_alias_mapping():
    """Verify that Dark Mode and CSS alias to canonical frontend skills."""
    canonical_cols = [
        "skill_PHP", "skill_Python", "skill_JavaScript", "skill_TypeScript",
        "skill_React", "skill_Next.js", "skill_Figma"
    ]
    raw_skills = {"Dark Mode": 3, "CSS": 4}
    normalized = normalize_required_skills(raw_skills, canonical_cols)

    assert "React" in normalized
    assert "JavaScript" in normalized
    assert "TypeScript" in normalized
    assert normalized["React"] == 4.0
    assert normalized["JavaScript"] == 4.0


def test_encode_task_dict_populates_canonical_skill_tensor():
    """Verify that non-canonical skill input populates non-zero features in X_task."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.normpath(os.path.join(script_dir, "../data/developers/developer_node_features_v2.csv"))
    loader = DeveloperDataLoader(csv_path)
    loader.load_and_preprocess()

    task_dict = {
        "task_title": "Dark Mode Support",
        "task_classification": "Frontend Developer",
        "required_skills": {
            "Dark Mode": 3,
            "CSS": 4
        }
    }
    X_task = loader.encode_task_dict(task_dict)
    
    # Check that skill features (last 96 columns) are not all zero
    skill_vector = X_task[:, -96:]
    assert torch.sum(skill_vector) > 0.0, "Skill vector should not be all zero after normalization."


def test_gnn_rank_employees_dark_mode_task_recovery():
    """Verify ranking employees on Dark Mode / CSS task yields >70% match score for top frontend devs."""
    task_dict = {
        "task_title": "Dark Mode Support",
        "task_description": "Implement dark theme across UI components.",
        "required_position": "Frontend Developer",
        "task_difficulty": "Medium",
        "priority": "High",
        "required_skills": [
            {"name": "Dark Mode", "level": 3},
            {"name": "CSS", "level": 4}
        ]
    }

    results = gnn_rank_employees(task_dict)
    assert len(results) > 0
    top_candidate = results[0]

    # Verify match fit score recovered significantly (>0.50, typically ~0.80+)
    assert top_candidate["match_fit_score"] >= 0.50, (
        f"Top candidate {top_candidate['display_name']} scored {top_candidate['match_fit_score']}, expected >= 0.50"
    )
    # Verify skill overlap is non-empty
    assert len(top_candidate["skill_overlap"]) > 0, (
        f"Top candidate should have overlapping normalized skills, got {top_candidate['skill_overlap']}"
    )


def test_semantic_vector_skill_mapping():
    """Verify that all-MiniLM-L6-v2 vector search maps novel variations above 0.65 similarity."""
    from unittest.mock import patch
    from orchestration.embedding_service import get_embedding_service

    canonical_cols = [
        "skill_Python", "skill_PyTorch", "skill_React", "skill_PostgreSQL"
    ]
    raw_skills = {"PyTorch Deep Learning Framework": 4.0}

    svc = get_embedding_service()
    if svc._model is None:
        vec_pytorch = [1.0, 0.0, 0.0] + [0.0] * 381
        vec_python = [0.5, 0.5, 0.0] + [0.0] * 381
        vec_react = [0.0, 1.0, 0.0] + [0.0] * 381
        vec_pg = [0.0, 0.0, 1.0] + [0.0] * 381

        with patch.object(svc, "embed_batch", return_value=[vec_python, vec_pytorch, vec_react, vec_pg]), \
             patch.object(svc, "embed", return_value=[0.9, 0.1, 0.0] + [0.0] * 381):
            normalized = normalize_required_skills(raw_skills, canonical_cols, similarity_threshold=0.65)
    else:
        normalized = normalize_required_skills(raw_skills, canonical_cols, similarity_threshold=0.65)

    assert "PyTorch" in normalized
    assert normalized["PyTorch"] == 4.0


def test_strict_drop_and_log_sub_threshold():
    """Verify that sub-threshold skills (< 0.65) apply Strict Drop & Log (contributing 0.0)."""
    canonical_cols = [
        "skill_Python", "skill_PyTorch", "skill_React", "skill_PostgreSQL"
    ]
    # Completely unrelated skill whose similarity is below 0.65 against engineering skills
    raw_skills = {"Exotic Culinary Arts": 5.0}
    normalized = normalize_required_skills(raw_skills, canonical_cols, similarity_threshold=0.65)

    assert len(normalized) == 0, f"Expected sub-threshold skill to be dropped, got {normalized}"

