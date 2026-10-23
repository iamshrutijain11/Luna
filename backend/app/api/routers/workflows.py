"""Workflows API router handling lifecycle management, review, approvals, and artifact downloads."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse

from backend.app.api.dependencies import get_workflow_service
from backend.app.schemas.common import (
    ApprovalRequest,
    ApprovalResponse,
    WorkflowCreateRequest,
    WorkflowListResponse,
    WorkflowResponse,
)
from backend.app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/workflows", tags=["Workflows"])


def _to_workflow_response(wf) -> WorkflowResponse:
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


@router.post(
    "",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new action workflow",
)
def create_workflow(
    request: WorkflowCreateRequest,
    service: WorkflowService = Depends(get_workflow_service),
) -> WorkflowResponse:
    wf = service.create_workflow(
        workflow_type=request.workflow_type,
        linked_document_ids=request.linked_document_ids,
        initial_data=request.initial_data,
    )
    return _to_workflow_response(wf)


@router.get(
    "/{id}",
    response_model=WorkflowResponse,
    summary="Get workflow details",
)
def get_workflow(
    id: str,
    service: WorkflowService = Depends(get_workflow_service),
) -> WorkflowResponse:
    wf = service.get_workflow(id)
    return _to_workflow_response(wf)


@router.get(
    "",
    response_model=WorkflowListResponse,
    summary="List workflows",
)
def list_workflows(
    workflow_type: Optional[str] = Query(None, description="Filter by workflow type (warranty_claim, utility_bill_assistant)"),
    status: Optional[str] = Query(None, description="Filter by status (draft, needs_information, ready_for_review, approved, completed, failed)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: WorkflowService = Depends(get_workflow_service),
) -> WorkflowListResponse:
    items, total = service.list_workflows(
        workflow_type=workflow_type,
        status=status,
        limit=limit,
        offset=offset,
    )
    return WorkflowListResponse(
        items=[_to_workflow_response(wf) for wf in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/{id}/approve",
    response_model=ApprovalResponse,
    summary="Approve workflow and generate final artifact",
)
def approve_workflow(
    id: str,
    request: ApprovalRequest,
    service: WorkflowService = Depends(get_workflow_service),
) -> ApprovalResponse:
    approval, wf = service.approve_workflow(id, request)
    return ApprovalResponse(
        approval_id=approval.id,
        workflow_id=approval.workflow_id,
        approved_action=approval.approved_action,
        approved_at=approval.approved_at,
        resulting_status=approval.resulting_status,
        workflow=_to_workflow_response(wf),
    )


@router.get(
    "/{id}/artifact",
    summary="Download generated PDF artifact",
)
def download_workflow_artifact(
    id: str,
    service: WorkflowService = Depends(get_workflow_service),
) -> FileResponse:
    artifact_path = service.get_artifact_path(id)
    return FileResponse(
        path=artifact_path,
        media_type="application/pdf",
        filename=artifact_path.name,
    )
