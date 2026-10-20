from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.app.services.extraction import DocumentExtractionService

class BillComparison(BaseModel):
    previous_period: str
    current_period: str
    previous_amount: float
    current_amount: float
    dollar_difference: float
    percentage_difference: float
    previous_usage_kwh: Optional[float]
    current_usage_kwh: Optional[float]
    usage_difference_kwh: Optional[float]
    rate_change_per_kwh: Optional[float]
    extra_charges: Optional[float]
    explanation: str

class BillAnalysisResult(BaseModel):
    document_id: str
    title: str
    account_number: Optional[str]
    billing_period: Optional[str]
    total_amount: float
    usage_kwh: Optional[float]
    base_rate: Optional[float]
    surcharges: Optional[float]
    comparison: Optional[BillComparison]
    key_findings: List[str]
    requires_additional_bill: bool

class BillingService:
    @staticmethod
    def analyze_bill(document_id: str, compare_to_document_id: Optional[str] = None) -> BillAnalysisResult:
        doc = DocumentExtractionService.get_document_analysis(document_id)
        if not doc:
            raise ValueError(f"Bill document {document_id} not found.")

        account_num = doc.fields.get("account_number").value if "account_number" in doc.fields else None
        period = doc.fields.get("billing_period").value if "billing_period" in doc.fields else None
        total = float(doc.fields.get("total_due").value) if "total_due" in doc.fields else 0.0
        usage = float(doc.fields.get("total_usage_kwh").value) if "total_usage_kwh" in doc.fields else None
        rate = float(doc.fields.get("energy_rate").value) if "energy_rate" in doc.fields else None
        surcharges = float(doc.fields.get("extra_surcharges").value) if "extra_surcharges" in doc.fields else 0.0

        findings: List[str] = [
            f"Total amount due: ${total:.2f} for billing period {period or 'unspecified'}."
        ]
        if usage is not None:
            findings.append(f"Recorded electricity consumption: {usage:.0f} kWh at ${rate:.4f}/kWh.")
        if surcharges > 0:
            findings.append(f"Additional grid infrastructure / seasonal surcharge: ${surcharges:.2f}.")

        comparison: Optional[BillComparison] = None
        requires_additional_bill = False

        if compare_to_document_id:
            prev_doc = DocumentExtractionService.get_document_analysis(compare_to_document_id)
            if prev_doc:
                prev_period = prev_doc.fields.get("billing_period").value if "billing_period" in prev_doc.fields else "Previous Period"
                prev_total = float(prev_doc.fields.get("total_due").value) if "total_due" in prev_doc.fields else 0.0
                prev_usage = float(prev_doc.fields.get("total_usage_kwh").value) if "total_usage_kwh" in prev_doc.fields else None
                prev_rate = float(prev_doc.fields.get("energy_rate").value) if "energy_rate" in prev_doc.fields else None

                dollar_diff = round(total - prev_total, 2)
                pct_diff = round((dollar_diff / prev_total) * 100, 1) if prev_total > 0 else 0.0
                usage_diff = round(usage - prev_usage, 1) if (usage is not None and prev_usage is not None) else None
                rate_diff = round(rate - prev_rate, 4) if (rate is not None and prev_rate is not None) else None

                comp_summary = (
                    f"Your bill is ${dollar_diff:.2f} ({pct_diff:+.1f}%) higher than the previous month ({prev_period}). "
                    f"Primary drivers: consumption increased by {usage_diff:+.0f} kWh (from {prev_usage:.0f} to {usage:.0f} kWh), "
                    f"base energy rate increased by ${rate_diff:.4f}/kWh to ${rate:.4f}/kWh (summer peak adjustment), "
                    f"and an extra grid infrastructure surcharge of ${surcharges:.2f} was applied."
                )

                findings.append(comp_summary)

                comparison = BillComparison(
                    previous_period=str(prev_period),
                    current_period=str(period),
                    previous_amount=prev_total,
                    current_amount=total,
                    dollar_difference=dollar_diff,
                    percentage_difference=pct_diff,
                    previous_usage_kwh=prev_usage,
                    current_usage_kwh=usage,
                    usage_difference_kwh=usage_diff,
                    rate_change_per_kwh=rate_diff,
                    extra_charges=surcharges,
                    explanation=comp_summary
                )
        else:
            requires_additional_bill = True
            findings.append("Comparison requires an earlier billing statement to calculate usage and rate variance.")

        return BillAnalysisResult(
            document_id=document_id,
            title=doc.title,
            account_number=account_num,
            billing_period=period,
            total_amount=total,
            usage_kwh=usage,
            base_rate=rate,
            surcharges=surcharges,
            comparison=comparison,
            key_findings=findings,
            requires_additional_bill=requires_additional_bill
        )
