"""
main.py - LUNA Paperwork Assistant FastAPI Application Entrypoint.

Mounts the AI Agent chat router, MCP Streamable HTTP server,
and complete document vault + workflow management APIs for the frontend.

Run:
    $env:PYTHONPATH=".;ai-agent"
    uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
"""

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

# ────────────────────────────────────────────────────────────────────────────
# AI Agent (Person 3) — imports from luna_agent package (ai-agent/)
# ────────────────────────────────────────────────────────────────────────────
from luna_agent.router import agent_router
from luna_agent.mcp.server import get_mcp_asgi_app

# ────────────────────────────────────────────────────────────────────────────
# Services & Models (Person 2)
# ────────────────────────────────────────────────────────────────────────────
from backend.app.services.extraction import DocumentExtractionService, _DOCUMENTS_DB, _ANALYSES_DB
from backend.app.services.workflow_service import WorkflowBackendService, _WORKFLOWS_DB
from backend.app.models.document import DocumentMetadata, DocumentAnalysis
from backend.app.models.workflow import WorkflowDraft

# Seed sample active workflow draft for demo if empty
if not _WORKFLOWS_DB:
    WorkflowBackendService.prepare_workflow(
        workflow_type="warranty_claim",
        document_ids=["doc_inv_101", "doc_war_102"],
        parameters={
            "product_name": "Dell XPS 15 9530 Laptop",
            "serial_number": "SN-DELL-98721X",
            "purchase_date": "2025-06-15",
            "defect_description": None,
        }
    )

# ────────────────────────────────────────────────────────────────────────────
# FastAPI Application
# ────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LUNA — AI-Powered Paperwork Assistant",
    description=(
        "Amazon Developer Hackathon 2026 — Alexa+ Track. "
        "LUNA helps users understand warranties, compare utility bills, "
        "and prepare document workflows through natural conversation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ────────────────────────────────────────────────────────────────────────────
# CORS Configuration
# ────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=False,  # False when using wildcard or universal access
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────────────────
# AI Agent Chat Router → POST /api/assistant/chat
# ────────────────────────────────────────────────────────────────────────────
app.include_router(agent_router)

# ────────────────────────────────────────────────────────────────────────────
# MCP Streamable HTTP Server → /mcp
# ────────────────────────────────────────────────────────────────────────────
app.mount("/mcp", get_mcp_asgi_app())

# ────────────────────────────────────────────────────────────────────────────
# Health Probe
# ────────────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """Quick liveness probe — returns OK if the server is running."""
    return {"status": "ok", "service": "LUNA-paperwork-assistant", "version": "1.0.0"}


# ────────────────────────────────────────────────────────────────────────────
# Document Vault API Endpoints (called by frontend /api/documents)
# ────────────────────────────────────────────────────────────────────────────
@app.get(
    "/api/documents",
    response_model=List[DocumentMetadata],
    tags=["documents"],
    summary="List all documents in vault"
)
async def list_documents(document_type: Optional[str] = Query(None, description="Filter by document type")):
    return DocumentExtractionService.list_documents(document_type=document_type)


@app.get(
    "/api/documents/{document_id}",
    response_model=DocumentMetadata,
    tags=["documents"],
    summary="Get document metadata"
)
async def get_document(document_id: str):
    doc = DocumentExtractionService.get_document_details(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
    return doc


@app.get(
    "/api/documents/{document_id}/analysis",
    response_model=DocumentAnalysis,
    tags=["documents"],
    summary="Get structured extraction and intelligence"
)
async def get_document_analysis(document_id: str):
    analysis = DocumentExtractionService.get_document_analysis(document_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Analysis for document {document_id} not found")
    return analysis


# ────────────────────────────────────────────────────────────────────────────
# Workflow Management API Endpoints (called by frontend /api/workflows)
# ────────────────────────────────────────────────────────────────────────────
@app.get(
    "/api/workflows",
    response_model=List[WorkflowDraft],
    tags=["workflows"],
    summary="List all active workflows and drafts"
)
async def list_workflows():
    return list(_WORKFLOWS_DB.values())


@app.get(
    "/api/workflows/{workflow_id}",
    response_model=WorkflowDraft,
    tags=["workflows"],
    summary="Get workflow draft status"
)
async def get_workflow(workflow_id: str):
    wf = WorkflowBackendService.get_workflow_status(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    return wf


@app.post(
    "/api/workflows/{workflow_id}/approve",
    response_model=WorkflowDraft,
    tags=["workflows"],
    summary="User explicit authorization to approve and submit a workflow"
)
async def approve_workflow(workflow_id: str):
    wf = WorkflowBackendService.get_workflow_status(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    wf.is_approved = True
    wf.is_submitted = True
    wf.status = "COMPLETED"
    return wf
