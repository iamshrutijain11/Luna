"""
client.py - MCP Client implementation supporting Streamable HTTP and in-process execution.
"""

from typing import List, Dict, Any, Optional
import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from backend.app.agent.mcp.tools import (
    execute_list_documents,
    execute_get_document_details,
    execute_get_document_analysis,
    execute_check_warranty_requirements,
    execute_analyze_bill,
    execute_prepare_workflow,
    execute_get_workflow_status
)

class MCPClient:
    """
    Unified client providing both high-performance in-process tool calling
    and Streamable HTTP network client calls for MCP verification.
    """

    def __init__(self, mcp_url: Optional[str] = None):
        self.mcp_url = mcp_url

    # In-process deterministic execution
    def list_documents(self, document_type: Optional[str] = None) -> List[Dict[str, Any]]:
        return execute_list_documents(document_type=document_type)

    def get_document_details(self, document_id: str) -> Dict[str, Any]:
        return execute_get_document_details(document_id=document_id)

    def get_document_analysis(self, document_id: str) -> Dict[str, Any]:
        return execute_get_document_analysis(document_id=document_id)

    def check_warranty_requirements(self, document_id: str, defect_description: Optional[str] = None) -> Dict[str, Any]:
        return execute_check_warranty_requirements(document_id=document_id, defect_description=defect_description)

    def analyze_bill(self, document_id: str, compare_to_document_id: Optional[str] = None) -> Dict[str, Any]:
        return execute_analyze_bill(document_id=document_id, compare_to_document_id=compare_to_document_id)

    def prepare_workflow(self, workflow_type: str, document_ids: List[str], parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return execute_prepare_workflow(workflow_type=workflow_type, document_ids=document_ids, parameters=parameters)

    def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        return execute_get_workflow_status(workflow_id=workflow_id)

    # Remote Streamable HTTP discovery & execution test
    async def discover_tools_streamable_http(self, base_url: str) -> List[str]:
        """
        Connects via streamable_http_client to verify Streamable HTTP transport compliance.
        """
        async with streamable_http_client(base_url) as (read_stream, write_stream, get_session_id):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                tools_result = await session.list_tools()
                return [t.name for t in tools_result.tools]

# Global default client
default_mcp_client = MCPClient()
