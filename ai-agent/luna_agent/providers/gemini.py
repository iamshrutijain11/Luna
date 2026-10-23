"""
gemini.py - Google Gemini API Provider implementation using official google-genai SDK.
"""

import os
import logging
from typing import Dict, List, Optional, Any
from luna_agent.providers.base import (
    BaseLLMProvider,
    ProviderResponse,
    ToolCallRequest,
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderModelError,
    LLMProviderError
)

logger = logging.getLogger("luna_agent.providers.gemini")

class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini provider using the official google-genai SDK.
    Optimized for free-tier-compatible models (gemini-3.5-flash-lite).
    """

    DEFAULT_MODEL = "gemini-3.5-flash-lite"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 45.0
    ):
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ProviderAuthError(
                "GEMINI_API_KEY is not configured. Please set the GEMINI_API_KEY environment variable.",
                provider_name="gemini"
            )

        model = model_name or os.getenv("GEMINI_MODEL") or self.DEFAULT_MODEL
        super().__init__(
            provider_name="gemini",
            model_name=model,
            timeout_seconds=timeout_seconds
        )
        self.api_key = key
        self._init_client()

    def _init_client(self):
        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
        except ImportError:
            raise LLMProviderError(
                "The 'google-genai' package is required for GeminiProvider. Install with: pip install google-genai",
                provider_name="gemini"
            )
        except Exception as e:
            raise ProviderAuthError(f"Failed to initialize Gemini Client: {e}", provider_name="gemini")

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        tools: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> ProviderResponse:
        from google.genai import types
        from google.genai.errors import APIError

        # Prepare configuration
        config_kwargs: Dict[str, Any] = {
            "system_instruction": system_prompt,
            "max_output_tokens": 1024,
            "temperature": 0.2,
        }

        # Build contents from history and current prompt
        contents = []
        if history:
            for turn in history[-6:]:  # Bounded context window to preserve rate limits
                role = "user" if turn.get("role") == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=turn.get("content", ""))]))
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]))

        def _call_api():
            try:
                config = types.GenerateContentConfig(**config_kwargs)
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config
                )
                return response
            except APIError as api_err:
                status_code = getattr(api_err, "code", None)
                msg = str(api_err)
                if status_code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
                    raise ProviderRateLimitError(
                        f"Gemini API rate limit exceeded: {msg}",
                        provider_name="gemini",
                        retry_after_seconds=30.0
                    )
                elif status_code == 404 or "not found" in msg.lower():
                    raise ProviderModelError(
                        f"Gemini model '{self.model_name}' was not found: {msg}",
                        provider_name="gemini"
                    )
                elif status_code in (401, 403) or "API_KEY_INVALID" in msg:
                    raise ProviderAuthError(
                        f"Gemini authentication failed: {msg}",
                        provider_name="gemini"
                    )
                else:
                    raise LLMProviderError(f"Gemini API Error: {msg}", provider_name="gemini", status_code=status_code)
            except TimeoutError as te:
                raise ProviderTimeoutError(f"Gemini request timed out: {te}", provider_name="gemini")
            except Exception as ex:
                raise LLMProviderError(f"Unexpected error communicating with Gemini: {ex}", provider_name="gemini")

        raw = self.execute_with_retry(_call_api)
        generated_text = raw.text if hasattr(raw, "text") else ""

        return ProviderResponse(
            text=generated_text,
            tool_calls=[],
            raw_response=raw,
            model_name=self.model_name
        )
