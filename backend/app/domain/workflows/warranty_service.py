"""Warranty claim domain service: eligibility calculation, requirement detection, and assessment."""

import re
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from backend.app.domain.extraction.deterministic_patterns import parse_date_string


def add_duration_to_date(start: date, num: int, unit: str) -> date:
    """Adds years or months to a date safely."""
    unit = unit.lower()
    if "year" in unit or "yr" in unit:
        try:
            return date(start.year + num, start.month, start.day)
        except ValueError:
            # Handle leap year Feb 29
            return date(start.year + num, start.month, start.day - 1)
    elif "month" in unit or "mo" in unit:
        new_year = start.year + (start.month + num - 1) // 12
        new_month = (start.month + num - 1) % 12 + 1
        day = min(start.day, 28)  # Safe bounded day
        return date(new_year, new_month, day)
    elif "day" in unit:
        return start + timedelta(days=num)
    return start


class WarrantyDomainService:
    DISCLAIMER = "Notice: LifeDesk preliminary assessment does not guarantee manufacturer claim acceptance."

    def evaluate_claim(
        self,
        extracted_facts: List[Dict[str, Any]],
        user_inputs: Dict[str, Any],
        current_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes extracted document facts and user-supplied data to determine:
        1. Consolidated product & purchase details
        2. Date-based warranty eligibility (appears_covered, appears_excluded, insufficient_information)
        3. Missing claim requirements
        """
        eval_date = current_date or date.today()

        # Consolidate facts
        facts_by_name: Dict[str, List[Dict[str, Any]]] = {}
        for f in extracted_facts:
            name = f.get("field_name", "")
            facts_by_name.setdefault(name, []).append(f)

        # 1. Product details
        product_name = (
            user_inputs.get("product_name")
            or self._first_value(facts_by_name, "product_name")
            or user_inputs.get("item_name")
            or None
        )
        model_number = (
            user_inputs.get("model_number")
            or user_inputs.get("model")
            or self._first_value(facts_by_name, "model_number")
            or None
        )
        brand = (
            user_inputs.get("brand")
            or self._first_value(facts_by_name, "brand")
            or user_inputs.get("manufacturer")
            or None
        )
        serial_number = (
            user_inputs.get("serial_number")
            or self._first_value(facts_by_name, "serial_number")
            or None
        )

        # 2. Purchase info
        purchase_date_str = (
            user_inputs.get("purchase_date")
            or self._first_value(facts_by_name, "purchase_date")
            or self._first_value(facts_by_name, "date")
            or None
        )
        invoice_number = (
            user_inputs.get("invoice_number")
            or self._first_value(facts_by_name, "identifier")
            or None
        )

        # 3. Warranty terms
        warranty_duration_str = (
            user_inputs.get("warranty_duration")
            or self._first_value(facts_by_name, "warranty_duration")
            or None
        )

        # Exclusions and claim requirements
        exclusions = [
            f["field_value"] for f in facts_by_name.get("exclusion_term", [])
        ]
        claim_requirements = [
            f["field_value"] for f in facts_by_name.get("claim_requirement", [])
        ]

        # 4. Issue description & customer
        issue_description = user_inputs.get("issue_description") or ""
        customer_name = user_inputs.get("customer_name") or user_inputs.get("name")
        customer_contact = user_inputs.get("customer_contact") or user_inputs.get("email")

        # 5. Date-based Eligibility Calculation
        eligibility, expiry_date_str, eligibility_reason = self._calculate_eligibility(
            purchase_date_str=purchase_date_str,
            duration_str=warranty_duration_str,
            issue_description=issue_description,
            exclusions=exclusions,
            eval_date=eval_date,
        )

        # 6. Missing Requirements Detection
        missing_requirements: List[str] = []
        if not product_name:
            missing_requirements.append("Product name or identification")
        if not purchase_date_str or not invoice_number:
            missing_requirements.append("Proof of purchase (invoice/receipt number or purchase date)")
        if not issue_description or len(issue_description.strip()) < 5:
            missing_requirements.append("Detailed description of the issue or defect")
        if not customer_name:
            missing_requirements.append("Customer name")
        if not customer_contact:
            missing_requirements.append("Customer contact details (email or phone)")

        # Check document-specific claim requirements
        for req in claim_requirements:
            req_lower = req.lower()
            if "serial" in req_lower and not serial_number:
                if "Device serial number" not in missing_requirements:
                    missing_requirements.append("Device serial number")

        # Determine workflow status
        workflow_status = (
            "ready_for_review" if not missing_requirements else "needs_information"
        )

        collected_information = {
            "product_name": product_name,
            "brand": brand,
            "model_number": model_number,
            "serial_number": serial_number,
            "invoice_number": invoice_number,
            "purchase_date": purchase_date_str,
            "warranty_duration": warranty_duration_str,
            "warranty_expiry_date": expiry_date_str,
            "eligibility": eligibility,
            "eligibility_reason": eligibility_reason,
            "disclaimer": self.DISCLAIMER,
            "exclusions_found": exclusions,
            "claim_requirements_found": claim_requirements,
            "issue_description": issue_description,
            "customer_name": customer_name,
            "customer_contact": customer_contact,
            "assessment_date": eval_date.isoformat(),
        }

        return {
            "status": workflow_status,
            "collected_information": collected_information,
            "missing_requirements": missing_requirements,
        }

    def _first_value(self, facts_by_name: Dict[str, List[Dict[str, Any]]], key: str) -> Optional[str]:
        items = facts_by_name.get(key, [])
        return items[0]["field_value"] if items else None

    def _calculate_eligibility(
        self,
        purchase_date_str: Optional[str],
        duration_str: Optional[str],
        issue_description: str,
        exclusions: List[str],
        eval_date: date,
    ) -> Tuple[str, Optional[str], str]:
        """
        Computes date-based eligibility:
        - 'appears_covered'
        - 'appears_excluded'
        - 'insufficient_information'
        """
        # Exclusions check first if description mentions known exclusions
        desc_lower = issue_description.lower()
        for excl in exclusions:
            if excl.lower() in desc_lower:
                return (
                    "appears_excluded",
                    None,
                    f"Reported issue matches warranty exclusion term: '{excl}'.",
                )

        # Common exclusion keywords even if not explicitly listed in document
        common_exclusions = ["water damage", "liquid spill", "dropped on floor", "screen cracked from drop", "unauthorized modification"]
        for excl in common_exclusions:
            if excl in desc_lower:
                return (
                    "appears_excluded",
                    None,
                    f"Reported issue indicates non-covered physical or liquid damage: '{excl}'.",
                )

        if not purchase_date_str or not duration_str:
            return (
                "insufficient_information",
                None,
                "Insufficient information: purchase date or warranty duration is missing from available documents.",
            )

        p_date = parse_date_string(purchase_date_str)
        if not p_date:
            return (
                "insufficient_information",
                None,
                f"Cannot reliably parse purchase date string: '{purchase_date_str}'.",
            )

        # Parse duration
        duration_match = re.match(r"(\d+)\s*(year|yr|month|mo|day)s?", duration_str, re.IGNORECASE)
        if not duration_match:
            return (
                "insufficient_information",
                None,
                f"Cannot reliably determine warranty period duration: '{duration_str}'.",
            )

        num = int(duration_match.group(1))
        unit = duration_match.group(2)
        expiry_date = add_duration_to_date(p_date, num, unit)
        expiry_iso = expiry_date.isoformat()

        if eval_date > expiry_date:
            return (
                "appears_excluded",
                expiry_iso,
                f"Warranty expired on {expiry_iso} (Evaluation date: {eval_date.isoformat()}, Purchase date: {p_date.isoformat()}, Duration: {duration_str}).",
            )

        return (
            "appears_covered",
            expiry_iso,
            f"Appears covered under standard warranty until {expiry_iso} (Evaluation date: {eval_date.isoformat()}).",
        )
