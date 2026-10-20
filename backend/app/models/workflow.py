from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

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
