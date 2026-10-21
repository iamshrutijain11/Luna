"""Domain Extraction Engine orchestrating PDF/Image text extraction, deterministic parsing, and provenance tracking."""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.app.domain.extraction.deterministic_patterns import (
    find_amounts_with_evidence,
    find_dates_with_evidence,
    find_identifiers_with_evidence,
    find_usage,
    find_warranty_duration,
    extract_context_excerpt,
)
from backend.app.domain.extraction.image_extractor import ImageExtractor
from backend.app.domain.extraction.pdf_extractor import PDFExtractor, PageData
from backend.app.models.extracted_field import ExtractedField


@dataclass
class ExtractionOutput:
    status: str  # "processed", "needs_ocr", "failed"
    document_type: str  # "warranty", "invoice", "utility_bill", "unknown"
    fields: List[ExtractedField]
    summary: Dict[str, Any]


class ExtractionEngine:
    def __init__(self):
        self.pdf_extractor = PDFExtractor()
        self.image_extractor = ImageExtractor()

    def classify_document(self, text: str, user_hint: Optional[str] = None) -> str:
        """Determines document type based on text content and keywords."""
        if user_hint and user_hint in {"warranty", "invoice", "utility_bill"}:
            return user_hint

        lower = text.lower()

        # Utility bill indicators
        utility_score = sum(
            1 for w in ["electric", "water", "gas", "utility", "kwh", "therms", "meter read", "power supply", "service address", "energy charge"]
            if w in lower
        )

        # Warranty indicators
        warranty_score = sum(
            1 for w in ["warranty", "guarantee", "limited warranty", "warranty period", "defects in materials", "coverage terms", "exclusions", "authorized service"]
            if w in lower
        )

        # Invoice indicators
        invoice_score = sum(
            1 for w in ["invoice", "bill to", "ship to", "purchase order", "invoice date", "subtotal", "payment terms", "order number", "item description"]
            if w in lower
        )

        if utility_score >= 2 and utility_score > warranty_score and utility_score > invoice_score:
            return "utility_bill"
        if warranty_score >= 2 and warranty_score >= invoice_score:
            return "warranty"
        if invoice_score >= 2:
            return "invoice"

        return "unknown"

    def process_document(
        self,
        doc_id: str,
        file_path: Path,
        mime_type: str,
        user_hint: Optional[str] = None,
    ) -> ExtractionOutput:
        """
        Executes extraction pipeline:
        1. Extract raw page content or image metadata.
        2. Verify extractability. If scanned without OCR, return needs_ocr.
        3. Run deterministic field extraction with provenance.
        4. Classify document type and build structured summary.
        """
        if mime_type == "application/pdf":
            return self._process_pdf(doc_id, file_path, user_hint)
        elif mime_type in {"image/jpeg", "image/png"}:
            return self._process_image(doc_id, file_path, user_hint)
        else:
            return ExtractionOutput(
                status="failed",
                document_type=user_hint or "unknown",
                fields=[],
                summary={"error": f"Unsupported MIME type {mime_type}"},
            )

    def _process_pdf(self, doc_id: str, file_path: Path, user_hint: Optional[str]) -> ExtractionOutput:
        pdf_res = self.pdf_extractor.extract(file_path)

        if pdf_res.is_scanned_or_empty:
            # Scanned PDF detected, lacks machine-readable text
            return ExtractionOutput(
                status="needs_ocr",
                document_type=user_hint or "unknown",
                fields=[],
                summary={
                    "page_count": pdf_res.page_count,
                    "message": "Scanned or empty document detected. OCR pipeline required for full text extraction.",
                    "scanned": True,
                },
            )

        full_text = "\n\n".join(p.text for p in pdf_res.pages)
        detected_type = self.classify_document(full_text, user_hint)

        extracted_fields: List[ExtractedField] = []
        summary: Dict[str, Any] = {
            "page_count": pdf_res.page_count,
            "metadata": pdf_res.metadata,
            "detected_type": detected_type,
        }

        # Page-by-page extraction
        all_dates = []
        all_amounts = []
        all_ids = []

        for page in pdf_res.pages:
            p_text = page.text
            p_num = page.page_number

            # 1. Dates
            page_dates = find_dates_with_evidence(p_text)
            for d in page_dates:
                all_dates.append(d)
                extracted_fields.append(
                    ExtractedField(
                        document_id=doc_id,
                        field_name="date",
                        field_value=d["parsed"],
                        source_page=p_num,
                        source_excerpt=d["excerpt"],
                        extraction_method="deterministic",
                        confidence_if_available=0.95,
                    )
                )

            # 2. Amounts
            page_amounts = find_amounts_with_evidence(p_text)
            for a in page_amounts:
                all_amounts.append(a)
                extracted_fields.append(
                    ExtractedField(
                        document_id=doc_id,
                        field_name="amount",
                        field_value=str(a["value"]),
                        source_page=p_num,
                        source_excerpt=a["excerpt"],
                        extraction_method="deterministic",
                        confidence_if_available=0.90,
                    )
                )

            # 3. Identifiers
            page_ids = find_identifiers_with_evidence(p_text)
            for i in page_ids:
                all_ids.append(i)
                extracted_fields.append(
                    ExtractedField(
                        document_id=doc_id,
                        field_name="identifier",
                        field_value=i["identifier"],
                        source_page=p_num,
                        source_excerpt=i["excerpt"],
                        extraction_method="deterministic",
                        confidence_if_available=0.90,
                    )
                )

        # Specialized domain heuristics based on detected_type
        if detected_type == "warranty":
            self._extract_warranty_specifics(doc_id, pdf_res.pages, extracted_fields, summary)
        elif detected_type == "utility_bill":
            self._extract_utility_specifics(doc_id, pdf_res.pages, extracted_fields, summary)
        elif detected_type == "invoice":
            self._extract_invoice_specifics(doc_id, pdf_res.pages, extracted_fields, summary)

        summary["total_fields_extracted"] = len(extracted_fields)
        return ExtractionOutput(
            status="processed",
            document_type=detected_type,
            fields=extracted_fields,
            summary=summary,
        )

    def _process_image(self, doc_id: str, file_path: Path, user_hint: Optional[str]) -> ExtractionOutput:
        img_res = self.image_extractor.extract(file_path)

        if img_res.needs_ocr or not img_res.text:
            return ExtractionOutput(
                status="needs_ocr",
                document_type=user_hint or "unknown",
                fields=[],
                summary={
                    "width": img_res.width,
                    "height": img_res.height,
                    "format": img_res.format,
                    "ocr_available": img_res.ocr_available,
                    "message": "Scanned image uploaded. Document requires OCR pipeline to extract text.",
                    "scanned": True,
                },
            )

        # If OCR text is available
        detected_type = self.classify_document(img_res.text, user_hint)
        # Parse text like a single page
        dummy_page = PageData(page_number=1, text=img_res.text, char_count=len(img_res.text), word_count=len(img_res.text.split()))
        extracted_fields: List[ExtractedField] = []
        summary: Dict[str, Any] = {"detected_type": detected_type, "ocr": True}

        if detected_type == "warranty":
            self._extract_warranty_specifics(doc_id, [dummy_page], extracted_fields, summary)
        elif detected_type == "utility_bill":
            self._extract_utility_specifics(doc_id, [dummy_page], extracted_fields, summary)
        elif detected_type == "invoice":
            self._extract_invoice_specifics(doc_id, [dummy_page], extracted_fields, summary)

        return ExtractionOutput(
            status="processed",
            document_type=detected_type,
            fields=extracted_fields,
            summary=summary,
        )

    def _extract_warranty_specifics(
        self,
        doc_id: str,
        pages: List[PageData],
        fields: List[ExtractedField],
        summary: Dict[str, Any],
    ) -> None:
        """Extracts warranty duration, exclusions, claim requirements, product details."""
        for page in pages:
            text = page.text
            p_num = page.page_number

            # Duration
            duration = find_warranty_duration(text)
            if duration:
                num, unit, excerpt = duration
                fields.append(
                    ExtractedField(
                        document_id=doc_id,
                        field_name="warranty_duration",
                        field_value=f"{num} {unit}s",
                        source_page=p_num,
                        source_excerpt=excerpt,
                        extraction_method="heuristic",
                        confidence_if_available=0.92,
                    )
                )
                summary["warranty_duration"] = f"{num} {unit}s"

            # Check for exclusions keywords
            exclusion_keywords = ["water damage", "accidental damage", "unauthorized repair", "normal wear and tear", "abuse or misuse", "cosmetic damage"]
            for kw in exclusion_keywords:
                idx = text.lower().find(kw)
                if idx != -1:
                    excerpt = extract_context_excerpt(text, idx, idx + len(kw))
                    fields.append(
                        ExtractedField(
                            document_id=doc_id,
                            field_name="exclusion_term",
                            field_value=kw.title(),
                            source_page=p_num,
                            source_excerpt=excerpt,
                            extraction_method="heuristic",
                            confidence_if_available=0.88,
                        )
                    )

            # Check for claim requirements keywords
            claim_req_keywords = [
                ("proof of purchase", "Proof of Purchase (Receipt/Invoice)"),
                ("original receipt", "Original Receipt"),
                ("serial number", "Serial Number"),
                ("photo of damage", "Photographic Evidence"),
                ("rma", "Return Merchandise Authorization (RMA)"),
            ]
            for kw, label in claim_req_keywords:
                idx = text.lower().find(kw)
                if idx != -1:
                    excerpt = extract_context_excerpt(text, idx, idx + len(kw))
                    fields.append(
                        ExtractedField(
                            document_id=doc_id,
                            field_name="claim_requirement",
                            field_value=label,
                            source_page=p_num,
                            source_excerpt=excerpt,
                            extraction_method="heuristic",
                            confidence_if_available=0.85,
                        )
                    )

            # Look for Product Name / Model
            lines = [line.strip() for line in text.split("\n") if line.strip()]
            for line in lines:
                lower_line = line.lower()
                if lower_line.startswith(("product:", "item:", "model:", "device:", "equipment:")):
                    parts = line.split(":", 1)
                    if len(parts) == 2 and parts[1].strip():
                        val = parts[1].strip()
                        fields.append(
                            ExtractedField(
                                document_id=doc_id,
                                field_name="product_name",
                                field_value=val,
                                source_page=p_num,
                                source_excerpt=line,
                                extraction_method="heuristic",
                                confidence_if_available=0.85,
                            )
                        )
                        summary["product_name"] = val

    def _extract_utility_specifics(
        self,
        doc_id: str,
        pages: List[PageData],
        fields: List[ExtractedField],
        summary: Dict[str, Any],
    ) -> None:
        """Extracts provider name, billing period, due date, usage, total amount."""
        for page in pages:
            text = page.text
            p_num = page.page_number

            # Usage
            usage_data = find_usage(text)
            if usage_data:
                qty, unit, excerpt = usage_data
                fields.append(
                    ExtractedField(
                        document_id=doc_id,
                        field_name="usage_quantity",
                        field_value=f"{qty} {unit}",
                        source_page=p_num,
                        source_excerpt=excerpt,
                        extraction_method="heuristic",
                        confidence_if_available=0.90,
                    )
                )
                summary["usage"] = f"{qty} {unit}"

            # Due Date
            for line in text.split("\n"):
                lower = line.lower()
                if "due date" in lower or "pay by" in lower:
                    dates = find_dates_with_evidence(line)
                    if dates:
                        fields.append(
                            ExtractedField(
                                document_id=doc_id,
                                field_name="due_date",
                                field_value=dates[0]["parsed"],
                                source_page=p_num,
                                source_excerpt=line.strip(),
                                extraction_method="deterministic",
                                confidence_if_available=0.92,
                            )
                        )
                        summary["due_date"] = dates[0]["parsed"]
                        break

            # Billing Period
            for line in text.split("\n"):
                lower = line.lower()
                if "billing period" in lower or "service period" in lower or "statement period" in lower:
                    dates = find_dates_with_evidence(line)
                    if len(dates) >= 2:
                        period_str = f"{dates[0]['parsed']} to {dates[1]['parsed']}"
                        fields.append(
                            ExtractedField(
                                document_id=doc_id,
                                field_name="billing_period",
                                field_value=period_str,
                                source_page=p_num,
                                source_excerpt=line.strip(),
                                extraction_method="heuristic",
                                confidence_if_available=0.85,
                            )
                        )
                        summary["billing_period"] = period_str
                        break

            # Provider Name (usually at the very top of first page)
            if p_num == 1:
                first_lines = [l.strip() for l in text.split("\n") if l.strip()]
                if first_lines:
                    potential_provider = first_lines[0]
                    # Filter out generic words
                    if len(potential_provider) < 60 and not potential_provider.lower().startswith(("page", "invoice", "statement", "http")):
                        fields.append(
                            ExtractedField(
                                document_id=doc_id,
                                field_name="provider_name",
                                field_value=potential_provider,
                                source_page=1,
                                source_excerpt=potential_provider,
                                extraction_method="heuristic",
                                confidence_if_available=0.80,
                            )
                        )
                        summary["provider_name"] = potential_provider

    def _extract_invoice_specifics(
        self,
        doc_id: str,
        pages: List[PageData],
        fields: List[ExtractedField],
        summary: Dict[str, Any],
    ) -> None:
        """Extracts customer, vendor, purchase date, total invoice amount."""
        for page in pages:
            text = page.text
            p_num = page.page_number

            # Vendor (Page 1 top)
            if p_num == 1:
                lines = [l.strip() for l in text.split("\n") if l.strip()]
                if lines:
                    vendor = lines[0]
                    if len(vendor) < 60:
                        fields.append(
                            ExtractedField(
                                document_id=doc_id,
                                field_name="vendor_name",
                                field_value=vendor,
                                source_page=1,
                                source_excerpt=vendor,
                                extraction_method="heuristic",
                                confidence_if_available=0.80,
                            )
                        )
                        summary["vendor_name"] = vendor

            # Purchase Date
            for line in text.split("\n"):
                lower = line.lower()
                if "invoice date" in lower or "purchase date" in lower or "order date" in lower:
                    dates = find_dates_with_evidence(line)
                    if dates:
                        fields.append(
                            ExtractedField(
                                document_id=doc_id,
                                field_name="purchase_date",
                                field_value=dates[0]["parsed"],
                                source_page=p_num,
                                source_excerpt=line.strip(),
                                extraction_method="deterministic",
                                confidence_if_available=0.95,
                            )
                        )
                        summary["purchase_date"] = dates[0]["parsed"]
                        break
