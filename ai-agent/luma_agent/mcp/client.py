"""
client.py - MCP Client implementation for Luma Agent.
"""

from typing import List, Dict, Any, Optional
from luma_agent.mcp.tools import (
    execute_list_documents,
    execute_get_document_details,
    execute_get_document_analysis,
    execute_check_warranty_requirements,
    execute_analyze_bill,
    execute_prepare_workflow,
    execute_get_workflow_status
)

class MCPClient:
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

default_mcp_client = MCPClient()
