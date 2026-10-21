"""Tests for file validation, size enforcement, magic byte signatures, and security controls."""

import pytest
from backend.app.config import settings
from backend.app.core.exceptions import (
    DocumentCorruptException,
    DocumentEncryptedException,
    OversizedFileException,
    UnsupportedMediaException,
    ValidationException,
)
from backend.app.core.security import (
    generate_safe_storage_filename,
    sanitize_filename,
    validate_file_content,
)
from backend.app.domain.extraction.pdf_extractor import PDFExtractor
from backend.app.domain.extraction.image_extractor import ImageExtractor
from backend.tests.conftest import (
    create_encrypted_pdf,
    create_synthetic_image,
    create_synthetic_warranty_pdf,
)


def test_sanitize_filename_rejects_path_traversal():
    malicious_names = [
        "../../etc/passwd",
        "..\\..\\windows\\system32\\calc.exe",
        "folder/../../../secret.pdf",
        "normal_document.pdf\0.exe",
        "...///...test.pdf",
    ]
    for bad in malicious_names:
        sanitized = sanitize_filename(bad)
        assert "/" not in sanitized
        assert "\\" not in sanitized
        assert ".." not in sanitized
        assert "\0" not in sanitized


def test_generate_safe_storage_filename():
    safe_name, ext = generate_safe_storage_filename("../malicious/invoice.pdf")
    assert ext == ".pdf"
    assert safe_name.endswith(".pdf")
    assert len(safe_name) > 30  # UUID hex length + extension


def test_validate_file_content_valid_pdf():
    pdf_bytes = create_synthetic_warranty_pdf()
    mime, name = validate_file_content(pdf_bytes, "warranty_doc.pdf")
    assert mime == "application/pdf"
    assert name == "warranty_doc.pdf"


def test_validate_file_content_valid_image():
    png_bytes = create_synthetic_image(format="PNG")
    mime, name = validate_file_content(png_bytes, "bill_scan.png")
    assert mime == "image/png"


def test_validate_file_content_empty_file():
    with pytest.raises(ValidationException):
        validate_file_content(b"", "empty.pdf")


def test_validate_file_content_oversized():
    # Exceed settings.MAX_UPLOAD_SIZE_BYTES
    fake_large_bytes = b"%PDF-" + b"0" * (settings.MAX_UPLOAD_SIZE_BYTES + 10)
    with pytest.raises(OversizedFileException):
        validate_file_content(fake_large_bytes, "huge.pdf")


def test_validate_file_content_magic_mismatch():
    # Content has PNG signature, but filename claims it's .pdf
    png_bytes = create_synthetic_image(format="PNG")
    with pytest.raises(UnsupportedMediaException):
        validate_file_content(png_bytes, "fake_doc.pdf")


def test_validate_file_content_unsupported_extension():
    with pytest.raises(UnsupportedMediaException):
        validate_file_content(b"some random executable text", "malware.exe")


def test_encrypted_pdf_handling(tmp_path):
    enc_pdf = create_encrypted_pdf()
    p = tmp_path / "encrypted.pdf"
    p.write_bytes(enc_pdf)

    extractor = PDFExtractor()
    with pytest.raises(DocumentEncryptedException):
        extractor.extract(p)


def test_corrupt_pdf_handling(tmp_path):
    # Header says %PDF but the rest is garbage
    corrupt_pdf = b"%PDF-1.4\nGarbage data not a real pdf structure"
    p = tmp_path / "corrupt.pdf"
    p.write_bytes(corrupt_pdf)

    extractor = PDFExtractor()
    with pytest.raises(DocumentCorruptException):
        extractor.extract(p)


def test_corrupt_image_handling(tmp_path):
    corrupt_img = b"\x89PNG\r\n\x1a\nCorrupt png bytes"
    p = tmp_path / "corrupt.png"
    p.write_bytes(corrupt_img)

    extractor = ImageExtractor()
    with pytest.raises(DocumentCorruptException):
        extractor.extract(p)
