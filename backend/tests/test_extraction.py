"""Tests for PyMuPDF document extraction, multi-page handling, and provenance tracking."""

from backend.app.domain.extraction.engine import ExtractionEngine
from backend.app.domain.extraction.pdf_extractor import PDFExtractor
from backend.tests.conftest import (
    create_scanned_empty_pdf,
    create_synthetic_image,
    create_synthetic_warranty_pdf,
)


def test_pdf_extractor_digital_text(tmp_path):
    pdf_bytes = create_synthetic_warranty_pdf()
    p = tmp_path / "warranty.pdf"
    p.write_bytes(pdf_bytes)

    extractor = PDFExtractor()
    res = extractor.extract(p)

    assert not res.is_scanned_or_empty
    assert res.page_count == 1
    assert "ACME ELECTRONICS" in res.pages[0].text
    assert res.pages[0].page_number == 1
    assert res.total_words > 20


def test_pdf_extractor_detects_scanned_document(tmp_path):
    scanned_bytes = create_scanned_empty_pdf()
    p = tmp_path / "scanned.pdf"
    p.write_bytes(scanned_bytes)

    extractor = PDFExtractor()
    res = extractor.extract(p)

    assert res.is_scanned_or_empty
    assert res.total_chars < 50


def test_extraction_engine_warranty_fields(tmp_path):
    pdf_bytes = create_synthetic_warranty_pdf()
    p = tmp_path / "warranty.pdf"
    p.write_bytes(pdf_bytes)

    engine = ExtractionEngine()
    out = engine.process_document(
        doc_id="doc-test-1",
        file_path=p,
        mime_type="application/pdf",
    )

    assert out.status == "processed"
    assert out.document_type == "warranty"
    assert len(out.fields) > 0

    # Verify provenance and evidence
    fields_by_name = {f.field_name: f for f in out.fields}
    assert "warranty_duration" in fields_by_name
    dur_field = fields_by_name["warranty_duration"]
    assert dur_field.source_page == 1
    assert "years" in dur_field.field_value.lower()
    assert dur_field.source_excerpt is not None
    assert dur_field.extraction_method in {"deterministic", "heuristic"}


def test_image_extraction_returns_needs_ocr_without_fabrication(tmp_path):
    png_bytes = create_synthetic_image()
    p = tmp_path / "scan.png"
    p.write_bytes(png_bytes)

    engine = ExtractionEngine()
    out = engine.process_document(
        doc_id="doc-img-1",
        file_path=p,
        mime_type="image/png",
    )

    # Scanned image without installed OCR engine must return needs_ocr and NO fabricated text
    assert out.status == "needs_ocr"
    assert len(out.fields) == 0
    assert out.summary.get("scanned") is True
