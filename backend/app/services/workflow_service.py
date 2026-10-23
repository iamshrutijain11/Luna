"""Workflow application service coordinating workflow execution, state transitions, approvals, and artifacts."""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.core.exceptions import (
    InvalidWorkflowStateException,
    ResourceNotFoundException,
    ValidationException,
)
from backend.app.core.security import verify_safe_path
from backend.app.domain.workflows.artifact_generator import ArtifactGenerator
from backend.app.domain.workflows.state_machine import (
    WorkflowStateMachine,
    STATE_COMPLETED,
    STATE_READY_FOR_REVIEW,
)
from backend.app.domain.workflows.utility_bill_service import UtilityBillDomainService
from backend.app.domain.workflows.warranty_service import WarrantyDomainService
from backend.app.models.approval import Approval
from backend.app.models.workflow import Workflow
from backend.app.repositories.approval_repo import ApprovalRepository
from backend.app.repositories.document_repo import DocumentRepository
from backend.app.repositories.extracted_field_repo import ExtractedFieldRepository
from backend.app.repositories.workflow_repo import WorkflowRepository
from backend.app.schemas.common import ApprovalRequest


class WorkflowService:
    def __init__(self, db: Session):
        self.db = db
        self.workflow_repo = WorkflowRepository(db)
        self.approval_repo = ApprovalRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.field_repo = ExtractedFieldRepository(db)
        self.warranty_service = WarrantyDomainService()
        self.utility_service = UtilityBillDomainService()
        self.artifact_generator = ArtifactGenerator()

    def create_workflow(
        self,
        workflow_type: str,
        linked_document_ids: List[str],
        initial_data: Dict[str, Any],
    ) -> Workflow:
        """Initializes a workflow, analyzes linked documents, and detects missing requirements."""
        if workflow_type not in {"warranty_claim", "utility_bill_assistant"}:
            raise ValidationException(f"Unsupported workflow type: '{workflow_type}'.")

        if not linked_document_ids:
            raise ValidationException("At least one linked document ID is required to initiate a workflow.")

        # Verify all linked documents exist
        docs_facts: List[Tuple[str, List[Dict[str, Any]]]] = []
        for doc_id in linked_document_ids:
            doc = self.doc_repo.get_by_id(doc_id)
            if not doc:
                raise ResourceNotFoundException("Linked Document", doc_id)
            fields = self.field_repo.get_by_document_id(doc_id)
            raw_facts = [
                {
                    "field_name": f.field_name,
                    "field_value": f.field_value,
                    "source_page": f.source_page,
                    "source_excerpt": f.source_excerpt,
                    "extraction_method": f.extraction_method,
                }
                for f in fields
            ]
            docs_facts.append((doc_id, raw_facts))

        if workflow_type == "warranty_claim":
            # Flatten facts from all linked docs (warranty + invoice)
            all_facts = [f for _, facts in docs_facts for f in facts]
            eval_result = self.warranty_service.evaluate_claim(all_facts, initial_data)
        else:
            eval_result = self.utility_service.analyze_bills(docs_facts, initial_data)

        workflow = Workflow(
            workflow_type=workflow_type,
            status=eval_result["status"],
            linked_document_ids=linked_document_ids,
            collected_information=eval_result["collected_information"],
            missing_requirements=eval_result["missing_requirements"],
            generated_artifact_path=None,
        )
        return self.workflow_repo.create(workflow)

    def get_workflow(self, workflow_id: str) -> Workflow:
        wf = self.workflow_repo.get_by_id(workflow_id)
        if not wf:
            raise ResourceNotFoundException("Workflow", workflow_id)
        return wf

    def list_workflows(
        self,
        workflow_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Workflow], int]:
        return self.workflow_repo.list(
            workflow_type=workflow_type,
            status=status,
            limit=limit,
            offset=offset,
        )

    def approve_workflow(
        self,
        workflow_id: str,
        request: ApprovalRequest,
    ) -> Tuple[Approval, Workflow]:
        """
        Validates workflow eligibility for approval.
        Enforces state machine legality.
        Generates official PDF artifact and transitions workflow to completed.
        """
        wf = self.get_workflow(workflow_id)

        # Enforce state machine checks: must be in ready_for_review
        WorkflowStateMachine.verify_approvable(wf.status, request.approved_action)

        # Generate final artifact PDF based on workflow type
        if wf.workflow_type == "warranty_claim":
            artifact_path = self.artifact_generator.generate_warranty_packet(
                workflow_id=wf.id,
                collected_info=wf.collected_information,
                missing_requirements=wf.missing_requirements,
                linked_docs=wf.linked_document_ids,
            )
        else:
            artifact_path = self.artifact_generator.generate_utility_inquiry_letter(
                workflow_id=wf.id,
                collected_info=wf.collected_information,
                missing_requirements=wf.missing_requirements,
                linked_docs=wf.linked_document_ids,
            )

        # Update workflow state to completed
        wf.generated_artifact_path = str(artifact_path)
        wf.status = STATE_COMPLETED
        self.workflow_repo.update(wf)

        # Record approval
        approval = Approval(
            workflow_id=wf.id,
            approved_action=request.approved_action,
            resulting_status=STATE_COMPLETED,
        )
        approval = self.approval_repo.create(approval)

        return approval, wf

    def get_artifact_path(self, workflow_id: str) -> Path:
        """Returns safe path to generated workflow artifact or raises 409 if not approved."""
        wf = self.get_workflow(workflow_id)

        if not wf.generated_artifact_path:
            raise InvalidWorkflowStateException(
                "Workflow artifact has not been generated yet. The workflow must be reviewed and approved first.",
                current_state=wf.status,
                attempted_action="download_artifact",
            )

        target = Path(wf.generated_artifact_path)
        safe_path = verify_safe_path(target, settings.ARTIFACTS_DIR)

        if not safe_path.exists():
            raise ResourceNotFoundException("Workflow Artifact File", workflow_id)

        return safe_path


# ==========================================
# Agent / MCP WorkflowBackendService Bridge
# ==========================================
import uuid
from datetime import datetime, timezone
from backend.app.models.workflow import WorkflowDraft

_WORKFLOWS_DB: Dict[str, WorkflowDraft] = {}


class WorkflowBackendService:
    @staticmethod
    def prepare_workflow(workflow_type: str, document_ids: List[str], parameters: Dict[str, Any]) -> WorkflowDraft:
        workflow_id = f"wf_{workflow_type[:4]}_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()

        if workflow_type == "warranty_claim":
            title = f"Warranty Claim Draft: {parameters.get('product_name', 'Hardware Product')}"
            missing_items = []
            if not parameters.get("defect_description"):
                missing_items.append("Hardware malfunction / defect description")
            if not parameters.get("serial_number"):
                missing_items.append("Product serial number verification")
        elif workflow_type == "billing_inquiry":
            title = f"Billing Inquiry Draft: Account {parameters.get('account_number', 'Customer')}"
            missing_items = []
            if not parameters.get("inquiry_reason"):
                missing_items.append("Specific billing dispute item or surcharge explanation request")
        else:
            title = f"Workflow Draft: {workflow_type}"
            missing_items = []

        draft = WorkflowDraft(
            id=workflow_id,
            workflow_type=workflow_type,
            status="DRAFT_PENDING_USER_APPROVAL",
            title=title,
            document_ids=document_ids,
            parameters=parameters,
            required_missing_items=missing_items,
            created_at=now,
            updated_at=now,
            is_submitted=False,
            is_approved=False,
        )
        _WORKFLOWS_DB[workflow_id] = draft
        return draft

    @staticmethod
    def get_workflow_status(workflow_id: str) -> Optional[WorkflowDraft]:
        return _WORKFLOWS_DB.get(workflow_id)

