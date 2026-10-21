"""Workflow models: SQLAlchemy persistence entity and Agent integration DTOs."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, JSON, String
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


# ==========================================
# SQLAlchemy Persistent Entity
# ==========================================
class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="draft")
    linked_document_ids = Column(JSON, nullable=False, default=list)
    collected_information = Column(JSON, nullable=False, default=dict)
    missing_requirements = Column(JSON, nullable=False, default=list)
    generated_artifact_path = Column(String(500), nullable=True)
    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    approvals = relationship(
        "Approval",
        back_populates="workflow",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Workflow(id={self.id}, type={self.workflow_type}, status={self.status})>"


# ==========================================
# Agent / MCP DTO Schemas
# ==========================================
class WorkflowDraft(BaseModel):
    id: str
    workflow_type: str  # 'warranty_claim', 'billing_inquiry'
    status: str = "DRAFT_PENDING_USER_APPROVAL"  # Never auto-submitted or approved
    title: str
    document_ids: List[str]
    parameters: Dict[str, Any]
    required_missing_items: List[str] = Field(default_factory=list)
    created_at: str
    updated_at: str
    is_submitted: bool = False
    is_approved: bool = False
