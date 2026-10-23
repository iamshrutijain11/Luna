"""
base.py - Base interface, error definitions, and retry logic for LLM providers.
"""

import abc
import time
import logging
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

logger = logging.getLogger("luna_agent.providers")

# Standardized Provider Response
class ToolCallRequest(BaseModel):
    name: str
    arguments: Dict[str, Any]

class ProviderResponse(BaseModel):
    text: Optional[str] = None
    tool_calls: List[ToolCallRequest] = Field(default_factory=list)
    raw_response: Optional[Any] = None
    model_name: str
    tokens_used: Optional[int] = None

# Normalized Provider Error Hierarchy
class LLMProviderError(Exception):
    """Base exception for all provider errors."""
    def __init__(self, message: str, provider_name: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.provider_name = provider_name
        self.status_code = status_code

class ProviderAuthError(LLMProviderError):
    """Raised when authentication credentials (e.g. API key) are missing or invalid."""
    pass

class ProviderRateLimitError(LLMProviderError):
    """Raised when rate limits, token quotas, or concurrency limits are exceeded."""
    def __init__(self, message: str, provider_name: str, retry_after_seconds: Optional[float] = None):
        super().__init__(message, provider_name, status_code=429)
        self.retry_after_seconds = retry_after_seconds

    def friendly_user_message(self) -> str:
        wait_text = f" (wait ~{int(self.retry_after_seconds)}s)" if self.retry_after_seconds else ""
        return (
            f"The {self.provider_name.capitalize()} AI service is currently experiencing high demand or free-tier rate limits{wait_text}. "
            "Please try again shortly."
        )

class ProviderTimeoutError(LLMProviderError):
    """Raised when a request exceeds the configured timeout."""
    pass

class ProviderModelError(LLMProviderError):
    """Raised when the requested model is invalid or unavailable."""
    pass


class BaseLLMProvider(abc.ABC):
    """
    Abstract base class for all LLM providers (Gemini, Groq, Ollama, Bedrock).
    """

    def __init__(
        self,
        provider_name: str,
        model_name: str,
        timeout_seconds: float = 45.0,
        max_retries: int = 2
    ):
        self.provider_name = provider_name
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries

    @abc.abstractmethod
    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        tools: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> ProviderResponse:
        """
        Synchronously or asynchronously generate a completion with optional tool calls.
        """
        pass

    def execute_with_retry(self, callable_func, *args, **kwargs) -> Any:
        """
        Executes callable with bounded exponential backoff for transient errors.
        """
        last_exception = None
        for attempt in range(self.max_retries + 1):
            try:
                return callable_func(*args, **kwargs)
            except ProviderRateLimitError:
                raise  # Propagate rate limit immediately to avoid blocking user threads
            except ProviderAuthError:
                raise  # Never retry authentication failure
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries:
                    sleep_time = min(2.0 ** attempt, 8.0)
                    logger.warning(
                        f"Transient error on {self.provider_name} (attempt {attempt + 1}/{self.max_retries + 1}): {e}. "
                        f"Retrying in {sleep_time}s..."
                    )
                    time.sleep(sleep_time)
                else:
                    break
        raise last_exception
