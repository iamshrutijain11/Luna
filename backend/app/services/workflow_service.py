import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from backend.app.models.workflow import WorkflowDraft

_WORKFLOWS_DB: Dict[str, WorkflowDraft] = {}

class WorkflowBackendService:
    @staticmethod
    def prepare_workflow(workflow_type: str, document_ids: List[str], parameters: Dict[str, Any]) -> WorkflowDraft:
        workflow_id = f"wf_{workflow_type[:4]}_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        
        # Determine title and required missing items based on workflow type
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
            status="DRAFT_PENDING_USER_APPROVAL",  # Strictly never approved or submitted autonomously
            title=title,
            document_ids=document_ids,
            parameters=parameters,
            required_missing_items=missing_items,
            created_at=now,
            updated_at=now,
            is_submitted=False,
            is_approved=False
        )
        _WORKFLOWS_DB[workflow_id] = draft
        return draft

    @staticmethod
    def get_workflow_status(workflow_id: str) -> Optional[WorkflowDraft]:
        return _WORKFLOWS_DB.get(workflow_id)
