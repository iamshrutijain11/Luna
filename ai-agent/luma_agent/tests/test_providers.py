"""
test_providers.py - Comprehensive Unit & Integration Tests for Configurable LLM Providers.
Tests provider selection, authentication validation, error normalization, rate-limit backoff,
mocked Gemini generation, and live Gemini connectivity if configured.
"""

import os
import pytest
from unittest.mock import MagicMock, patch
from dotenv import load_dotenv

# Load .env for live tests if configured
load_dotenv()

from luma_agent.providers import (
    get_llm_provider,
    BaseLLMProvider,
    GeminiProvider,
    GroqProvider,
    OllamaProvider,
    BedrockProvider,
    LLMProviderError,
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderModelError,
    SUPPORTED_PROVIDERS
)

# ============================================================================
# 1. PROVIDER SELECTION & FACTORY TESTS
# ============================================================================

def test_supported_providers_registered():
    """Verify all 4 required providers are registered in factory."""
    assert "gemini" in SUPPORTED_PROVIDERS
    assert "groq" in SUPPORTED_PROVIDERS
    assert "ollama" in SUPPORTED_PROVIDERS
    assert "bedrock" in SUPPORTED_PROVIDERS

def test_invalid_provider_selection():
    """Verify invalid provider raises LLMProviderError with choices."""
    with pytest.raises(LLMProviderError) as exc_info:
        get_llm_provider(provider_name="unsupported_provider_xyz")
    assert "unsupported_provider_xyz" in str(exc_info.value).lower()
    assert "gemini" in str(exc_info.value).lower()

def test_gemini_missing_api_key_raises_auth_error():
    """Verify GeminiProvider raises ProviderAuthError when GEMINI_API_KEY is missing."""
    with patch.dict(os.environ, {}, clear=True):
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
        with pytest.raises(ProviderAuthError) as exc_info:
            GeminiProvider(api_key=None)
        assert "GEMINI_API_KEY is not configured" in str(exc_info.value)
        assert exc_info.value.provider_name == "gemini"

def test_groq_missing_api_key_raises_auth_error():
    """Verify GroqProvider raises ProviderAuthError when GROQ_API_KEY is missing."""
    with patch.dict(os.environ, {}, clear=True):
        if "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]
        with pytest.raises(ProviderAuthError) as exc_info:
            GroqProvider(api_key=None)
        assert "GROQ_API_KEY is not configured" in str(exc_info.value)

def test_ollama_provider_instantiation():
    """Verify OllamaProvider initializes without API keys."""
    provider = OllamaProvider(base_url="http://localhost:11434", model_name="llama3.2")
    assert provider.provider_name == "ollama"
    assert provider.model_name == "llama3.2"
    assert provider.host == "http://localhost:11434"

def test_gemini_provider_with_key():
    """Verify GeminiProvider initializes correctly with a mock key."""
    with patch("google.genai.Client") as mock_client_cls:
        provider = GeminiProvider(api_key="mock_test_key_12345", model_name="gemini-2.5-flash")
        assert provider.provider_name == "gemini"
        assert provider.model_name == "gemini-2.5-flash"
        mock_client_cls.assert_called_once_with(api_key="mock_test_key_12345")

# ============================================================================
# 2. ERROR NORMALIZATION & RATE LIMIT HANDLING TESTS
# ============================================================================

def test_rate_limit_error_friendly_message():
    """Verify ProviderRateLimitError formats a polite non-blocking message for users."""
    err = ProviderRateLimitError("Quota exceeded", provider_name="gemini", retry_after_seconds=20.0)
    assert err.status_code == 429
    msg = err.friendly_user_message()
    assert "Gemini AI service is currently experiencing high demand" in msg
    assert "wait ~20s" in msg

def test_retry_mechanism_exponential_backoff():
    """Verify execute_with_retry retries on transient errors and eventually succeeds."""
    provider = OllamaProvider(base_url="http://localhost:11434", model_name="llama3.2")
    provider.max_retries = 2

    attempts = {"count": 0}
    def mock_flaky_func():
        attempts["count"] += 1
        if attempts["count"] < 2:
            raise ConnectionResetError("Transient network drop")
        return "Success on attempt 2"

    result = provider.execute_with_retry(mock_flaky_func)
    assert result == "Success on attempt 2"
    assert attempts["count"] == 2

def test_retry_mechanism_does_not_retry_auth_errors():
    """Verify authentication errors fail immediately without waiting or retrying."""
    provider = OllamaProvider(base_url="http://localhost:11434", model_name="llama3.2")
    provider.max_retries = 3

    attempts = {"count": 0}
    def mock_auth_fail():
        attempts["count"] += 1
        raise ProviderAuthError("Invalid credentials", provider_name="test")

    with pytest.raises(ProviderAuthError):
        provider.execute_with_retry(mock_auth_fail)
    assert attempts["count"] == 1  # Exactly 1 attempt!

# ============================================================================
# 3. MOCKED GEMINI GENERATION & REASONING
# ============================================================================

def test_gemini_generation_mocked():
    """Verify GeminiProvider formats prompt contents and extracts text."""
    with patch("google.genai.Client") as mock_client_cls:
        mock_instance = MagicMock()
        mock_client_cls.return_value = mock_instance

        mock_raw_resp = MagicMock()
        mock_raw_resp.text = "This is a verified response about laptop warranty coverage."
        mock_instance.models.generate_content.return_value = mock_raw_resp

        provider = GeminiProvider(api_key="mock_key", model_name="gemini-2.5-flash")
        resp = provider.generate(
            system_prompt="You are LifeDesk.",
            user_prompt="Can I claim my warranty?",
            history=[{"role": "user", "content": "Hello"}]
        )

        assert resp.text == "This is a verified response about laptop warranty coverage."
        assert resp.model_name == "gemini-2.5-flash"
        assert mock_instance.models.generate_content.called

# ============================================================================
# 4. LIVE GEMINI INTEGRATION TEST (AUTHENTICATED ONLY)
# ============================================================================

def test_live_gemini_integration():
    """
    Genuine live integration test using configured GEMINI_API_KEY.
    If GEMINI_API_KEY is not set, honestly skips without faking success.
    """
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        pytest.skip("Live Gemini integration skipped: GEMINI_API_KEY environment variable is not configured.")

    provider = GeminiProvider(api_key=key, model_name=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"))
    resp = provider.generate(
        system_prompt="You are a helpful paperwork assistant.",
        user_prompt="Reply with the exact word: LIFEDESK_ONLINE"
    )
    assert resp.text is not None
    assert len(resp.text) > 0
    print(f"\n[LIVE GEMINI SUCCESS] Model: {provider.model_name}, Response: {resp.text.strip()}")

def test_live_groq_integration():
    """
    Genuine live integration test using configured GROQ_API_KEY.
    If GROQ_API_KEY is not set, honestly skips without faking success.
    """
    key = os.getenv("GROQ_API_KEY")
    if not key:
        pytest.skip("Live Groq integration skipped: GROQ_API_KEY environment variable is not configured.")

    provider = GroqProvider(api_key=key, model_name=os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"))
    resp = provider.generate(
        system_prompt="You are a helpful paperwork assistant.",
        user_prompt="Reply with the exact word: LIFEDESK_GROQ_ONLINE"
    )
    assert resp.text is not None
    assert len(resp.text) > 0
    print(f"\n[LIVE GROQ SUCCESS] Model: {provider.model_name}, Response: {resp.text.strip()}")
