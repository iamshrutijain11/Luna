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


def test_list_workflows_empty(client):
    """GET /api/workflows should return empty list on a fresh DB session."""
    res = client.get("/api/workflows")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data
    assert isinstance(data["items"], list)


def test_list_workflows_after_creation(client):
    """GET /api/workflows should list created workflows with correct pagination metadata."""
    pdf_bytes = create_synthetic_warranty_pdf()
    upload_res = client.post(
        "/api/documents",
        files={"file": ("wf_list_test.pdf", pdf_bytes, "application/pdf")},
        data={"document_type": "warranty"},
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    wf_req = {
        "workflow_type": "warranty_claim",
        "linked_document_ids": [doc_id],
        "initial_data": {"issue_description": "Device overheats."},
    }
    create_res = client.post("/api/workflows", json=wf_req)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # List without filters
    list_res = client.get("/api/workflows?limit=10&offset=0")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    assert data["limit"] == 10
    assert data["offset"] == 0
    ids = [w["id"] for w in data["items"]]
    assert created_id in ids


def test_list_workflows_filter_by_type(client):
    """GET /api/workflows?workflow_type= filters correctly."""
    res = client.get("/api/workflows?workflow_type=warranty_claim")
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["workflow_type"] == "warranty_claim"


def test_list_workflows_filter_by_status(client):
    """GET /api/workflows?status= filters correctly."""
    res = client.get("/api/workflows?status=ready_for_review")
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["status"] == "ready_for_review"


def test_workflow_not_found(client):
    """GET /api/workflows/{id} for unknown ID returns 404."""
    res = client.get("/api/workflows/non-existent-uuid-9999")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"
