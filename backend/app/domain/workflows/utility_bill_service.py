"""Utility bill domain service: bill parsing, comparative analysis, and discrepancy detection."""

from typing import Any, Dict, List, Optional, Tuple


class UtilityBillDomainService:
    def analyze_bills(
        self,
        documents_facts: List[Tuple[str, List[Dict[str, Any]]]],
        user_inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Processes one or more utility bills.
        If multiple bills are provided, computes comparative variance metrics.
        Identifies billing discrepancies and missing requirement fields.
        """
        parsed_bills = []
        for doc_id, facts in documents_facts:
            bill_info = self._extract_bill_info(doc_id, facts)
            parsed_bills.append(bill_info)

        # Primary bill (default to first or latest)
        primary_bill = parsed_bills[0] if parsed_bills else {}

        # Merge user inputs over extracted data
        provider_name = user_inputs.get("provider_name") or primary_bill.get("provider_name")
        account_number = user_inputs.get("account_number") or primary_bill.get("account_number")
        billing_period = user_inputs.get("billing_period") or primary_bill.get("billing_period")
        due_date = user_inputs.get("due_date") or primary_bill.get("due_date")
        total_amount = user_inputs.get("total_amount") or primary_bill.get("total_amount")
        usage_quantity = user_inputs.get("usage_quantity") or primary_bill.get("usage_quantity")
        customer_name = user_inputs.get("customer_name") or "Valued Customer"
        customer_address = user_inputs.get("customer_address") or "Service Address On File"

        # Multi-bill comparative analysis
        comparison = None
        discrepancy_notes = []

        if len(parsed_bills) >= 2:
            current_bill = parsed_bills[0]
            previous_bill = parsed_bills[1]
            comparison = self._compute_comparison(current_bill, previous_bill)

            if comparison.get("amount_change_percent") is not None:
                amt_pct = comparison["amount_change_percent"]
                usage_pct = comparison.get("usage_change_percent")

                if amt_pct > 15.0 and (usage_pct is None or usage_pct < 5.0):
                    discrepancy_notes.append(
                        f"Disproportionate cost increase: Bill total increased by {amt_pct:.1f}% "
                        f"while recorded consumption changed by only {usage_pct if usage_pct is not None else 0:.1f}%."
                    )
                elif amt_pct > 25.0:
                    discrepancy_notes.append(
                        f"Significant total increase: Billing total increased by {amt_pct:.1f}% compared to prior billing cycle."
                    )

        # Missing requirements check
        missing_requirements: List[str] = []
        if not provider_name:
            missing_requirements.append("Utility provider name")
        if not account_number:
            missing_requirements.append("Customer account or reference number")
        if not total_amount:
            missing_requirements.append("Total bill amount payable")
        if not due_date and not billing_period:
            missing_requirements.append("Billing period or due date")

        workflow_status = "ready_for_review" if not missing_requirements else "needs_information"

        collected_information = {
            "provider_name": provider_name,
            "account_number": account_number,
            "billing_period": billing_period,
            "due_date": due_date,
            "total_amount": total_amount,
            "usage_quantity": usage_quantity,
            "customer_name": customer_name,
            "customer_address": customer_address,
            "parsed_bills": parsed_bills,
            "comparison": comparison,
            "discrepancy_notes": discrepancy_notes,
            "inquiry_reason": user_inputs.get("inquiry_reason") or "Request for clarification on sudden rate or charge increase.",
        }

        return {
            "status": workflow_status,
            "collected_information": collected_information,
            "missing_requirements": missing_requirements,
        }

    def _extract_bill_info(self, doc_id: str, facts: List[Dict[str, Any]]) -> Dict[str, Any]:
        info: Dict[str, Any] = {"document_id": doc_id}
        for f in facts:
            name = f.get("field_name")
            val = f.get("field_value")
            if name == "provider_name" and "provider_name" not in info:
                info["provider_name"] = val
            elif name in {"identifier", "account_number"} and "account_number" not in info:
                info["account_number"] = val
            elif name == "billing_period" and "billing_period" not in info:
                info["billing_period"] = val
            elif name == "due_date" and "due_date" not in info:
                info["due_date"] = val
            elif name == "amount" and "total_amount" not in info:
                try:
                    info["total_amount"] = float(val)
                except ValueError:
                    info["total_amount"] = val
            elif name == "usage_quantity" and "usage_quantity" not in info:
                info["usage_quantity"] = val

        return info

    def _compute_comparison(
        self,
        current: Dict[str, Any],
        previous: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Computes differences and percentage changes between current and previous bill.
        ONLY computes changes when matching data is present in both bills.
        """
        res: Dict[str, Any] = {
            "current_period": current.get("billing_period"),
            "previous_period": previous.get("billing_period"),
        }

        # Amount comparison
        curr_amt = current.get("total_amount")
        prev_amt = previous.get("total_amount")

        if isinstance(curr_amt, (int, float)) and isinstance(prev_amt, (int, float)):
            delta_amt = round(curr_amt - prev_amt, 2)
            pct_amt = round(((curr_amt - prev_amt) / prev_amt) * 100, 2) if prev_amt > 0 else 0.0
            res["current_amount"] = curr_amt
            res["previous_amount"] = prev_amt
            res["amount_change"] = delta_amt
            res["amount_change_percent"] = pct_amt

        # Usage comparison
        curr_u = self._parse_numeric_usage(current.get("usage_quantity"))
        prev_u = self._parse_numeric_usage(previous.get("usage_quantity"))

        if curr_u is not None and prev_u is not None:
            delta_u = round(curr_u - prev_u, 2)
            pct_u = round(((curr_u - prev_u) / prev_u) * 100, 2) if prev_u > 0 else 0.0
            res["current_usage"] = curr_u
            res["previous_usage"] = prev_u
            res["usage_change"] = delta_u
            res["usage_change_percent"] = pct_u

            # Effective rate per unit
            if isinstance(curr_amt, (int, float)) and isinstance(prev_amt, (int, float)):
                if curr_u > 0 and prev_u > 0:
                    curr_rate = round(curr_amt / curr_u, 4)
                    prev_rate = round(prev_amt / prev_u, 4)
                    delta_rate = round(curr_rate - prev_rate, 4)
                    res["current_rate_per_unit"] = curr_rate
                    res["previous_rate_per_unit"] = prev_rate
                    res["rate_change_per_unit"] = delta_rate

        return res

    def _parse_numeric_usage(self, usage_str: Optional[str]) -> Optional[float]:
        if not usage_str:
            return None
        parts = usage_str.split()
        if parts:
            try:
                return float(parts[0])
            except ValueError:
                return None
        return None
