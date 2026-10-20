from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.app.models.document import DocumentMetadata, DocumentAnalysis
from backend.app.models.workflow import WorkflowDraft
from backend.app.services.extraction import DocumentExtractionService
from backend.app.services.warranty import WarrantyService, WarrantyCheckResult
from backend.app.services.billing import BillingService, BillAnalysisResult
from backend.app.services.workflow_service import WorkflowBackendService

# Structured Tool Error
class ToolError(BaseModel):
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None

# Input schemas
class ListDocumentsInput(BaseModel):
    document_type: Optional[str] = Field(None, description="Filter by document type (e.g. invoice, warranty, utility_bill)")

class GetDocumentDetailsInput(BaseModel):
    document_id: str = Field(..., description="Unique document ID to retrieve metadata for")

class GetDocumentAnalysisInput(BaseModel):
    document_id: str = Field(..., description="Unique document ID to retrieve extracted fields and evidence")

class CheckWarrantyRequirementsInput(BaseModel):
    document_id: str = Field(..., description="Document ID of the warranty or invoice")
    defect_description: Optional[str] = Field(None, description="Description of the issue or defect encountered")

class AnalyzeBillInput(BaseModel):
    document_id: str = Field(..., description="Document ID of the target utility bill")
    compare_to_document_id: Optional[str] = Field(None, description="Document ID of an earlier utility bill to compare against")

class PrepareWorkflowInput(BaseModel):
    workflow_type: str = Field(..., description="Type of workflow to draft: 'warranty_claim' or 'billing_inquiry'")
    document_ids: List[str] = Field(..., description="List of relevant document IDs supporting the workflow")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Workflow parameters such as defect details, account number, or dispute notes")

class GetWorkflowStatusInput(BaseModel):
    workflow_id: str = Field(..., description="ID of the workflow draft to query")


# Tool implementations with structured error handling
def execute_list_documents(document_type: Optional[str] = None) -> List[Dict[str, Any]]:
    docs = DocumentExtractionService.list_documents(document_type=document_type)
    return [doc.model_dump() for doc in docs]

def execute_get_document_details(document_id: str) -> Dict[str, Any]:
    doc = DocumentExtractionService.get_document_details(document_id)
    if not doc:
        return ToolError(
            error_code="DOCUMENT_NOT_FOUND",
            message=f"Document with ID '{document_id}' was not found in the vault.",
            details={"document_id": document_id}
        ).model_dump()
    return doc.model_dump()

def execute_get_document_analysis(document_id: str) -> Dict[str, Any]:
    analysis = DocumentExtractionService.get_document_analysis(document_id)
    if not analysis:
        return ToolError(
            error_code="ANALYSIS_NOT_FOUND",
            message=f"Extracted analysis for document '{document_id}' does not exist.",
            details={"document_id": document_id}
        ).model_dump()
    return analysis.model_dump()

def execute_check_warranty_requirements(document_id: str, defect_description: Optional[str] = None) -> Dict[str, Any]:
    try:
        result = WarrantyService.check_requirements(document_id=document_id, defect_description=defect_description)
        return result.model_dump()
    except Exception as e:
        return ToolError(
            error_code="WARRANTY_CHECK_FAILED",
            message=str(e),
            details={"document_id": document_id}
        ).model_dump()

def execute_analyze_bill(document_id: str, compare_to_document_id: Optional[str] = None) -> Dict[str, Any]:
    try:
        result = BillingService.analyze_bill(document_id=document_id, compare_to_document_id=compare_to_document_id)
        return result.model_dump()
    except Exception as e:
        return ToolError(
            error_code="BILL_ANALYSIS_FAILED",
            message=str(e),
            details={"document_id": document_id, "compare_to": compare_to_document_id}
        ).model_dump()

def execute_prepare_workflow(workflow_type: str, document_ids: List[str], parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    try:
        if workflow_type not in ["warranty_claim", "billing_inquiry"]:
            return ToolError(
                error_code="INVALID_WORKFLOW_TYPE",
                message=f"Unsupported workflow type '{workflow_type}'. Supported types: ['warranty_claim', 'billing_inquiry']",
                details={"supported_types": ["warranty_claim", "billing_inquiry"]}
            ).model_dump()
        draft = WorkflowBackendService.prepare_workflow(
            workflow_type=workflow_type,
            document_ids=document_ids,
            parameters=parameters or {}
        )
        return draft.model_dump()
    except Exception as e:
        return ToolError(
            error_code="WORKFLOW_PREPARATION_FAILED",
            message=str(e),
            details={"workflow_type": workflow_type}
        ).model_dump()

def execute_get_workflow_status(workflow_id: str) -> Dict[str, Any]:
    draft = WorkflowBackendService.get_workflow_status(workflow_id)
    if not draft:
        return ToolError(
            error_code="WORKFLOW_NOT_FOUND",
            message=f"Workflow with ID '{workflow_id}' was not found.",
            details={"workflow_id": workflow_id}
        ).model_dump()
    return draft.model_dump()
