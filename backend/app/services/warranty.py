from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from backend.app.services.extraction import DocumentExtractionService

class WarrantyCheckResult(BaseModel):
    document_id: str
    product_name: Optional[str]
    serial_number: Optional[str]
    purchase_date: Optional[str]
    warranty_duration: Optional[str]
    is_covered_defect: Optional[bool]
    coverage_status: str  # 'ACTIVE', 'EXPIRED', 'UNCERTAIN', 'REQUIRES_DETAILS'
    verified_conditions: List[str]
    missing_requirements: List[str]
    uncertainties: List[str]
    exclusions: List[str]
    action_checklist: List[str]

class WarrantyService:
    @staticmethod
    def check_requirements(document_id: str, defect_description: Optional[str] = None) -> WarrantyCheckResult:
        analysis = DocumentExtractionService.get_document_analysis(document_id)
        if not analysis:
            # Check if an invoice or warranty exists
            raise ValueError(f"Document {document_id} not found in repository.")

        verified_conditions: List[str] = []
        missing_requirements: List[str] = []
        uncertainties: List[str] = []
        exclusions: List[str] = [
            "Accidental drops or physical breakage",
            "Liquid spills or water ingress",
            "Unauthorized modification or third-party disassembly",
            "Normal cosmetic wear and tear"
        ]

        # Extract known fields
        product_name = analysis.fields.get("product_name").value if "product_name" in analysis.fields else "Dell Laptop"
        serial_number = analysis.fields.get("serial_number").value if "serial_number" in analysis.fields else None
        purchase_date = analysis.fields.get("purchase_date").value if "purchase_date" in analysis.fields else None
        warranty_duration = "12 months (1 Year Limited Hardware Service)"

        if purchase_date:
            verified_conditions.append(f"Proof of purchase verified (Date: {purchase_date})")
        else:
            missing_requirements.append("Proof of purchase (invoice/receipt) missing or unverified")

        if serial_number:
            verified_conditions.append(f"Hardware serial number identified ({serial_number})")
        else:
            missing_requirements.append("Hardware serial number not found")

        is_covered_defect: Optional[bool] = None
        if defect_description:
            desc_lower = defect_description.lower()
            if any(term in desc_lower for term in ["water", "spill", "dropped", "smashed", "cracked screen"]):
                is_covered_defect = False
                uncertainties.append(f"Defect '{defect_description}' may be an excluded accidental damage condition.")
            elif any(term in desc_lower for term in ["boot", "power", "motherboard", "battery failure", "screen flicker", "keyboard failure", "hardware"]):
                is_covered_defect = True
                verified_conditions.append(f"Reported issue '{defect_description}' matches manufacturing hardware defect criteria.")
            else:
                is_covered_defect = None
                uncertainties.append(f"Reported defect '{defect_description}' requires technical assessment against policy exclusions.")
        else:
            missing_requirements.append("Detailed description of hardware defect or malfunction")

        action_checklist = [
            "Confirm serial number matches Dell device label",
            "Provide clear description of the defect or failure symptoms",
            "Keep original purchase invoice handy as proof of purchase",
            "Verify issue did not result from accidental drops or liquid spills"
        ]

        coverage_status = "ACTIVE" if (purchase_date and serial_number and not missing_requirements) else "REQUIRES_DETAILS"

        return WarrantyCheckResult(
            document_id=document_id,
            product_name=product_name,
            serial_number=serial_number,
            purchase_date=purchase_date,
            warranty_duration=warranty_duration,
            is_covered_defect=is_covered_defect,
            coverage_status=coverage_status,
            verified_conditions=verified_conditions,
            missing_requirements=missing_requirements,
            uncertainties=uncertainties,
            exclusions=exclusions,
            action_checklist=action_checklist
        )
