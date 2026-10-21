"""Pydantic V2 schemas for common, document, workflow, and approval contracts."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class DocumentResponse(BaseModel):
    id: str
    original_filename: str
    document_type: str
    mime_type: str
    size_bytes: int
    status: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    limit: int
    offset: int


class ExtractedFieldResponse(BaseModel):
    id: str
    document_id: str
    field_name: str
    field_value: str
    source_page: Optional[int] = None
    source_excerpt: Optional[str] = None
    extraction_method: str = "digital_pdf"
    confidence_if_available: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentAnalysisResponse(BaseModel):
    document_id: str
    document_type: str
    status: str
    extracted_fields: List[ExtractedFieldResponse]
    summary: Dict[str, Any] = Field(default_factory=dict)


class WorkflowCreateRequest(BaseModel):
    workflow_type: str
    linked_document_ids: List[str]
    initial_data: Dict[str, Any] = Field(default_factory=dict)


class WorkflowResponse(BaseModel):
    id: str
    workflow_type: str
    status: str
    linked_document_ids: List[str]
    collected_information: Dict[str, Any] = Field(default_factory=dict)
    missing_requirements: List[str] = Field(default_factory=list)
    generated_artifact_path: Optional[str] = None
    artifact_available: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApprovalRequest(BaseModel):
    approved_action: str
    notes: Optional[str] = None


class ApprovalResponse(BaseModel):
    approval_id: str
    workflow_id: str
    approved_action: str
    approved_at: datetime
    resulting_status: str
    workflow: WorkflowResponse

    model_config = ConfigDict(from_attributes=True)
