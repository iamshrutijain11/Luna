"""ExtractedField SQLAlchemy model."""

import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_value = Column(String(2000), nullable=False)
    source_page = Column(Integer, nullable=True)
    source_excerpt = Column(String(1000), nullable=True)
    extraction_method = Column(String(50), nullable=False, default="digital_pdf")
    confidence_if_available = Column(Float, nullable=True)

    # Relationships
    document = relationship("Document", back_populates="extracted_fields")

    def __repr__(self) -> str:
        return f"<ExtractedField(name={self.field_name}, val={self.field_value[:30]}, doc={self.document_id})>"
