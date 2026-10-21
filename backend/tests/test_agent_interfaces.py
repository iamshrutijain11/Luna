"""Tests for Person 3 agent integration interfaces."""

from backend.app.schemas.common import (
    DocumentAnalysisResponse,
    DocumentListResponse,
    DocumentResponse,
    WorkflowResponse,
)
from backend.app.services.agent_interface import (
    AgentServiceBridge,
    analyze_bill,
    check_warranty_requirements,
    get_document_analysis,
    get_document_details,
    get_workflow_status,
    list_documents,
    prepare_workflow,
)
from backend.app.services.document_service import DocumentService
from backend.tests.conftest import (
    create_synthetic_utility_bill_pdf,
    create_synthetic_warranty_pdf,
)


def test_agent_interfaces_with_session(db_session):
    bridge = AgentServiceBridge(db=db_session)
    doc_svc = DocumentService(db_session)

    # Ingest document
    pdf_bytes = create_synthetic_warranty_pdf()
    doc = doc_svc.upload_and_process(pdf_bytes, "warranty_agent.pdf", "warranty")

    # 1. list_documents()
    list_res = bridge.list_documents()
    assert isinstance(list_res, DocumentListResponse)
    assert list_res.total >= 1

    # 2. get_document_details()
    detail_res = bridge.get_document_details(doc.id)
    assert isinstance(detail_res, DocumentResponse)
    assert detail_res.id == doc.id

    # 3. get_document_analysis()
    analysis_res = bridge.get_document_analysis(doc.id)
    assert isinstance(analysis_res, DocumentAnalysisResponse)
    assert analysis_res.document_id == doc.id

    # 4. check_warranty_requirements()
    warranty_eval = bridge.check_warranty_requirements(
        document_id=doc.id,
        issue_description="Defect in internal speaker.",
        user_inputs={"customer_name": "Agent User", "customer_contact": "agent@example.com"},
    )
    assert isinstance(warranty_eval, dict)
    assert "collected_information" in warranty_eval

    # 5. prepare_workflow()
    wf_res = bridge.prepare_workflow(
        workflow_type="warranty_claim",
        document_ids=[doc.id],
        parameters={"issue_description": "Defect in internal speaker."},
    )
    assert isinstance(wf_res, WorkflowResponse)
    assert wf_res.workflow_type == "warranty_claim"

    # 6. get_workflow_status()
    wf_status = bridge.get_workflow_status(wf_res.id)
    assert isinstance(wf_status, WorkflowResponse)
    assert wf_status.id == wf_res.id


def test_agent_bill_analysis(db_session):
    bridge = AgentServiceBridge(db=db_session)
    doc_svc = DocumentService(db_session)

    bill1_bytes = create_synthetic_utility_bill_pdf(total_amount="100.00", usage="500 kWh")
    bill2_bytes = create_synthetic_utility_bill_pdf(total_amount="150.00", usage="520 kWh")

    doc1 = doc_svc.upload_and_process(bill1_bytes, "bill1.pdf", "utility_bill")
    doc2 = doc_svc.upload_and_process(bill2_bytes, "bill2.pdf", "utility_bill")

    analysis = bridge.analyze_bill(
        document_id=doc2.id,
        compare_with_document_id=doc1.id,
    )
    assert isinstance(analysis, dict)
    assert "comparison" in analysis["collected_information"]
