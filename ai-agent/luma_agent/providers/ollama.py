"""
ollama.py - Local Ollama LLM Provider implementation.
"""

import os
import logging
from typing import Dict, List, Optional, Any
from luma_agent.providers.base import (
    BaseLLMProvider,
    ProviderResponse,
    ToolCallRequest,
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderModelError,
    LLMProviderError
)

logger = logging.getLogger("luma_agent.providers.ollama")

class OllamaProvider(BaseLLMProvider):
    """
    Local Ollama provider requiring no cloud API keys or external credits.
    """

    DEFAULT_MODEL = "llama3.2"

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 60.0
    ):
        host = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = model_name or os.getenv("OLLAMA_MODEL") or self.DEFAULT_MODEL
        super().__init__(
            provider_name="ollama",
            model_name=model,
            timeout_seconds=timeout_seconds
        )
        self.host = host
        self._init_client()

    def _init_client(self):
        try:
            import ollama
            self.client = ollama.Client(host=self.host)
        except ImportError:
            raise LLMProviderError(
                "The 'ollama' package is required for OllamaProvider. Install with: pip install ollama",
                provider_name="ollama"
            )

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

        try:
            response = self.client.chat(
                model=self.model_name,
                messages=messages,
                options={"temperature": 0.2}
            )
            text = response.get("message", {}).get("content", "")
            return ProviderResponse(
                text=text,
                tool_calls=[],
                raw_response=response,
                model_name=self.model_name
            )
        except Exception as e:
            raise LLMProviderError(f"Ollama connection error on {self.host}: {e}", provider_name="ollama")
