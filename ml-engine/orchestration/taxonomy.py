#!/usr/bin/env python3
"""
taxonomy.py
================================================================================
StudioSprint Unified Taxonomy & Backward-Compatible Normalization
================================================================================
Single Source of Truth for:
  1. CANONICAL_CLASSIFICATIONS: The 22 granular categories required by GNN/DeepFM.
  2. CLASSIFICATION_MACRO_MAP: Mapping each canonical category to its macro domain.
  3. CANONICAL_TO_BROAD_MAP: Reverse lookup mapping each canonical category to
     one of the 6 legacy broad categories (Feature, Bug Fix, Research, DevOps,
     Testing, Documentation) for UI/Kanban backward compatibility.
  4. normalize_task_classification: Heuristic and skill-centroid fallback router
     that gracefully maps broad/legacy labels to canonical 22 categories.
================================================================================
"""

from __future__ import annotations

from typing import List, Dict, Any, Optional

CANONICAL_CLASSIFICATIONS = [
    "Product Requirements & Analysis",
    "Sprint & Roadmap Planning",
    "Market Viability Research",
    "Data Pre-processing & Pipeline Engineering",
    "Model Training & Fine-Tuning",
    "LLM Prompt Engineering & RAG Integration",
    "Algorithm Evaluation & Benchmarking",
    "System Architecture Design",
    "Feature Implementation",
    "Algorithm Optimization & Refactoring",
    "Bug Resolution & Hotfixing",
    "Third-Party API Setup",
    "Client-Based Environment Provisioning",
    "Container Orchestration & Deployment",
    "DevSecOps & Security Auditing",
    "Hardware-in-the-Loop Testing",
    "Hardware Sensor Integration",
    "Game Engine Logic & Asset Integration",
    "UI/UX Prototyping & Wireframing",
    "System Mechanics Planning",
    "Unit & Integration Testing",
    "Peer Code Review",
]

CLASSIFICATION_MACRO_MAP = {
    "Product Requirements & Analysis": "Product & Planning",
    "Sprint & Roadmap Planning": "Product & Planning",
    "Market Viability Research": "Product & Planning",
    "Data Pre-processing & Pipeline Engineering": "Data & Machine Learning",
    "Model Training & Fine-Tuning": "Data & Machine Learning",
    "LLM Prompt Engineering & RAG Integration": "Data & Machine Learning",
    "Algorithm Evaluation & Benchmarking": "Data & Machine Learning",
    "System Architecture Design": "Backend & Core Systems",
    "Feature Implementation": "Backend & Core Systems",
    "Algorithm Optimization & Refactoring": "Backend & Core Systems",
    "Bug Resolution & Hotfixing": "Backend & Core Systems",
    "Third-Party API Setup": "Backend & Core Systems",
    "Client-Based Environment Provisioning": "Cloud & DevOps",
    "Container Orchestration & Deployment": "Cloud & DevOps",
    "DevSecOps & Security Auditing": "Cloud & DevOps",
    "Hardware-in-the-Loop Testing": "Hardware & Embedded",
    "Hardware Sensor Integration": "Hardware & Embedded",
    "Game Engine Logic & Asset Integration": "Game & Interactive",
    "UI/UX Prototyping & Wireframing": "Game & Interactive",
    "System Mechanics Planning": "Game & Interactive",
    "Unit & Integration Testing": "Quality Assurance",
    "Peer Code Review": "Quality Assurance",
}

CANONICAL_TO_BROAD_MAP = {
    "Product Requirements & Analysis": "Research",
    "Sprint & Roadmap Planning": "Research",
    "Market Viability Research": "Research",
    "Data Pre-processing & Pipeline Engineering": "Feature",
    "Model Training & Fine-Tuning": "Feature",
    "LLM Prompt Engineering & RAG Integration": "Feature",
    "Algorithm Evaluation & Benchmarking": "Research",
    "System Architecture Design": "Feature",
    "Feature Implementation": "Feature",
    "Algorithm Optimization & Refactoring": "Feature",
    "Bug Resolution & Hotfixing": "Bug Fix",
    "Third-Party API Setup": "Feature",
    "Client-Based Environment Provisioning": "DevOps",
    "Container Orchestration & Deployment": "DevOps",
    "DevSecOps & Security Auditing": "DevOps",
    "Hardware-in-the-Loop Testing": "Testing",
    "Hardware Sensor Integration": "Feature",
    "Game Engine Logic & Asset Integration": "Feature",
    "UI/UX Prototyping & Wireframing": "Feature",
    "System Mechanics Planning": "Research",
    "Unit & Integration Testing": "Testing",
    "Peer Code Review": "Documentation",
}

BROAD_TO_DEFAULT_CANONICAL = {
    "Feature": "Feature Implementation",
    "Bug Fix": "Bug Resolution & Hotfixing",
    "Research": "Product Requirements & Analysis",
    "DevOps": "Container Orchestration & Deployment",
    "Testing": "Unit & Integration Testing",
    "Documentation": "Peer Code Review",
}

_SKILL_CENTROIDS: Dict[str, List[str]] = {
    "UI/UX Prototyping & Wireframing": ["figma", "tailwind", "css", "html", "react", "vue", "ui", "ux", "design", "wireframe"],
    "Container Orchestration & Deployment": ["docker", "kubernetes", "k8s", "aws", "cloud", "deploy", "ci/cd", "github actions", "terraform"],
    "Model Training & Fine-Tuning": ["pytorch", "tensorflow", "keras", "torch", "model", "training", "fine-tuning", "gpu", "deep learning"],
    "LLM Prompt Engineering & RAG Integration": ["llm", "langchain", "rag", "prompt", "openai", "groq", "ollama", "vector", "embeddings"],
    "Data Pre-processing & Pipeline Engineering": ["pandas", "numpy", "etl", "data", "pipeline", "sql", "spark", "preprocessing"],
    "Unit & Integration Testing": ["pytest", "jest", "mock", "test", "testing", "unit test", "integration test", "cypress", "selenium"],
    "DevSecOps & Security Auditing": ["security", "audit", "auth", "oauth", "jwt", "ssl", "penetration", "vulnerability"],
    "Game Engine Logic & Asset Integration": ["unity", "unreal", "godot", "c#", "c++", "3d", "asset", "game engine", "physics"],
    "Third-Party API Setup": ["api", "rest", "graphql", "stripe", "webhook", "integration", "sdk"],
    "System Architecture Design": ["architecture", "microservices", "system design", "redis", "database design", "schema"],
}


def normalize_task_classification(
    raw_classification: str,
    title: str = "",
    description: str = "",
    skills: Optional[List[Any]] = None,
) -> str:
    """
    Given a raw classification string (which might be one of the 22 canonical
    categories, or a legacy 6 broad category, or an LLM hallucination),
    return a guaranteed valid category from CANONICAL_CLASSIFICATIONS.
    """
    if not raw_classification:
        return "Feature Implementation"

    raw = raw_classification.strip()
    if raw in CANONICAL_CLASSIFICATIONS:
        return raw

    # Check case-insensitive exact matches
    for canonical in CANONICAL_CLASSIFICATIONS:
        if raw.lower() == canonical.lower():
            return canonical

    # Extract skill names from strings or dict/SkillRequirement objects
    skill_names = []
    if skills:
        for s in skills:
            if isinstance(s, str):
                skill_names.append(s.lower())
            elif isinstance(s, dict) and "name" in s:
                skill_names.append(str(s["name"]).lower())
            elif hasattr(s, "name"):
                skill_names.append(str(getattr(s, "name")).lower())

    text_blob = f"{title} {description} {' '.join(skill_names)}".lower()

    # If raw is one of the 6 broad categories, try skill centroid matching
    if raw in BROAD_TO_DEFAULT_CANONICAL:
        best_canonical = BROAD_TO_DEFAULT_CANONICAL[raw]
        best_score = 0
        for canonical, keywords in _SKILL_CENTROIDS.items():
            if CANONICAL_TO_BROAD_MAP.get(canonical) == raw:
                score = sum(1 for kw in keywords if kw in text_blob)
                if score > best_score:
                    best_score = score
                    best_canonical = canonical
        return best_canonical

    # Fallback across all centroids
    best_canonical = "Feature Implementation"
    best_score = 0
    for canonical, keywords in _SKILL_CENTROIDS.items():
        score = sum(1 for kw in keywords if kw in text_blob)
        if score > best_score:
            best_score = score
            best_canonical = canonical

    if best_score > 0:
        return best_canonical

    return "Feature Implementation"


def enrich_task_classification(granular_classification: str) -> Dict[str, str]:
    """
    Return the full dimensional breakdown of a task's classification:
    granular (22), broad (6 legacy), and macro domain.
    """
    normalized = normalize_task_classification(granular_classification)
    return {
        "granular_classification": normalized,
        "broad_classification": CANONICAL_TO_BROAD_MAP.get(normalized, "Feature"),
        "macro_domain": CLASSIFICATION_MACRO_MAP.get(normalized, "Backend & Core Systems"),
    }
