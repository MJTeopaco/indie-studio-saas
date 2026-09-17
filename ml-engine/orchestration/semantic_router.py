#!/usr/bin/env python3
"""
semantic_router.py
================================================================================
Phase 6 — Semantic Intent Router (Layer 2)

Provides vector-based intent classification by comparing user text against a 
curated "Golden Dataset" of examples using the EmbeddingService.
================================================================================
"""

import logging
from typing import Dict, List, Tuple
from orchestration.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)

GOLDEN_DATASET = {
    "GENERAL_CHAT": [
        "Who should I assign to the API tasks?",
        "Recommend optimal developer assignments for sprint 2",
        "Audit our team's skill coverage",
        "Which developer is best for the backend epic?",
        "Analyze the health of our current sprint",
        "Who is free to take over the database tasks?",
        "Suggest assignees for the frontend tasks",
        "Can you recommend developers for these tickets?",
        "Match skills for this unassigned work",
        "Find the best fit for this task",
        "Who has React experience?",
        "Show me our team's capacity",
        "I need help understanding this project",
        "Explain how the matching algorithm works",
        "What are the skills of Alex Rivera?",
        "Show me the current workload of the team",
        "Are there any resource deficits in this sprint?",
        "Help me assign these tasks",
        "Which developer should take the authentication ticket?",
        "Recommend team members for the backend API"
    ],
    "CREATE_TASK": [
        "Break down the authentication feature into tasks",
        "Plan a sprint for the payment integration",
        "Create tasks for the user dashboard",
        "Decompose this ticket into smaller tasks",
        "We need to implement email verification, break it down",
        "Plan sprint 3 for the messaging feature",
        "Create a sprint for the new landing page",
        "Generate tasks for the webhook implementation",
        "What tasks are needed for the profile page?",
        "Help me plan the next sprint",
        "Decompose the API refactor",
        "Create a plan for the data migration",
        "Write some tasks for the frontend redesign",
        "We need to build a new modal, generate the tasks",
        "Draft the tasks for the reporting module",
        "Set up sprint tasks for the mobile view",
        "I want to plan a sprint around user analytics",
        "Generate the breakdown for this epic",
        "List the tasks required for OAuth integration",
        "Make a sprint plan for the admin panel"
    ],
    "NEW_PROJECT": [
        "Build a full SaaS application for inventory management",
        "Create a new project for a mobile e-commerce app",
        "I want to start a new platform for freelancers",
        "Let's build a completely new HR system",
        "Create a new project workspace for the CRM tool",
        "Decompose a full application for ride sharing",
        "Generate epics and sprints for a new video streaming site",
        "Plan a completely new project for logistics",
        "Build me an e-learning platform from scratch",
        "I need to create a new project for a crypto exchange",
        "We are starting a new project for a social network",
        "Generate the project structure for a medical app",
        "Create a full system design and tasks for a POS system",
        "Start a new project: an AI-powered resume builder",
        "I want to build a marketplace application",
        "Create epics for a new project management tool",
        "Plan a full software build for a delivery app",
        "Let's start a new project to rebuild the legacy system",
        "Build a new inventory app",
        "Create a whole new project for real estate listings"
    ],
}

# In-memory cache for the dataset embeddings
_intent_labels: List[str] = []
_dataset_vectors: List[List[float]] = []
_is_initialized = False


def _initialize_cache():
    """Lazily load embeddings for the Golden Dataset on first request."""
    global _intent_labels, _dataset_vectors, _is_initialized
    if _is_initialized:
        return

    logger.info("Initializing Semantic Router Golden Dataset cache...")
    svc = get_embedding_service()
    
    texts_to_embed = []
    labels = []
    
    for intent, examples in GOLDEN_DATASET.items():
        for example in examples:
            texts_to_embed.append(example)
            labels.append(intent)
            
    _dataset_vectors = svc.embed_batch(texts_to_embed)
    _intent_labels = labels
    _is_initialized = True
    logger.info(f"Cached {len(_dataset_vectors)} Golden Dataset vectors.")


def warmup_semantic_router() -> None:
    """
    Public entry point for the startup lifespan hook.
    Pre-computes and caches all Golden Dataset vectors so the first
    live request does not bear the cold-start cost.
    """
    _initialize_cache()


def vector_route(text: str) -> Tuple[str, float]:
    """
    Compare the text against the Golden Dataset and return the closest intent and its confidence.
    """
    _initialize_cache()
    
    svc = get_embedding_service()
    query_vec = svc.embed(text)
    
    similarities = svc.cosine_similarity_matrix(query_vec, _dataset_vectors)
    
    if not similarities:
        return "GENERAL_CHAT", 0.0
        
    best_idx = int(max(range(len(similarities)), key=similarities.__getitem__))
    best_score = float(similarities[best_idx])
    best_intent = _intent_labels[best_idx]
    
    return best_intent, best_score
