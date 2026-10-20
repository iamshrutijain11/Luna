"""
factory.py - LLM Provider Factory controlled by environment configuration.
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv

# Automatically load environment variables from .env
load_dotenv()

from luma_agent.providers.base import BaseLLMProvider, LLMProviderError
from luma_agent.providers.gemini import GeminiProvider
from luma_agent.providers.groq import GroqProvider
from luma_agent.providers.ollama import OllamaProvider
from luma_agent.providers.bedrock import BedrockProvider

logger = logging.getLogger("luma_agent.providers.factory")

SUPPORTED_PROVIDERS = {
    "gemini": GeminiProvider,
    "groq": GroqProvider,
    "ollama": OllamaProvider,
    "bedrock": BedrockProvider,
}

def get_llm_provider(
    provider_name: Optional[str] = None,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None,
    timeout_seconds: float = 45.0
) -> BaseLLMProvider:
    """
    Factory function to instantiate the configured LLM provider.
    Defaults to 'gemini' per project primary objective.
    """
    name = (provider_name or os.getenv("LLM_PROVIDER", "gemini")).strip().lower()

    if name not in SUPPORTED_PROVIDERS:
        supported = ", ".join(SUPPORTED_PROVIDERS.keys())
        raise LLMProviderError(
            f"Unsupported LLM provider '{name}'. Supported providers: [{supported}]",
            provider_name=name
        )

    provider_cls = SUPPORTED_PROVIDERS[name]

    if name == "gemini":
        return GeminiProvider(api_key=api_key, model_name=model_name, timeout_seconds=timeout_seconds)
    elif name == "groq":
        return GroqProvider(api_key=api_key, model_name=model_name, timeout_seconds=timeout_seconds)
    elif name == "ollama":
        return OllamaProvider(model_name=model_name, timeout_seconds=timeout_seconds)
    elif name == "bedrock":
        return BedrockProvider(model_name=model_name, timeout_seconds=timeout_seconds)
    else:
        raise LLMProviderError(f"Unknown provider '{name}'", provider_name=name)
