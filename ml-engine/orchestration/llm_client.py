#!/usr/bin/env python3
"""
llm_client.py
================================================================================
Phase 6 — LLM Orchestration Layer: Groq / LangChain Client

Central factory that returns a configured ChatGroq LLM instance.
All modules in the orchestration layer import from here so Groq
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
from pathlib import Path

# ---------------------------------------------------------------------------
# Load .env from the ml-engine directory (if it exists).
# Falls back gracefully if python-dotenv is not installed — env vars can
# still be supplied via the OS environment (e.g. Docker, CI secrets).
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv

    _env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=_env_path, override=False)  # override=False: system env wins
except ImportError:
    pass  # python-dotenv optional — OS env vars are sufficient

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration — all sourced from environment variables only.
# Never hardcode keys here.
# ---------------------------------------------------------------------------

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

# Retry configuration for Groq rate-limit (HTTP 429) responses.
_MAX_RETRIES: int = 4        # attempts before giving up
_RETRY_WAIT_MIN: float = 2.0  # seconds
_RETRY_WAIT_MAX: float = 30.0  # seconds cap


def _is_groq_configured() -> bool:
    """Return True only if GROQ_API_KEY is present in the environment."""
    if not GROQ_API_KEY:
        logger.warning(
            "GROQ_API_KEY is not set. "
            "LLM features will return stub responses. "
            "Add GROQ_API_KEY=<your_key> to ml-engine/.env or export it in your shell."
        )
        return False
    return True


def _make_groq_llm():
    """
    Internal factory — build and return a ChatGroq instance wrapped with
    retry-on-429 behaviour via tenacity.

    Returns a thin wrapper whose .invoke() is identical to ChatGroq.invoke()
    but retries automatically on Groq RateLimitError (HTTP 429).

    Raises ImportError if langchain-groq is not installed.
    Raises groq.RateLimitError / groq.APIStatusError on unrecoverable API errors.
    """
    from langchain_groq import ChatGroq
    from tenacity import (
        retry,
        retry_if_exception_type,
        stop_after_attempt,
        wait_exponential,
        before_sleep_log,
    )

    # Identify the exception types to retry on (Groq rate-limit errors).
    # We import lazily so a missing groq package is caught cleanly.
    try:
        from groq import RateLimitError as GroqRateLimitError
        _retry_on = (GroqRateLimitError,)
    except ImportError:
        # Fallback: retry on any exception whose message mentions 429.
        _retry_on = (Exception,)

    # Build the base LLM object.
    base_llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model=GROQ_MODEL,
        temperature=0.2,   # Low temperature for structured JSON extraction
        max_tokens=4096,   # Enough tokens for multi-task sprint decompositions without truncation
    )

    # Build the retrying invoke function as a standalone callable.
    @retry(
        retry=retry_if_exception_type(_retry_on),
        wait=wait_exponential(multiplier=1, min=_RETRY_WAIT_MIN, max=_RETRY_WAIT_MAX),
        stop=stop_after_attempt(_MAX_RETRIES),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    def _invoke_with_retry(*args, **kwargs):
        return base_llm.invoke(*args, **kwargs)

    # Wrap in a simple object so callers use llm.invoke() exactly as before.
    class _GroqLLMWithRetry:
        """Thin proxy that exposes .invoke() with exponential-backoff retry."""

        def invoke(self, *args, **kwargs):
            return _invoke_with_retry(*args, **kwargs)

        # Delegate everything else (e.g. streaming) to the underlying LLM.
        def __getattr__(self, name):
            return getattr(base_llm, name)

    return _GroqLLMWithRetry()


@lru_cache(maxsize=1)
def get_llm():
    """
    Return a LangChain-compatible ChatGroq LLM with retry-on-429.
    Returns None if GROQ_API_KEY is missing (graceful degradation).

    The lru_cache ensures the heavy ChatGroq initialisation happens once
    per process. Callers do NOT need to change — signature is identical
    to the previous ChatOllama factory.
    """
    if not _is_groq_configured():
        return None

    try:
        llm = _make_groq_llm()
        logger.info("LLM client ready: %s (Groq cloud API)", GROQ_MODEL)
        return llm

    except ImportError:
        logger.warning(
            "langchain-groq is not installed. "
            "Run: pip install langchain-groq"
        )
        return None

    except Exception as exc:
        logger.error(
            "Failed to initialise Groq LLM client: %s. "
            "LLM features will return stub responses.",
            exc,
        )
        return None


def llm_available() -> bool:
    """Convenience check for endpoints to decide whether to use LLM or stub."""
    return get_llm() is not None
