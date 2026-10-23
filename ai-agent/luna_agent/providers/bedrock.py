"""
bedrock.py - Amazon Bedrock Provider retained as an optional provider.
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

logger = logging.getLogger("luna_agent.providers.bedrock")

class BedrockProvider(BaseLLMProvider):
    """
    Amazon Bedrock provider (retained as an optional provider).
    Requires AWS credentials; otherwise gracefully reports authentication failure.
    """

    DEFAULT_MODEL = "anthropic.claude-3-haiku-20240307-v1:0"

    def __init__(
        self,
        region_name: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 45.0
    ):
        region = region_name or os.getenv("AWS_REGION", "us-east-1")
        model = model_name or os.getenv("BEDROCK_MODEL_ID") or self.DEFAULT_MODEL
        super().__init__(
            provider_name="bedrock",
            model_name=model,
            timeout_seconds=timeout_seconds
        )
        self.region = region
        self._init_client()

    def _init_client(self):
        try:
            from strands.models import BedrockModel
            self.model = BedrockModel(
                model_id=self.model_name,
                region_name=self.region
            )
        except Exception as e:
            raise ProviderAuthError(
                f"AWS Bedrock initialization failed (credentials/permissions missing): {e}",
                provider_name="bedrock"
            )

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        tools: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> ProviderResponse:
        try:
            from strands import Agent
            agent = Agent(model=self.model, system_prompt=system_prompt)
            result = agent(user_prompt)
            return ProviderResponse(
                text=str(result),
                tool_calls=[],
                raw_response=result,
                model_name=self.model_name
            )
        except Exception as e:
            msg = str(e)
            if "throttling" in msg.lower() or "429" in msg:
                raise ProviderRateLimitError(f"Bedrock throttled: {msg}", provider_name="bedrock")
            elif "accessdenied" in msg.lower() or "credentials" in msg.lower():
                raise ProviderAuthError(f"Bedrock access denied: {msg}", provider_name="bedrock")
            else:
                raise LLMProviderError(f"Bedrock invocation error: {msg}", provider_name="bedrock")
