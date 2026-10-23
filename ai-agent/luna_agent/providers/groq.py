"""
groq.py - Groq API Provider implementation using official groq SDK.
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

logger = logging.getLogger("luna_agent.providers.groq")

class GroqProvider(BaseLLMProvider):
    """
    Groq Cloud API provider supporting fast free-tier inference (e.g. qwen/qwen3.8-27b, openai/gpt-oss-120b).
    """

    DEFAULT_MODEL = "qwen/qwen3.8-27b"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 45.0
    ):
        key = api_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise ProviderAuthError(
                "GROQ_API_KEY is not configured. Set GROQ_API_KEY in your environment.",
                provider_name="groq"
            )

        model = model_name or os.getenv("GROQ_MODEL") or self.DEFAULT_MODEL
        super().__init__(
            provider_name="groq",
            model_name=model,
            timeout_seconds=timeout_seconds
        )
        self.api_key = key
        self._init_client()

    def _init_client(self):
        try:
            from groq import Groq
            self.client = Groq(api_key=self.api_key, timeout=self.timeout_seconds)
        except ImportError:
            raise LLMProviderError(
                "The 'groq' package is required for GroqProvider. Install with: pip install groq",
                provider_name="groq"
            )
        except Exception as e:
            raise ProviderAuthError(f"Failed to initialize Groq Client: {e}", provider_name="groq")

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        tools: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> ProviderResponse:
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for turn in history[-6:]:
                messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
        messages.append({"role": "user", "content": user_prompt})

        def _call_api():
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=1024
                )
                return response
            except Exception as e:
                msg = str(e)
                if "rate_limit" in msg.lower() or "429" in msg:
                    raise ProviderRateLimitError(f"Groq rate limit: {msg}", provider_name="groq")
                elif "authentication" in msg.lower() or "401" in msg:
                    raise ProviderAuthError(f"Groq auth error: {msg}", provider_name="groq")
                elif "not_found" in msg.lower() or "404" in msg:
                    raise ProviderModelError(f"Groq model error: {msg}", provider_name="groq")
                else:
                    raise LLMProviderError(f"Groq API error: {msg}", provider_name="groq")

        raw = self.execute_with_retry(_call_api)
        text = raw.choices[0].message.content if raw.choices else ""
        return ProviderResponse(
            text=text,
            tool_calls=[],
            raw_response=raw,
            model_name=self.model_name
        )
