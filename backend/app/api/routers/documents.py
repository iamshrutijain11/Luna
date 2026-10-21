"""Documents API router handling file uploads, listing, download, and extraction analysis."""

from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import FileResponse

from backend.app.api.dependencies import get_document_service
from backend.app.schemas.common import (
    DocumentAnalysisResponse,
    DocumentListResponse,
    DocumentResponse,
)
from backend.app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process document",
)
async def upload_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form("unknown"),
    service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    content = await file.read()
    doc = service.upload_and_process(
        content=content,
        original_filename=file.filename or "uploaded_file",
        user_hint=document_type,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List documents",
)
def list_documents(
    status: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: DocumentService = Depends(get_document_service),
) -> DocumentListResponse:
    items, total = service.list_documents(
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


@router.get(
    "/{id}",
    response_model=DocumentResponse,
    summary="Get document details",
)
def get_document(
    id: str,
    service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    doc = service.get_document(id)
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{id}/download",
    summary="Download raw document file",
)
def download_document(
    id: str,
    service: DocumentService = Depends(get_document_service),
) -> FileResponse:
    path, mime_type, filename = service.get_document_file_path(id)
    return FileResponse(
        path=path,
        media_type=mime_type,
        filename=filename,
    )


@router.get(
    "/{id}/analysis",
    response_model=DocumentAnalysisResponse,
    summary="Get document extraction analysis",
)
def get_document_analysis(
    id: str,
    service: DocumentService = Depends(get_document_service),
) -> DocumentAnalysisResponse:
    return service.get_document_analysis(id)
