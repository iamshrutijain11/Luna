"""Document application service coordinating validation, storage, database records, and extraction."""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.core.exceptions import ResourceNotFoundException
from backend.app.core.security import (
    generate_safe_storage_filename,
    validate_file_content,
    verify_safe_path,
)
from backend.app.domain.extraction.engine import ExtractionEngine
from backend.app.models.document import Document
from backend.app.repositories.document_repo import DocumentRepository
from backend.app.repositories.extracted_field_repo import ExtractedFieldRepository
from backend.app.schemas.common import DocumentAnalysisResponse, ExtractedFieldResponse


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.field_repo = ExtractedFieldRepository(db)
        self.extractor = ExtractionEngine()

    def upload_and_process(
        self,
        content: bytes,
        original_filename: str,
        user_hint: Optional[str] = None,
    ) -> Document:
        """
        Executes file upload pipeline:
        1. Validates content (size, extension, magic signature)
        2. Generates safe unique filename
        3. Saves outside public directories
        4. Creates Document DB record
        5. Triggers extraction & records provenance fields
        6. Updates document status
        """
        mime_type, safe_original_name = validate_file_content(content, original_filename)
        safe_storage_name, _ = generate_safe_storage_filename(safe_original_name)
        storage_path = settings.DOCUMENTS_DIR / safe_storage_name

        # Write safely to disk
        with open(storage_path, "wb") as f:
            f.write(content)

        # Register document in database
        doc = Document(
            original_filename=safe_original_name,
            document_type=user_hint or "unknown",
            mime_type=mime_type,
            storage_path=str(storage_path),
            size_bytes=len(content),
            status="processing",
        )
        doc = self.doc_repo.create(doc)

        try:
            # Extract content & provenance
            extraction_res = self.extractor.process_document(
                doc_id=doc.id,
                file_path=storage_path,
                mime_type=mime_type,
                user_hint=user_hint,
            )

            # Persist extracted fields
            if extraction_res.fields:
                self.field_repo.create_many(extraction_res.fields)

            # Update document status and classified type
            final_type = extraction_res.document_type or user_hint or "unknown"
            doc = self.doc_repo.update_status(
                doc_id=doc.id,
                status=extraction_res.status,
                document_type=final_type,
            )
            return doc
        except Exception:
            # Mark document as failed if unhandled extraction error occurs
            self.doc_repo.update_status(doc.id, "failed")
            raise

    def get_document(self, doc_id: str) -> Document:
        doc = self.doc_repo.get_by_id(doc_id)
        if not doc:
            raise ResourceNotFoundException("Document", doc_id)
        return doc

    def list_documents(
        self,
        status: Optional[str] = None,
        document_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Document], int]:
        return self.doc_repo.list(
            status=status,
            document_type=document_type,
            limit=limit,
            offset=offset,
        )

    def get_document_file_path(self, doc_id: str) -> Tuple[Path, str, str]:
        """Returns safe verified (Path, mime_type, original_filename)."""
        doc = self.get_document(doc_id)
        target_path = Path(doc.storage_path)
        safe_path = verify_safe_path(target_path, settings.DOCUMENTS_DIR)
        return safe_path, doc.mime_type, doc.original_filename

    def get_document_analysis(self, doc_id: str) -> DocumentAnalysisResponse:
        doc = self.get_document(doc_id)
        fields = self.field_repo.get_by_document_id(doc_id)

        field_responses = [
            ExtractedFieldResponse.model_validate(f) for f in fields
        ]

        summary: Dict[str, Any] = {
            "total_extracted_fields": len(fields),
            "document_status": doc.status,
            "document_type": doc.document_type,
            "filename": doc.original_filename,
        }

        return DocumentAnalysisResponse(
            document_id=doc.id,
            document_type=doc.document_type,
            status=doc.status,
            extracted_fields=field_responses,
            summary=summary,
        )
