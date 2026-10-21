"""API integration tests for document upload, listing, download, and extraction endpoints."""

from backend.tests.conftest import create_synthetic_warranty_pdf


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert "timestamp" in data


def test_document_upload_and_lifecycle(client):
    pdf_bytes = create_synthetic_warranty_pdf()

    # 1. Upload
    upload_res = client.post(
        "/api/documents",
        files={"file": ("acme_warranty.pdf", pdf_bytes, "application/pdf")},
        data={"document_type": "warranty"},
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    assert doc_data["original_filename"] == "acme_warranty.pdf"
    assert doc_data["document_type"] == "warranty"
    assert doc_data["status"] == "processed"

    # 2. Get details
    get_res = client.get(f"/api/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id

    # 3. List documents
    list_res = client.get("/api/documents?limit=10")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(d["id"] == doc_id for d in list_data["items"])

    # 4. Download file
    download_res = client.get(f"/api/documents/{doc_id}/download")
    assert download_res.status_code == 200
    assert download_res.headers["content-type"] == "application/pdf"
    assert len(download_res.content) == len(pdf_bytes)

    # 5. Get Analysis
    analysis_res = client.get(f"/api/documents/{doc_id}/analysis")
    assert analysis_res.status_code == 200
    analysis_data = analysis_res.json()
    assert analysis_data["document_id"] == doc_id
    assert len(analysis_data["extracted_fields"]) > 0


def test_document_not_found(client):
    res = client.get("/api/documents/non-existent-uuid")
    assert res.status_code == 404
    data = res.json()
    assert data["error"]["code"] == "NOT_FOUND"


def test_upload_unsupported_media_type(client):
    res = client.post(
        "/api/documents",
        files={"file": ("malicious.exe", b"MZThisIsFakeExecutableHeader", "application/x-dosexec")},
    )
    assert res.status_code == 415
    data = res.json()
    assert data["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"
