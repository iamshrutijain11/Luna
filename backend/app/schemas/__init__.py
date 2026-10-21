"""Schemas package."""

from backend.app.schemas.common import (
    HealthResponse,
    ErrorDetail,
    ErrorResponse,
    DocumentResponse,
    DocumentListResponse,
    ExtractedFieldResponse,
    DocumentAnalysisResponse,
    WorkflowCreateRequest,
    WorkflowResponse,
    ApprovalRequest,
    ApprovalResponse,
)

__all__ = [
    "HealthResponse",
    "ErrorDetail",
    "ErrorResponse",
    "DocumentResponse",
    "DocumentListResponse",
    "ExtractedFieldResponse",
    "DocumentAnalysisResponse",
    "WorkflowCreateRequest",
    "WorkflowResponse",
    "ApprovalRequest",
    "ApprovalResponse",
]
