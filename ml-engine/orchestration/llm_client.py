#!/usr/bin/env python3
"""
llm_client.py
================================================================================
Phase 6 — LLM Orchestration Layer: Ollama / LangChain Client

Central factory that returns a configured ChatOllama LLM instance.
All modules in the orchestration layer import from here so Ollama
settings only need to change in one place.

IMPORTANT CONSTRAINT (from thesis architecture):
  The LLM ONLY parses input and synthesises output.
  It must NEVER compute durations, dependencies, schedules, or fit scores.
  All numeric / graph computation stays in the GNN and CPA modules.
================================================================================
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
# Default: llama3.2:3b (fast dev model). Override via OLLAMA_MODEL env var
# for benchmark runs (e.g. OLLAMA_MODEL=llama3.1:8b-instruct).
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")


def _is_ollama_available() -> bool:
    """Quick connectivity check to the Ollama server."""
    try:
        import httpx

        resp = httpx.get(f"{OLLAMA_BASE_URL}/api/version", timeout=2.0)
        return resp.status_code == 200
    except Exception:
        return False


@lru_cache(maxsize=1)
def get_llm():
    """
    Return a LangChain-compatible ChatOllama LLM.
    Returns None if Ollama is not reachable (graceful degradation).
    """
    try:
        from langchain_ollama import ChatOllama

        if not _is_ollama_available():
            logger.warning(
                "Ollama server not reachable at %s. "
                "LLM features will return stub responses. "
                "Install Ollama from https://ollama.com and run: "
                "ollama pull %s",
                OLLAMA_BASE_URL,
                OLLAMA_MODEL,
            )
            return None

        llm = ChatOllama(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0.2,   # Low temperature for structured JSON extraction
        )
        logger.info("LLM client ready: %s @ %s", OLLAMA_MODEL, OLLAMA_BASE_URL)
        return llm
    except ImportError:
        logger.warning("langchain-ollama not installed. LLM features disabled.")
        return None


def llm_available() -> bool:
    """Convenience check for endpoints to decide whether to use LLM or stub."""
    return get_llm() is not None
