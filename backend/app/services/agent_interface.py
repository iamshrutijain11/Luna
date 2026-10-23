"""Agent service interfaces provided for Person 3 (backend/app/agent/**).

Exposes clean, strictly typed interfaces and Pydantic return models for:
- list_documents()
- get_document_details()
- get_document_analysis()
- check_warranty_requirements()
- analyze_bill()
- prepare_workflow()
- get_workflow_status()
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.schemas.common import (
    DocumentAnalysisResponse,
    DocumentListResponse,
    DocumentResponse,
    WorkflowListResponse,
    WorkflowResponse,
)
from backend.app.services.document_service import DocumentService
from backend.app.services.workflow_service import WorkflowService


class AgentServiceBridge:
    """Callable typed interfaces for Agent / MCP integration."""

    def __init__(self, db: Optional[Session] = None):
        self._external_db = db

    def _get_session(self) -> Session:
        return self._external_db if self._external_db is not None else SessionLocal()

    def list_documents(
        self,
        status: Optional[str] = None,
        document_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> DocumentListResponse:
        """Lists uploaded documents with optional filtering by status and document type."""
        db = self._get_session()
        try:
            svc = DocumentService(db)
            items, total = svc.list_documents(
                status=status,
                document_type=document_type,
                limit=limit,
                offset=offset,
            )
            return DocumentListResponse(
                items=[DocumentResponse.model_validate(d) for d in items],
                total=total,
                limit=limit,
                offset=offset,
            )
        finally:
            if self._external_db is None:
                db.close()

    def get_document_details(self, document_id: str) -> DocumentResponse:
        """Fetches metadata, MIME type, and processing status for a single document."""
        db = self._get_session()
        try:
            svc = DocumentService(db)
            doc = svc.get_document(document_id)
            return DocumentResponse.model_validate(doc)
        finally:
            if self._external_db is None:
                db.close()

    def get_document_analysis(self, document_id: str) -> DocumentAnalysisResponse:
        """Returns provenance-backed extracted fields and document summary."""
        db = self._get_session()
        try:
            svc = DocumentService(db)
            return svc.get_document_analysis(document_id)
        finally:
            if self._external_db is None:
                db.close()

    def check_warranty_requirements(
        self,
        document_id: str,
        issue_description: Optional[str] = None,
        user_inputs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates warranty terms, date-based eligibility, exclusions,
        and missing requirements against a document.
        """
        db = self._get_session()
        try:
            doc_svc = DocumentService(db)
            wf_svc = WorkflowService(db)
            doc = doc_svc.get_document(document_id)
            fields = doc_svc.field_repo.get_by_document_id(document_id)
            raw_facts = [
                {
                    "field_name": f.field_name,
                    "field_value": f.field_value,
                    "source_page": f.source_page,
                    "source_excerpt": f.source_excerpt,
                }
                for f in fields
            ]
            inputs = dict(user_inputs or {})
            if issue_description:
                inputs["issue_description"] = issue_description

            return wf_svc.warranty_service.evaluate_claim(raw_facts, inputs)
        finally:
            if self._external_db is None:
                db.close()

    def analyze_bill(
        self,
        document_id: str,
        compare_with_document_id: Optional[str] = None,
        user_inputs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes a utility bill, extracting totals, usage, due dates,
        and performing comparative delta calculations if a second bill is provided.
        """
        db = self._get_session()
        try:
            doc_svc = DocumentService(db)
            wf_svc = WorkflowService(db)

            doc_ids = [document_id]
            if compare_with_document_id:
                doc_ids.append(compare_with_document_id)

            docs_facts = []
            for d_id in doc_ids:
                fields = doc_svc.field_repo.get_by_document_id(d_id)
                raw_facts = [
                    {"field_name": f.field_name, "field_value": f.field_value}
                    for f in fields
                ]
                docs_facts.append((d_id, raw_facts))

            return wf_svc.utility_service.analyze_bills(docs_facts, user_inputs or {})
        finally:
            if self._external_db is None:
                db.close()

    def prepare_workflow(
        self,
        workflow_type: str,
        document_ids: List[str],
        parameters: Optional[Dict[str, Any]] = None,
    ) -> WorkflowResponse:
        """Initializes a workflow with linked documents and evaluates required information."""
        db = self._get_session()
        try:
            svc = WorkflowService(db)
            wf = svc.create_workflow(
                workflow_type=workflow_type,
                linked_document_ids=document_ids,
                initial_data=parameters or {},
            )
            return WorkflowResponse(
                id=wf.id,
                workflow_type=wf.workflow_type,
                status=wf.status,
                linked_document_ids=wf.linked_document_ids,
                collected_information=wf.collected_information,
                missing_requirements=wf.missing_requirements,
                generated_artifact_path=wf.generated_artifact_path,
                artifact_available=bool(wf.generated_artifact_path),
                created_at=wf.created_at,
                updated_at=wf.updated_at,
            )
        finally:
            if self._external_db is None:
                db.close()

    def get_workflow_status(self, workflow_id: str) -> WorkflowResponse:
        """Retrieves workflow status, collected data, and artifact availability."""
        db = self._get_session()
        try:
            svc = WorkflowService(db)
            wf = svc.get_workflow(workflow_id)
            return WorkflowResponse(
                id=wf.id,
                workflow_type=wf.workflow_type,
                status=wf.status,
                linked_document_ids=wf.linked_document_ids,
                collected_information=wf.collected_information,
                missing_requirements=wf.missing_requirements,
                generated_artifact_path=wf.generated_artifact_path,
                artifact_available=bool(wf.generated_artifact_path),
                created_at=wf.created_at,
                updated_at=wf.updated_at,
            )
        finally:
            if self._external_db is None:
                db.close()

    def list_workflows(
        self,
        workflow_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> WorkflowListResponse:
        """Lists all workflows with optional type and status filtering."""
        db = self._get_session()
        try:
            svc = WorkflowService(db)
            items, total = svc.list_workflows(
                workflow_type=workflow_type,
                status=status,
                limit=limit,
                offset=offset,
            )
            return WorkflowListResponse(
                items=[
                    WorkflowResponse(
                        id=wf.id,
                        workflow_type=wf.workflow_type,
                        status=wf.status,
                        linked_document_ids=wf.linked_document_ids,
                        collected_information=wf.collected_information,
                        missing_requirements=wf.missing_requirements,
                        generated_artifact_path=wf.generated_artifact_path,
                        artifact_available=bool(wf.generated_artifact_path),
                        created_at=wf.created_at,
                        updated_at=wf.updated_at,
                    )
                    for wf in items
                ],
                total=total,
                limit=limit,
                offset=offset,
            )
        finally:
            if self._external_db is None:
                db.close()


# Standalone function interfaces for direct imports
_default_bridge = AgentServiceBridge()


def list_documents(
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> DocumentListResponse:
    return _default_bridge.list_documents(status, document_type, limit, offset)


def get_document_details(document_id: str) -> DocumentResponse:
    return _default_bridge.get_document_details(document_id)


def get_document_analysis(document_id: str) -> DocumentAnalysisResponse:
    return _default_bridge.get_document_analysis(document_id)


def check_warranty_requirements(
    document_id: str,
    issue_description: Optional[str] = None,
    user_inputs: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return _default_bridge.check_warranty_requirements(document_id, issue_description, user_inputs)


def analyze_bill(
    document_id: str,
    compare_with_document_id: Optional[str] = None,
    user_inputs: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return _default_bridge.analyze_bill(document_id, compare_with_document_id, user_inputs)


def prepare_workflow(
    workflow_type: str,
    document_ids: List[str],
    parameters: Optional[Dict[str, Any]] = None,
) -> WorkflowResponse:
    return _default_bridge.prepare_workflow(workflow_type, document_ids, parameters)


def get_workflow_status(workflow_id: str) -> WorkflowResponse:
    return _default_bridge.get_workflow_status(workflow_id)


def list_workflows(
    workflow_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> WorkflowListResponse:
    return _default_bridge.list_workflows(workflow_type, status, limit, offset)
