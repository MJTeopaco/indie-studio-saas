"""
conftest.py
================================================================================
pytest configuration for the ml-engine test suite.

Sets environment variables before any tests run to prevent langsmith/langchain
tracing plugins from making outbound network connections during CI test runs.
================================================================================
"""

import os

# Disable LangSmith tracing so the langsmith pytest plugin doesn't attempt
# to connect to external servers during test runs.
os.environ.setdefault("LANGCHAIN_TRACING_V2", "false")
os.environ.setdefault("LANGCHAIN_TRACING", "false")
os.environ.setdefault("LANGSMITH_TRACING", "false")
os.environ.setdefault("LANGSMITH_TEST_TRACKING", "false")
os.environ.setdefault("LANGSMITH_API_KEY", "")

