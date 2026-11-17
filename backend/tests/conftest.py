import pytest
from backend.config import settings

@pytest.fixture(autouse=True)
def force_mock_for_unit_tests(monkeypatch):
    """
    Ensures unit tests run deterministically against the mock engine
    without consuming live Groq API tokens or triggering rate limits.
    Live Groq verification is performed via backend/tests/verify_live.py.
    """
    monkeypatch.setattr(settings, "MOCK_LLM", True)
