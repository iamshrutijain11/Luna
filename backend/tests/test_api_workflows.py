"""API integration tests for Workflow lifecycle: creation, review, explicit approval, and artifact retrieval."""

from backend.tests.conftest import (
    create_synthetic_utility_bill_pdf,
    create_synthetic_warranty_pdf,
)


def test_warranty_claim_workflow_full_lifecycle(client):
    # 1. Upload warranty document
    pdf_bytes = create_synthetic_warranty_pdf()
    upload_res = client.post(
        "/api/documents",
        files={"file": ("warranty.pdf", pdf_bytes, "application/pdf")},
        data={"document_type": "warranty"},
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # 2. Create Workflow
    wf_req = {
        "workflow_type": "warranty_claim",
        "linked_document_ids": [doc_id],
        "initial_data": {
            "issue_description": "Speaker buzzes constantly on higher volume.",
            "customer_name": "Sarah Connor",
            "customer_contact": "sarah@example.com",
            "serial_number": "SN-ACME-4001",
        },
    }
    create_res = client.post("/api/workflows", json=wf_req)
    assert create_res.status_code == 201
    wf_data = create_res.json()
    wf_id = wf_data["id"]
    assert wf_data["workflow_type"] == "warranty_claim"
    assert wf_data["status"] == "ready_for_review"
    assert wf_data["artifact_available"] is False

    # 3. Attempting to download artifact before approval should fail with 409
    premature_artifact_res = client.get(f"/api/workflows/{wf_id}/artifact")
    assert premature_artifact_res.status_code == 409
    assert premature_artifact_res.json()["error"]["code"] == "INVALID_WORKFLOW_STATE"

    # 4. Explicit User Approval
    approval_res = client.post(
        f"/api/workflows/{wf_id}/approve",
        json={"approved_action": "generate_claim_packet", "notes": "Approved by user"},
    )
    assert approval_res.status_code == 200
    approval_data = approval_res.json()
    assert approval_data["approved_action"] == "generate_claim_packet"
    assert approval_data["resulting_status"] == "completed"
    assert approval_data["workflow"]["status"] == "completed"
    assert approval_data["workflow"]["artifact_available"] is True

    # 5. Duplicate Approval must fail with 409 (Idempotency Guard)
    dup_res = client.post(
        f"/api/workflows/{wf_id}/approve",
        json={"approved_action": "generate_claim_packet"},
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "INVALID_WORKFLOW_STATE"

    # 6. Download generated PDF artifact
    artifact_res = client.get(f"/api/workflows/{wf_id}/artifact")
    assert artifact_res.status_code == 200
    assert artifact_res.headers["content-type"] == "application/pdf"
    assert len(artifact_res.content) > 1000


def test_utility_bill_workflow_full_lifecycle(client):
    # 1. Upload utility bill
    bill_bytes = create_synthetic_utility_bill_pdf()
    upload_res = client.post(
        "/api/documents",
        files={"file": ("august_bill.pdf", bill_bytes, "application/pdf")},
        data={"document_type": "utility_bill"},
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # 2. Create Utility Workflow
    wf_req = {
        "workflow_type": "utility_bill_assistant",
        "linked_document_ids": [doc_id],
        "initial_data": {
            "customer_name": "John Miller",
            "inquiry_reason": "Inquiry regarding seasonal tariff variance.",
        },
    }
    create_res = client.post("/api/workflows", json=wf_req)
    assert create_res.status_code == 201
    wf_id = create_res.json()["id"]

    # 3. Approve and generate inquiry letter
    approval_res = client.post(
        f"/api/workflows/{wf_id}/approve",
        json={"approved_action": "generate_inquiry_letter"},
    )
    assert approval_res.status_code == 200
    assert approval_res.json()["workflow"]["status"] == "completed"

    # 4. Download artifact
    artifact_res = client.get(f"/api/workflows/{wf_id}/artifact")
    assert artifact_res.status_code == 200
    assert artifact_res.headers["content-type"] == "application/pdf"
