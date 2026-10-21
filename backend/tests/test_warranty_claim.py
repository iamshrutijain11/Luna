"""Tests for Warranty Claim preparation: eligibility calculations, exclusion handling, and missing requirements."""

from datetime import date
from backend.app.domain.workflows.artifact_generator import ArtifactGenerator
from backend.app.domain.workflows.warranty_service import WarrantyDomainService


def test_warranty_eligibility_covered():
    svc = WarrantyDomainService()
    facts = [
        {"field_name": "product_name", "field_value": "SmartHub 3000"},
        {"field_name": "warranty_duration", "field_value": "2 years"},
        {"field_name": "purchase_date", "field_value": "2026-01-15"},
        {"field_name": "identifier", "field_value": "INV-1002"},
    ]
    user_inputs = {
        "issue_description": "Device screen flickers unexpectedly during boot.",
        "customer_name": "Alice Smith",
        "customer_contact": "alice@example.com",
    }
    # Evaluation date within 2 years of 2026-01-15
    res = svc.evaluate_claim(facts, user_inputs, current_date=date(2026, 6, 1))

    assert res["status"] == "ready_for_review"
    assert res["collected_information"]["eligibility"] == "appears_covered"
    assert len(res["missing_requirements"]) == 0
    assert "Notice: LifeDesk preliminary assessment" in res["collected_information"]["disclaimer"]


def test_warranty_eligibility_expired():
    svc = WarrantyDomainService()
    facts = [
        {"field_name": "warranty_duration", "field_value": "1 year"},
        {"field_name": "purchase_date", "field_value": "2024-01-15"},
        {"field_name": "product_name", "field_value": "Old Router"},
    ]
    user_inputs = {
        "issue_description": "Won't turn on.",
        "customer_name": "Bob Jones",
        "customer_contact": "bob@example.com",
        "invoice_number": "INV-5544",
    }
    # Evaluation date 2026-10-20 > 2025-01-15
    res = svc.evaluate_claim(facts, user_inputs, current_date=date(2026, 10, 20))

    assert res["collected_information"]["eligibility"] == "appears_excluded"
    assert "expired" in res["collected_information"]["eligibility_reason"].lower()


def test_warranty_eligibility_exclusion_match():
    svc = WarrantyDomainService()
    facts = [
        {"field_name": "warranty_duration", "field_value": "2 years"},
        {"field_name": "purchase_date", "field_value": "2026-01-15"},
        {"field_name": "exclusion_term", "field_value": "Water Damage"},
        {"field_name": "product_name", "field_value": "SmartHub 3000"},
        {"field_name": "identifier", "field_value": "INV-1002"},
    ]
    user_inputs = {
        "issue_description": "Device stopped working after severe water damage from spilled cup.",
        "customer_name": "Alice Smith",
        "customer_contact": "alice@example.com",
    }
    res = svc.evaluate_claim(facts, user_inputs, current_date=date(2026, 6, 1))

    assert res["collected_information"]["eligibility"] == "appears_excluded"
    assert "exclusion" in res["collected_information"]["eligibility_reason"].lower()


def test_warranty_insufficient_information():
    svc = WarrantyDomainService()
    facts = [
        {"field_name": "product_name", "field_value": "Camera Unit"},
    ]
    user_inputs = {
        "issue_description": "Lens jammed.",
    }
    res = svc.evaluate_claim(facts, user_inputs, current_date=date(2026, 6, 1))

    assert res["status"] == "needs_information"
    assert res["collected_information"]["eligibility"] == "insufficient_information"
    assert len(res["missing_requirements"]) > 0


def test_warranty_artifact_generation(tmp_path):
    gen = ArtifactGenerator()
    collected_info = {
        "product_name": "Echo Hub 2026",
        "brand": "Amazon",
        "model_number": "EH-26",
        "serial_number": "SN-987654",
        "invoice_number": "INV-7711",
        "purchase_date": "2026-02-01",
        "warranty_duration": "1 year",
        "warranty_expiry_date": "2027-02-01",
        "eligibility": "appears_covered",
        "eligibility_reason": "Active warranty window until 2027-02-01.",
        "issue_description": "Touchscreen unresponsive after update.",
        "customer_name": "Dev Tester",
        "customer_contact": "dev@example.com",
    }
    path = gen.generate_warranty_packet(
        workflow_id="wf-test-warranty-1",
        collected_info=collected_info,
        missing_requirements=[],
        linked_docs=["doc-123"],
    )

    assert path.exists()
    assert path.stat().st_size > 1000
