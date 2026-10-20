"""
server.py - Streamable HTTP FastMCP ASGI server.
"""

from typing import Optional, List, Dict, Any
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette

from luma_agent.mcp.tools import (
    execute_list_documents,
    execute_get_document_details,
    execute_get_document_analysis,
    execute_check_warranty_requirements,
    execute_analyze_bill,
    execute_prepare_workflow,
    execute_get_workflow_status
)

mcp_server = FastMCP(
    name="Luma-Document-Assistant-MCP",
    instructions="MCP server providing structured paperwork retrieval, analysis, and workflow preparation tools."
)

@mcp_server.tool(name="list_documents")
def list_documents(document_type: Optional[str] = None) -> List[Dict[str, Any]]:
    return execute_list_documents(document_type=document_type)

@mcp_server.tool(name="get_document_details")
def get_document_details(document_id: str) -> Dict[str, Any]:
    return execute_get_document_details(document_id=document_id)

@mcp_server.tool(name="get_document_analysis")
def get_document_analysis(document_id: str) -> Dict[str, Any]:
    return execute_get_document_analysis(document_id=document_id)

@mcp_server.tool(name="check_warranty_requirements")
def check_warranty_requirements(document_id: str, defect_description: Optional[str] = None) -> Dict[str, Any]:
    return execute_check_warranty_requirements(document_id=document_id, defect_description=defect_description)

@mcp_server.tool(name="analyze_bill")
def analyze_bill(document_id: str, compare_to_document_id: Optional[str] = None) -> Dict[str, Any]:
    return execute_analyze_bill(document_id=document_id, compare_to_document_id=compare_to_document_id)

@mcp_server.tool(name="prepare_workflow")
def prepare_workflow(workflow_type: str, document_ids: List[str], parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return execute_prepare_workflow(workflow_type=workflow_type, document_ids=document_ids, parameters=parameters)

@mcp_server.tool(name="get_workflow_status")
def get_workflow_status(workflow_id: str) -> Dict[str, Any]:
    return execute_get_workflow_status(workflow_id=workflow_id)

def get_mcp_asgi_app() -> Starlette:
    return mcp_server.streamable_http_app()
