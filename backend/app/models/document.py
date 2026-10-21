"""Document models: SQLAlchemy persistence entity and Agent integration DTOs."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


# ==========================================
# SQLAlchemy Persistent Entity
# ==========================================
class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False, default="unknown")
    mime_type = Column(String(100), nullable=False)
    storage_path = Column(String(500), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="uploaded")
    uploaded_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    extracted_fields = relationship(
        "ExtractedField",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name={self.original_filename}, status={self.status})>"


# ==========================================
# Agent / MCP DTO Schemas
# ==========================================
class DocumentMetadata(BaseModel):
    id: str
    title: str
    document_type: str  # e.g., 'invoice', 'warranty', 'utility_bill', 'claim'
    file_name: str
    upload_date: str
    page_count: int
    status: str = "PROCESSED"
    tags: List[str] = Field(default_factory=list)


class ExtractedField(BaseModel):
    key: str
    value: Any
    confidence: float
    page: int
    raw_text: str


class DocumentAnalysis(BaseModel):
    document_id: str
    document_type: str
    title: str
    page_count: int
    summary: str
    fields: Dict[str, ExtractedField] = Field(default_factory=dict)
    raw_text_by_page: Dict[int, str] = Field(default_factory=dict)
