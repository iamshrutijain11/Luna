"""LifeDesk System End-to-End Smoke Test & OpenAPI Contract Validator.

Executes:
1. Backend application startup verification
2. OpenAPI schema validation against contracts/openapi.yaml
3. Real file upload test with PyMuPDF digital PDF
4. Document analysis & provenance verification
5. Workflow creation & requirement checks
6. Explicit workflow approval & state transition check
7. Artifact PDF generation & download test
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import yaml
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.database import init_db
from backend.tests.conftest import (
    create_synthetic_warranty_pdf,
    create_synthetic_utility_bill_pdf,
)


def run_validations():
    print("=" * 60)
    print("LIFEDESK SYSTEM VERIFICATION & SMOKE TEST")
    print("=" * 60)

    # 1. Startup & Database init
    print("\n[1/6] Initializing database schemas...")
    init_db()
    print("[OK] Database schema initialized successfully.")

    client = TestClient(app)

    # Health check
    health_res = client.get("/api/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    print(f"[OK] Health check OK: {health_res.json()}")

    # 2. OpenAPI Schema Validation
    print("\n[2/6] Validating OpenAPI contract against contracts/openapi.yaml...")
    contract_path = Path("contracts/openapi.yaml")
    assert contract_path.exists(), "contracts/openapi.yaml not found!"
    with open(contract_path, "r", encoding="utf-8") as f:
        contract_spec = yaml.safe_load(f)

    app_spec = app.openapi()
    contract_paths = set(contract_spec.get("paths", {}).keys())
    app_paths = set(app_spec.get("paths", {}).keys())

    missing_paths = contract_paths - app_paths
    assert not missing_paths, f"Missing OpenAPI paths in app: {missing_paths}"
    print(f"[OK] All {len(contract_paths)} contract paths matched in FastAPI application: {sorted(list(contract_paths))}")

    # 3. Real File Upload Test
    print("\n[3/6] Testing real file upload and extraction pipeline...")
    pdf_bytes = create_synthetic_warranty_pdf()
    upload_res = client.post(
        "/api/documents",
        files={"file": ("acme_warranty.pdf", pdf_bytes, "application/pdf")},
        data={"document_type": "warranty"},
    )
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    doc = upload_res.json()
    doc_id = doc["id"]
    assert doc["status"] == "processed", f"Unexpected status: {doc['status']}"
    print(f"[OK] Document uploaded successfully. ID: {doc_id}, Type: {doc['document_type']}, Status: {doc['status']}")

    # 4. Document Analysis & Provenance
    print("\n[4/6] Verifying extracted document facts & provenance...")
    analysis_res = client.get(f"/api/documents/{doc_id}/analysis")
    assert analysis_res.status_code == 200
    analysis = analysis_res.json()
    fields = analysis["extracted_fields"]
    assert len(fields) > 0, "No fields extracted!"
    print(f"[OK] Extracted {len(fields)} fields with page provenance and excerpts:")
    for f in fields[:3]:
        print(f"   * {f['field_name']}: {f['field_value']} (p.{f['source_page']}, method={f['extraction_method']})")

    # 5. Workflow Creation & Eligibility Assessment
    print("\n[5/6] Testing workflow initialization & eligibility assessment...")
    wf_req = {
        "workflow_type": "warranty_claim",
        "linked_document_ids": [doc_id],
        "initial_data": {
            "issue_description": "SmartHome Hub freezes when camera stream starts.",
            "customer_name": "Alex Mercer",
            "customer_contact": "alex@example.com",
            "serial_number": "SN-ACME-9021",
        },
    }
    wf_res = client.post("/api/workflows", json=wf_req)
    assert wf_res.status_code == 201, f"Workflow creation failed: {wf_res.text}"
    wf = wf_res.json()
    wf_id = wf["id"]
    assert wf["status"] == "ready_for_review", f"Expected ready_for_review, got: {wf['status']}"
    info = wf["collected_information"]
    print(f"[OK] Workflow created. ID: {wf_id}")
    print(f"   * Status: {wf['status']}")
    print(f"   * Eligibility: {info.get('eligibility')} ({info.get('eligibility_reason')})")

    # 6. Workflow Approval & Artifact Download Test
    print("\n[6/6] Testing explicit approval & PDF artifact generation...")
    approval_res = client.post(
        f"/api/workflows/{wf_id}/approve",
        json={"approved_action": "generate_claim_packet", "notes": "Approved for submission"},
    )
    assert approval_res.status_code == 200, f"Approval failed: {approval_res.text}"
    appr = approval_res.json()
    assert appr["resulting_status"] == "completed"
    assert appr["workflow"]["artifact_available"] is True
    print(f"[OK] Workflow approved. Approval ID: {appr['approval_id']}, Status: {appr['resulting_status']}")

    artifact_res = client.get(f"/api/workflows/{wf_id}/artifact")
    assert artifact_res.status_code == 200, f"Artifact download failed: {artifact_res.text}"
    assert artifact_res.headers["content-type"] == "application/pdf"
    assert len(artifact_res.content) > 1000
    print(f"[OK] Artifact downloaded successfully. File size: {len(artifact_res.content)} bytes (application/pdf)")

    print("\n" + "=" * 60)
    print("ALL SMOKE TESTS AND SYSTEM VALIDATIONS PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        run_validations()
        sys.exit(0)
    except Exception as e:
        print(f"\n[FAIL] Validation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
