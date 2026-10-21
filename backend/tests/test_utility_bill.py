"""Tests for Utility Bill Assistant: parsing, multi-bill comparisons, and discrepancy detection."""

from backend.app.domain.workflows.artifact_generator import ArtifactGenerator
from backend.app.domain.workflows.utility_bill_service import UtilityBillDomainService


def test_single_bill_analysis():
    svc = UtilityBillDomainService()
    docs_facts = [
        (
            "doc-bill-1",
            [
                {"field_name": "provider_name", "field_value": "City Power"},
                {"field_name": "account_number", "field_value": "CP-12345"},
                {"field_name": "billing_period", "field_value": "2026-08-01 to 2026-08-31"},
                {"field_name": "due_date", "field_value": "2026-09-15"},
                {"field_name": "amount", "field_value": "120.00"},
                {"field_name": "usage_quantity", "field_value": "600 kWh"},
            ],
        )
    ]
    res = svc.analyze_bills(docs_facts, {})

    assert res["status"] == "ready_for_review"
    assert res["collected_information"]["provider_name"] == "City Power"
    assert res["collected_information"]["total_amount"] == 120.00
    assert len(res["missing_requirements"]) == 0


def test_multi_bill_comparison_with_discrepancy():
    svc = UtilityBillDomainService()
    current_bill_facts = [
        {"field_name": "provider_name", "field_value": "City Power"},
        {"field_name": "account_number", "field_value": "CP-12345"},
        {"field_name": "billing_period", "field_value": "2026-08-01 to 2026-08-31"},
        {"field_name": "due_date", "field_value": "2026-09-15"},
        {"field_name": "amount", "field_value": "210.00"},  # 75% increase
        {"field_name": "usage_quantity", "field_value": "620 kWh"},  # 3.3% increase
    ]
    previous_bill_facts = [
        {"field_name": "provider_name", "field_value": "City Power"},
        {"field_name": "account_number", "field_value": "CP-12345"},
        {"field_name": "billing_period", "field_value": "2026-07-01 to 2026-07-31"},
        {"field_name": "due_date", "field_value": "2026-08-15"},
        {"field_name": "amount", "field_value": "120.00"},
        {"field_name": "usage_quantity", "field_value": "600 kWh"},
    ]

    docs_facts = [
        ("doc-curr", current_bill_facts),
        ("doc-prev", previous_bill_facts),
    ]

    res = svc.analyze_bills(docs_facts, {})

    comp = res["collected_information"]["comparison"]
    assert comp is not None
    assert comp["current_amount"] == 210.00
    assert comp["previous_amount"] == 120.00
    assert comp["amount_change"] == 90.00
    assert comp["amount_change_percent"] == 75.0
    assert comp["usage_change"] == 20.0

    # Discrepancy note should be generated because cost jumped 75% while usage changed < 5%
    discrepancies = res["collected_information"]["discrepancy_notes"]
    assert len(discrepancies) > 0
    assert "Disproportionate cost increase" in discrepancies[0]


def test_comparison_omits_metrics_when_data_missing():
    svc = UtilityBillDomainService()
    # Bill A has amount but no usage; Bill B has both
    current_bill_facts = [
        {"field_name": "provider_name", "field_value": "Gas Co"},
        {"field_name": "amount", "field_value": "80.00"},
    ]
    previous_bill_facts = [
        {"field_name": "provider_name", "field_value": "Gas Co"},
        {"field_name": "amount", "field_value": "70.00"},
        {"field_name": "usage_quantity", "field_value": "40 therms"},
    ]

    docs_facts = [
        ("doc-curr", current_bill_facts),
        ("doc-prev", previous_bill_facts),
    ]

    res = svc.analyze_bills(docs_facts, {})
    comp = res["collected_information"]["comparison"]

    assert comp["amount_change"] == 10.00
    # Usage was not present on current bill, so usage_change should NOT be calculated
    assert "usage_change" not in comp


def test_utility_inquiry_letter_generation(tmp_path):
    gen = ArtifactGenerator()
    collected_info = {
        "provider_name": "Metropolitan Water & Power",
        "account_number": "MWP-991188",
        "customer_name": "Jordan Lee",
        "customer_address": "456 Pine Ave, Seattle, WA",
        "billing_period": "2026-08-01 to 2026-08-31",
        "due_date": "2026-09-20",
        "total_amount": 250.00,
        "comparison": {
            "current_amount": 250.00,
            "previous_amount": 140.00,
            "amount_change_percent": 78.57,
            "current_usage": "920 kWh",
            "previous_usage": "890 kWh",
            "usage_change_percent": 3.37,
        },
        "discrepancy_notes": [
            "Disproportionate cost increase: Bill total increased by 78.6% while consumption changed by only 3.4%."
        ],
    }

    path = gen.generate_utility_inquiry_letter(
        workflow_id="wf-test-util-1",
        collected_info=collected_info,
        missing_requirements=[],
        linked_docs=["doc-u1", "doc-u2"],
    )

    assert path.exists()
    assert path.stat().st_size > 1000
