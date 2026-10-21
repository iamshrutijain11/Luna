"""Approval SQLAlchemy model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    approved_action = Column(String(100), nullable=False)
    approved_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    resulting_status = Column(String(50), nullable=False)

    # Relationships
    workflow = relationship("Workflow", back_populates="approvals")

    def __repr__(self) -> str:
        return f"<Approval(id={self.id}, workflow={self.workflow_id}, action={self.approved_action})>"
