"""ExtractedField repository for database operations on ExtractedField entities."""

from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.extracted_field import ExtractedField


class ExtractedFieldRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_many(self, fields: List[ExtractedField]) -> List[ExtractedField]:
        if not fields:
            return []
        self.db.add_all(fields)
        self.db.commit()
        for f in fields:
            self.db.refresh(f)
        return fields

    def get_by_document_id(self, document_id: str) -> List[ExtractedField]:
        stmt = (
            select(ExtractedField)
            .where(ExtractedField.document_id == document_id)
            .order_by(ExtractedField.source_page.asc().nullsfirst(), ExtractedField.field_name.asc())
        )
        return list(self.db.execute(stmt).scalars().all())
