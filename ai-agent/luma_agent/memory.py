"""
memory.py - Session memory and turn tracking for LifeDesk Agent.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

def _get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class ConversationTurn(BaseModel):
    turn_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=_get_utc_now_iso)
    user_message: str
    assistant_message: str
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    workflow_id: Optional[str] = None
    suggested_actions: List[str] = Field(default_factory=list)

class ConversationSession(BaseModel):
    conversation_id: str
    created_at: str = Field(default_factory=_get_utc_now_iso)
    updated_at: str = Field(default_factory=_get_utc_now_iso)
    turns: List[ConversationTurn] = Field(default_factory=list)
    active_document_ids: List[str] = Field(default_factory=list)
    active_workflow_id: Optional[str] = None
    session_metadata: Dict[str, Any] = Field(default_factory=dict)

    def add_turn(
        self,
        user_message: str,
        assistant_message: str,
        citations: List[Dict[str, Any]],
        workflow_id: Optional[str] = None,
        suggested_actions: Optional[List[str]] = None
    ) -> ConversationTurn:
        turn = ConversationTurn(
            user_message=user_message,
            assistant_message=assistant_message,
            citations=citations,
            workflow_id=workflow_id,
            suggested_actions=suggested_actions or []
        )
        self.turns.append(turn)
        if workflow_id:
            self.active_workflow_id = workflow_id
        self.updated_at = _get_utc_now_iso()
        return turn

class ConversationMemoryStore:
    def __init__(self, max_sessions: int = 1000):
        self._sessions: Dict[str, ConversationSession] = {}
        self._max_sessions = max_sessions

    def get_or_create_session(self, conversation_id: Optional[str] = None) -> ConversationSession:
        cid = conversation_id or f"conv_{uuid.uuid4().hex[:12]}"
        if cid not in self._sessions:
            if len(self._sessions) >= self._max_sessions:
                oldest_key = next(iter(self._sessions))
                del self._sessions[oldest_key]
            self._sessions[cid] = ConversationSession(conversation_id=cid)
        return self._sessions[cid]

    def get_session(self, conversation_id: str) -> Optional[ConversationSession]:
        return self._sessions.get(conversation_id)

    def save_session(self, session: ConversationSession) -> None:
        self._sessions[session.conversation_id] = session

    def clear(self) -> None:
        self._sessions.clear()

memory_store = ConversationMemoryStore()
