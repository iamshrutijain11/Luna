"""Document repository for database operations on Document entities."""

from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.models.document import Document


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, document: Document) -> Document:
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def get_by_id(self, doc_id: str) -> Optional[Document]:
        stmt = select(Document).where(Document.id == doc_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        status: Optional[str] = None,
        document_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Document], int]:
        query = select(Document)
        count_query = select(func.count(Document.id))

        if status:
            query = query.where(Document.status == status)
            count_query = count_query.where(Document.status == status)
        if document_type:
            query = query.where(Document.document_type == document_type)
            count_query = count_query.where(Document.document_type == document_type)

        total = self.db.execute(count_query).scalar() or 0
        items = self.db.execute(
            query.order_by(Document.uploaded_at.desc()).offset(offset).limit(limit)
        ).scalars().all()

        return list(items), total

    def update_status(
        self,
        doc_id: str,
        status: str,
        document_type: Optional[str] = None,
    ) -> Optional[Document]:
        doc = self.get_by_id(doc_id)
        if not doc:
            return None
        doc.status = status
        if document_type:
            doc.document_type = document_type
        self.db.commit()
        self.db.refresh(doc)
        return doc
