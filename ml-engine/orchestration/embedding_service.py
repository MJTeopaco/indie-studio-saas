#!/usr/bin/env python3
"""
embedding_service.py
================================================================================
Phase 3 — Cold-Start Engine: Embedding Service

Wraps sentence-transformers (all-MiniLM-L6-v2) as a singleton service used
across the entire ML engine. All embeddings pass through this module so that
the model is loaded only once.

Usage:
    from orchestration.embedding_service import EmbeddingService
    svc = EmbeddingService()
    vector = svc.embed("Backend Developer with 3 years FastAPI experience")
    similarity = svc.cosine_similarity(vec_a, vec_b)
================================================================================
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import List

import numpy as np

logger = logging.getLogger(__name__)

MODEL_NAME = "all-MiniLM-L6-v2"


class EmbeddingService:
    """Singleton wrapper around sentence-transformers for text embeddings."""

    _instance: "EmbeddingService | None" = None
    _model = None

    def __new__(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def _load_model(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading sentence-transformer model: %s", MODEL_NAME)
            self._model = SentenceTransformer(MODEL_NAME)
            logger.info("Embedding model loaded successfully.")
        except ImportError:
            logger.warning(
                "sentence-transformers not installed. Embedding service will "
                "return zero vectors. Install it with: pip install sentence-transformers"
            )
            self._model = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def embed(self, text: str) -> List[float]:
        """
        Embed a single string into a normalised 384-dimensional float vector.
        Falls back to a zero vector if the model is unavailable.
        """
        if self._model is None:
            return [0.0] * 384
        vector = self._model.encode(text, normalize_embeddings=True)
        return vector.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of strings, returning a list of vectors."""
        if self._model is None:
            return [[0.0] * 384 for _ in texts]
        vectors = self._model.encode(texts, normalize_embeddings=True, batch_size=32)
        return vectors.tolist()

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """
        Compute cosine similarity between two vectors.
        Both vectors are assumed to be already L2-normalised (which SentenceTransformer
        produces by default when normalize_embeddings=True), so the dot product
        directly equals cosine similarity.
        """
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def cosine_similarity_matrix(
        self, query_vec: List[float], candidate_vecs: List[List[float]]
    ) -> List[float]:
        """
        Compute cosine similarity between one query vector and a list of candidates.
        Returns a list of similarity scores in the same order as candidate_vecs.
        """
        q = np.array(query_vec, dtype=np.float32)
        q_norm = np.linalg.norm(q)
        if q_norm == 0:
            return [0.0] * len(candidate_vecs)

        candidates = np.array(candidate_vecs, dtype=np.float32)  # shape (N, D)
        norms = np.linalg.norm(candidates, axis=1)  # shape (N,)
        dots = candidates @ q  # shape (N,)

        with np.errstate(divide="ignore", invalid="ignore"):
            scores = np.where(norms > 0, dots / (norms * q_norm), 0.0)

        return scores.tolist()


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService:
    """FastAPI dependency-injection compatible getter."""
    return EmbeddingService()
