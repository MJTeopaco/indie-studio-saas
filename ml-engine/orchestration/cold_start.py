#!/usr/bin/env python3
"""
cold_start.py
================================================================================
Phase 3 — Cold-Start Engine: Cosine Similarity Cold-Start Mitigation

When a studio has no historical assignment data the GNN cannot produce
meaningful fit scores. This module provides:

  1. build_employee_vector()     — build a searchable embedding for one developer
  2. build_studio_vector()       — aggregate studio-level feature vector
  3. find_closest_baseline()     — pick the best-matching baseline studio profile
  4. cold_start_rank_employees() — rank candidates for a task using cosine
                                   similarity instead of GNN scores, annotated
                                   with match_source="cold_start_baseline"

The module is intentionally stateless — it receives data from callers
(FastAPI endpoints / Laravel-triggered scripts) rather than hitting the DB
directly, keeping DB access in the data access layer.
================================================================================
"""

from __future__ import annotations

import logging
from typing import Any

from orchestration.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Employee profile → text representation → embedding
# ---------------------------------------------------------------------------


def build_employee_profile_text(profile: dict[str, Any]) -> str:
    """
    Convert a developer passport dict into a plain-English text string
    that sentence-transformers can embed meaningfully.

    Expected keys in `profile`:
        position        (str)   e.g. "Backend Developer"
        experience_years (float) e.g. 3.5
        skills          (list)  e.g. [{"name": "FastAPI", "level": 4}, ...]
        macro_domains   (list)  e.g. ["Web & API Development", "Cloud & DevOps"]
    """
    lines: list[str] = []

    if position := profile.get("position"):
        lines.append(f"Position: {position}.")

    if exp := profile.get("experience_years"):
        lines.append(f"Experience: {exp} years.")

    if skills := profile.get("skills"):
        skill_strs = [
            f"{s['name']} (level {s.get('level', 1)}/5)" for s in skills if s.get("name")
        ]
        if skill_strs:
            lines.append("Skills: " + ", ".join(skill_strs) + ".")

    if domains := profile.get("macro_domains"):
        lines.append("Domains: " + ", ".join(domains) + ".")

    return " ".join(lines) or "Developer profile."


def embed_employee_profile(profile: dict[str, Any]) -> list[float]:
    """Return a 384-dim embedding vector for a developer profile."""
    text = build_employee_profile_text(profile)
    svc = EmbeddingService()
    return svc.embed(text)


# ---------------------------------------------------------------------------
# 2. Task → text representation → embedding
# ---------------------------------------------------------------------------


def build_task_text(task: dict[str, Any]) -> str:
    """
    Convert a task dict into embeddable text.

    Expected keys:
        title                   (str)
        description             (str)
        task_classification     (str)
        required_position       (str)
        task_difficulty         (str)
        required_skills         (list) e.g. [{"name": "React", "level": 3}, ...]
        target_macro_domains    (list of str)
    """
    lines: list[str] = []

    if title := task.get("title"):
        lines.append(f"Task: {title}.")

    if desc := task.get("description"):
        lines.append(desc)

    if cls_ := task.get("task_classification"):
        lines.append(f"Classification: {cls_}.")

    if pos := task.get("required_position"):
        lines.append(f"Required position: {pos}.")

    if diff := task.get("task_difficulty"):
        lines.append(f"Difficulty: {diff}.")

    if skills := task.get("required_skills"):
        if skills and isinstance(skills[0], dict):
            skill_strs = [
                f"{s['name']} (level {s.get('level', 1)}/5)"
                for s in skills
                if s.get("name")
            ]
        else:
            skill_strs = [str(s) for s in skills]
        if skill_strs:
            lines.append("Required skills: " + ", ".join(skill_strs) + ".")

    if domains := task.get("target_macro_domains"):
        if domains and isinstance(domains[0], str):
            lines.append("Domains: " + ", ".join(domains) + ".")

    return " ".join(lines) or "Development task."


def embed_task(task: dict[str, Any]) -> list[float]:
    """Return a 384-dim embedding vector for a task."""
    text = build_task_text(task)
    svc = EmbeddingService()
    return svc.embed(text)


# ---------------------------------------------------------------------------
# 3. Studio-level feature vector for cold-start baseline matching
# ---------------------------------------------------------------------------


def build_studio_vector(
    position_counts: dict[str, int],
    skill_category_counts: dict[str, int],
    macro_domain_labels: list[str],
    all_positions: list[str],
    all_skill_categories: list[str],
    all_macro_domains: list[str],
) -> dict[str, list[float]]:
    """
    Build the three studio-level feature vectors used for cosine similarity
    against baseline_studio_profiles.

    Returns a dict with keys:
        workforce_composition_vector  (ratio per position)
        tech_stack_vector             (ratio per skill category)
        domain_one_hot_vector         (1/0 per macro domain)
    """
    total_employees = sum(position_counts.values()) or 1

    workforce_vec = [
        position_counts.get(pos, 0) / total_employees for pos in all_positions
    ]

    total_skills = sum(skill_category_counts.values()) or 1
    tech_vec = [
        skill_category_counts.get(cat, 0) / total_skills
        for cat in all_skill_categories
    ]

    domain_vec = [1 if d in macro_domain_labels else 0 for d in all_macro_domains]

    return {
        "workforce_composition_vector": workforce_vec,
        "tech_stack_vector": tech_vec,
        "domain_one_hot_vector": [float(x) for x in domain_vec],
    }


def find_closest_baseline(
    studio_vectors: dict[str, list[float]],
    baseline_profiles: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """
    Given the current studio's three vectors and a list of baseline profiles
    (dicts with workforce_composition_vector, tech_stack_vector,
    domain_one_hot_vector), return the baseline with the highest average
    cosine similarity across the three sub-vectors.

    Returns None if baseline_profiles is empty.
    """
    if not baseline_profiles:
        return None

    svc = EmbeddingService()

    # Flatten studio vectors into one concatenated vector
    studio_flat = (
        studio_vectors["workforce_composition_vector"]
        + studio_vectors["tech_stack_vector"]
        + studio_vectors["domain_one_hot_vector"]
    )

    best_score = -1.0
    best_baseline = None

    for bp in baseline_profiles:
        bp_flat = (
            bp.get("workforce_composition_vector", [])
            + bp.get("tech_stack_vector", [])
            + bp.get("domain_one_hot_vector", [])
        )
        if len(bp_flat) != len(studio_flat):
            logger.warning(
                "Baseline profile id=%s vector length mismatch (%d vs %d) — skipping.",
                bp.get("id"),
                len(bp_flat),
                len(studio_flat),
            )
            continue

        score = svc.cosine_similarity(studio_flat, bp_flat)
        if score > best_score:
            best_score = score
            best_baseline = bp

    logger.info("Closest baseline: id=%s score=%.4f", best_baseline and best_baseline.get("id"), best_score)
    return best_baseline


# ---------------------------------------------------------------------------
# 4. Cold-start employee ranking for a task
# ---------------------------------------------------------------------------


def cold_start_rank_employees(
    task: dict[str, Any],
    employee_profiles: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Rank employee profiles for a task using text-embedding cosine similarity
    when no GNN model is available.

    Each result dict contains:
        employee_user_id  (int)
        display_name      (str)
        match_fit_score   (float, 0–1)
        match_source      (str)  always "cold_start_baseline"
        skill_overlap     (list) matched skill names

    `employee_profiles` must each include at minimum:
        user_id, display_name, position, experience_years, skills, macro_domains
    """
    svc = EmbeddingService()
    task_vec = embed_task(task)
    task_required_skills: set[str] = {
        (s["name"] if isinstance(s, dict) else str(s)).lower()
        for s in (task.get("required_skills") or [])
    }

    results = []
    for profile in employee_profiles:
        emp_vec = embed_employee_profile(profile)
        score = svc.cosine_similarity(task_vec, emp_vec)

        # Compute skill overlap for explainability
        employee_skills: set[str] = {
            (s["name"] if isinstance(s, dict) else str(s)).lower()
            for s in (profile.get("skills") or [])
        }
        overlap = sorted(task_required_skills & employee_skills)

        results.append(
            {
                "employee_user_id": profile.get("user_id"),
                "display_name": profile.get("display_name", "Unknown"),
                "match_fit_score": round(score, 4),
                "match_source": "cold_start_baseline",
                "skill_overlap": overlap,
            }
        )

    # Sort descending by score
    results.sort(key=lambda r: r["match_fit_score"], reverse=True)
    return results
