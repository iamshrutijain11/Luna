"""
router.py - FastAPI chat router for LifeDesk AI paperwork assistant.
Follows the frozen ChatResponse OpenAPI contract.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from luma_agent.orchestrator import orchestrator, AgentExecutionResult

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, description="Optional existing session ID")
    message: str = Field(..., min_length=1, description="User utterance or query")
    document_ids: Optional[List[str]] = Field(default_factory=list, description="Optional target document IDs")

class Citation(BaseModel):
    document_id: str
    document_title: str
    page: int
    text_snippet: str

class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    citations: List[Citation]
    workflow_id: Optional[str] = None
    suggested_actions: List[str]

class ChatResponseEnvelope(BaseModel):
    success: bool
    data: ChatResponse
    error: Optional[str] = None

agent_router = APIRouter(prefix="/api/assistant", tags=["assistant"])

@agent_router.post(
    "/chat",
    response_model=ChatResponseEnvelope,
    status_code=status.HTTP_200_OK,
    summary="LifeDesk Conversational Turn",
    description="Processes natural conversation turns, retrieves documents, evaluates warranty & billing conditions, drafts workflows, and preserves session context."
)
async def chat_endpoint(request: ChatRequest) -> ChatResponseEnvelope:
    try:
        result: AgentExecutionResult = orchestrator.run_turn(
            conversation_id=request.conversation_id,
            user_message=request.message,
            document_ids=request.document_ids
        )

        chat_data = ChatResponse(
            conversation_id=result.conversation_id,
            message=result.message,
            citations=[Citation(**c) for c in result.citations],
            workflow_id=result.workflow_id,
            suggested_actions=result.suggested_actions
        )

        return ChatResponseEnvelope(
            success=True,
            data=chat_data,
            error=None
        )

    except Exception as e:
        return ChatResponseEnvelope(
            success=False,
            data=ChatResponse(
                conversation_id=request.conversation_id or "unknown",
                message="An error occurred while processing your request. Please try again.",
                citations=[],
                workflow_id=None,
                suggested_actions=["Retry inquiry", "List documents"]
            ),
            error=str(e)
        )
