"""
server.py - Model Context Protocol (MCP) server for Luma Paperwork Assistant.
Uses the modern Streamable HTTP transport per the latest MCP specification.
Exposes a mountable ASGI application for FastAPI/Starlette integration.
"""

from typing import Optional, List, Dict, Any
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette

from backend.app.agent.mcp.tools import (
    execute_list_documents,
    execute_get_document_details,
    execute_get_document_analysis,
    execute_check_warranty_requirements,
    execute_analyze_bill,
    execute_prepare_workflow,
    execute_get_workflow_status
)

# Initialize FastMCP Server
mcp_server = FastMCP(
    name="Luma-Document-Assistant-MCP",
    instructions="MCP server providing structured paperwork retrieval, analysis, and workflow preparation tools."
)

@mcp_server.tool(name="list_documents")
def list_documents(document_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Return stored document metadata from the vault.
    Supports optional type filtering (e.g. 'invoice', 'warranty', 'utility_bill').
    """
    return execute_list_documents(document_type=document_type)

@mcp_server.tool(name="get_document_details")
def get_document_details(document_id: str) -> Dict[str, Any]:
    """
    Retrieve one document's metadata (id, title, document_type, file_name, upload_date, status, tags).
    """
    return execute_get_document_details(document_id=document_id)

@mcp_server.tool(name="get_document_analysis")
def get_document_analysis(document_id: str) -> Dict[str, Any]:
    """
    Retrieve extracted structured fields, key-value pairs, confidence scores, and raw page text evidence.
    """
    return execute_get_document_analysis(document_id=document_id)

@mcp_server.tool(name="check_warranty_requirements")
def check_warranty_requirements(document_id: str, defect_description: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve verified warranty conditions, check policy coverage against exclusions,
    and return missing requirements and uncertainties.
    """
    return execute_check_warranty_requirements(document_id=document_id, defect_description=defect_description)

@mcp_server.tool(name="analyze_bill")
def analyze_bill(document_id: str, compare_to_document_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve available billing details (usage kWh, rates, surcharges) and calculate
    deterministic variance against a prior billing statement if provided.
    """
    return execute_analyze_bill(document_id=document_id, compare_to_document_id=compare_to_document_id)

@mcp_server.tool(name="prepare_workflow")
def prepare_workflow(workflow_type: str, document_ids: List[str], parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create a draft warranty claim or billing inquiry.
    Never approves or submits the workflow automatically. Status is DRAFT_PENDING_USER_APPROVAL.
    """
    return execute_prepare_workflow(workflow_type=workflow_type, document_ids=document_ids, parameters=parameters)

@mcp_server.tool(name="get_workflow_status")
def get_workflow_status(workflow_id: str) -> Dict[str, Any]:
    """
    Retrieve current workflow draft status and any outstanding missing requirements.
    """
    return execute_get_workflow_status(workflow_id=workflow_id)

def get_mcp_asgi_app() -> Starlette:
    """
    Exposes a mountable ASGI application implementing the Streamable HTTP transport.
    FastAPI Person 2 can mount this directly via:
        from backend.app.agent.mcp.server import get_mcp_asgi_app
        app.mount("/mcp", get_mcp_asgi_app())
    """
    return mcp_server.streamable_http_app()

if __name__ == "__main__":
    import asyncio
    # Standalone runner for Streamable HTTP
    print("Starting Luma MCP server over Streamable HTTP on port 8001...")
    asyncio.run(mcp_server.run_streamable_http_async())
