"""PDF Artifact Generation using ReportLab for Warranty Service Requests and Utility Inquiries."""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from backend.app.config import settings


class ArtifactGenerator:
    def generate_warranty_packet(
        self,
        workflow_id: str,
        collected_info: Dict[str, Any],
        missing_requirements: List[str],
        linked_docs: List[str],
    ) -> Path:
        """Generates a professional PDF Warranty Service Request Packet."""
        out_filename = f"warranty_claim_{workflow_id}_{uuid.uuid4().hex[:8]}.pdf"
        out_path = settings.ARTIFACTS_DIR / out_filename

        doc = SimpleDocTemplate(
            str(out_path),
            pagesize=letter,
            rightMargin=45,
            leftMargin=45,
            topMargin=45,
            bottomMargin=45,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "MainTitle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold",
        )
        subtitle_style = ParagraphStyle(
            "SubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
            fontName="Helvetica",
        )
        section_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1e293b"),
            fontName="Helvetica-Bold",
            spaceBefore=10,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#334155"),
            fontName="Helvetica",
        )
        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Normal"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748b"),
            fontName="Helvetica-Oblique",
        )

        elements = []

        # Header Banner
        elements.append(Paragraph("LIFEDESK | OFFICIAL SERVICE REQUEST PACKET", subtitle_style))
        elements.append(Paragraph("Warranty Claim & Repair Authorization Request", title_style))
        elements.append(
            Paragraph(
                f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} | "
                f"Workflow Ref: {workflow_id[:8]}",
                subtitle_style,
            )
        )
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#cbd5e1"), spaceAfter=15))

        # 1. Product Details
        elements.append(Paragraph("1. PRODUCT IDENTIFICATION", section_style))
        product_table_data = [
            [Paragraph("<b>Product Name:</b>", body_style), Paragraph(str(collected_info.get("product_name") or "N/A"), body_style)],
            [Paragraph("<b>Brand / Make:</b>", body_style), Paragraph(str(collected_info.get("brand") or "N/A"), body_style)],
            [Paragraph("<b>Model Number:</b>", body_style), Paragraph(str(collected_info.get("model_number") or "N/A"), body_style)],
            [Paragraph("<b>Serial Number:</b>", body_style), Paragraph(str(collected_info.get("serial_number") or "N/A"), body_style)],
        ]
        p_table = Table(product_table_data, colWidths=[140, 380])
        p_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(p_table)
        elements.append(Spacer(1, 12))

        # 2. Purchase & Warranty Terms
        elements.append(Paragraph("2. PURCHASE & WARRANTY DETAILS", section_style))
        purchase_table_data = [
            [Paragraph("<b>Invoice / Receipt Ref:</b>", body_style), Paragraph(str(collected_info.get("invoice_number") or "N/A"), body_style)],
            [Paragraph("<b>Purchase Date:</b>", body_style), Paragraph(str(collected_info.get("purchase_date") or "N/A"), body_style)],
            [Paragraph("<b>Warranty Duration:</b>", body_style), Paragraph(str(collected_info.get("warranty_duration") or "N/A"), body_style)],
            [Paragraph("<b>Estimated Expiry Date:</b>", body_style), Paragraph(str(collected_info.get("warranty_expiry_date") or "N/A"), body_style)],
            [Paragraph("<b>Eligibility Finding:</b>", body_style), Paragraph(f"<b>{str(collected_info.get('eligibility', 'insufficient_information')).upper()}</b> — {collected_info.get('eligibility_reason', '')}", body_style)],
        ]
        w_table = Table(purchase_table_data, colWidths=[140, 380])
        w_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(w_table)
        elements.append(Spacer(1, 12))

        # 3. Defect & Issue Description
        elements.append(Paragraph("3. DEFECT & ISSUE DESCRIPTION", section_style))
        issue_text = collected_info.get("issue_description") or "No detailed defect description provided."
        elements.append(Paragraph(issue_text, body_style))
        elements.append(Spacer(1, 12))

        # 4. Supporting Document References & Missing Requirements
        elements.append(Paragraph("4. EVIDENCE & COMPLIANCE STATUS", section_style))
        docs_summary = ", ".join(linked_docs) if linked_docs else "None attached"
        elements.append(Paragraph(f"<b>Attached Document IDs:</b> {docs_summary}", body_style))

        if missing_requirements:
            elements.append(Spacer(1, 4))
            elements.append(Paragraph("<b>Outstanding Requirements for Final Resolution:</b>", body_style))
            for req in missing_requirements:
                elements.append(Paragraph(f"• {req}", body_style))
        else:
            elements.append(Spacer(1, 4))
            elements.append(Paragraph("<b>Compliance:</b> All preliminary documentation requirements satisfied.", body_style))

        elements.append(Spacer(1, 15))

        # 5. Customer Sign-off Block
        elements.append(Paragraph("5. CLAIMANT AUTHORIZATION", section_style))
        claimant = collected_info.get("customer_name") or "Authorized Claimant"
        contact = collected_info.get("customer_contact") or "On Record"
        elements.append(Paragraph(f"<b>Claimant:</b> {claimant} | <b>Contact:</b> {contact}", body_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=10))
        elements.append(Paragraph(collected_info.get("disclaimer") or "LifeDesk preliminary assessment does not guarantee manufacturer claim acceptance.", disclaimer_style))

        doc.build(elements)
        return out_path

    def generate_utility_inquiry_letter(
        self,
        workflow_id: str,
        collected_info: Dict[str, Any],
        missing_requirements: List[str],
        linked_docs: List[str],
    ) -> Path:
        """Generates a formal PDF Utility Discrepancy Inquiry Letter."""
        out_filename = f"utility_inquiry_{workflow_id}_{uuid.uuid4().hex[:8]}.pdf"
        out_path = settings.ARTIFACTS_DIR / out_filename

        doc = SimpleDocTemplate(
            str(out_path),
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "MainTitle",
            parent=styles["Heading1"],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold",
        )
        subtitle_style = ParagraphStyle(
            "SubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
            fontName="Helvetica",
        )
        section_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            fontName="Helvetica-Bold",
            spaceBefore=10,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#334155"),
            fontName="Helvetica",
        )

        elements = []

        # Header Block
        today_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
        provider = collected_info.get("provider_name") or "Customer Billing Support"
        elements.append(Paragraph(f"<b>Date:</b> {today_str}", subtitle_style))
        elements.append(Paragraph(f"<b>To:</b> {provider}", subtitle_style))
        elements.append(Paragraph("Billing & Meter Audit Department", subtitle_style))
        elements.append(Spacer(1, 10))

        elements.append(Paragraph("<b>FORMAL BILLING INQUIRY & DISCREPANCY AUDIT REQUEST</b>", title_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

        # Account details table
        account_data = [
            [Paragraph("<b>Account / Reference #:</b>", body_style), Paragraph(str(collected_info.get("account_number") or "N/A"), body_style)],
            [Paragraph("<b>Customer Name:</b>", body_style), Paragraph(str(collected_info.get("customer_name") or "Valued Customer"), body_style)],
            [Paragraph("<b>Service Address:</b>", body_style), Paragraph(str(collected_info.get("customer_address") or "On File"), body_style)],
            [Paragraph("<b>Disputed Period / Due Date:</b>", body_style), Paragraph(f"Period: {collected_info.get('billing_period') or 'N/A'} | Due: {collected_info.get('due_date') or 'N/A'}", body_style)],
            [Paragraph("<b>Current Statement Total:</b>", body_style), Paragraph(f"${collected_info.get('total_amount', 'N/A')}", body_style)],
        ]
        acc_table = Table(account_data, colWidths=[160, 350])
        acc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0f9ff")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#bae6fd")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e0f2fe")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(acc_table)
        elements.append(Spacer(1, 14))

        # Formal statement
        elements.append(
            Paragraph(
                "Dear Billing Operations Specialist,<br/><br/>"
                "I am writing to formally request a review and verification of the charges indicated on my recent utility statement. "
                "Following analysis of current consumption against historical billing trends, notable variance was identified.",
                body_style,
            )
        )
        elements.append(Spacer(1, 10))

        # Comparison Section if available
        comparison = collected_info.get("comparison")
        if comparison:
            elements.append(Paragraph("Comparative Variance Summary:", section_style))
            comp_table_data = [
                ["Metric", "Previous Cycle", "Current Cycle", "Variance"],
                [
                    "Total Billed",
                    f"${comparison.get('previous_amount', 'N/A')}",
                    f"${comparison.get('current_amount', 'N/A')}",
                    f"{'+' if comparison.get('amount_change_percent', 0) > 0 else ''}{comparison.get('amount_change_percent', 'N/A')}%",
                ],
                [
                    "Usage Quantity",
                    f"{comparison.get('previous_usage', 'N/A')}",
                    f"{comparison.get('current_usage', 'N/A')}",
                    f"{'+' if comparison.get('usage_change_percent', 0) > 0 else ''}{comparison.get('usage_change_percent', 'N/A')}%",
                ],
            ]
            c_table = Table(comp_table_data, colWidths=[140, 120, 120, 130])
            c_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0284c7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(c_table)
            elements.append(Spacer(1, 10))

        # Discrepancy details
        discrepancies = collected_info.get("discrepancy_notes") or []
        if discrepancies:
            elements.append(Paragraph("Discrepancy Findings:", section_style))
            for note in discrepancies:
                elements.append(Paragraph(f"• {note}", body_style))
            elements.append(Spacer(1, 10))

        # Specific Requests
        elements.append(Paragraph("Requested Actions:", section_style))
        elements.append(Paragraph("1. Re-examine the physical or remote meter reading for the indicated billing cycle.", body_style))
        elements.append(Paragraph("2. Confirm whether estimated or actual reads were applied to this invoice.", body_style))
        elements.append(Paragraph("3. Provide an itemized tariff breakdown accounting for the charge variance.", body_style))
        elements.append(Spacer(1, 15))

        # Sign-off
        elements.append(Paragraph("Sincerely,", body_style))
        elements.append(Spacer(1, 5))
        elements.append(Paragraph(f"<b>{collected_info.get('customer_name') or 'Customer'}</b>", body_style))
        elements.append(Paragraph(f"LifeDesk Assistant Reference: {workflow_id[:8]}", subtitle_style))

        doc.build(elements)
        return out_path
