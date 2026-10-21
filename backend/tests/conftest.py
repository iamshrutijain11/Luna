"""Pytest test configuration and fixtures with synthetic document generators."""

import io
from pathlib import Path
from typing import Generator
import fitz  # PyMuPDF
from PIL import Image
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from backend.app.config import settings
from backend.app.core.database import Base, get_db
from backend.app.main import app


# Use isolated SQLite test database
TEST_DB_PATH = settings.BASE_DIR / "test_lifedesk.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Sets up test database tables and tears down on completion."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provides a transactional database session rolled back after each test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient overriding get_db dependency with test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==========================================
# Synthetic Document Generation Helpers
# (Fictional test data only)
# ==========================================

def create_synthetic_warranty_pdf() -> bytes:
    """Creates a valid digital PDF with warranty details."""
    doc = fitz.open()
    page = doc.new_page()
    content = (
        "ACME ELECTRONICS LIMITED WARRANTY\n\n"
        "Product: SmartHome Hub Max\n"
        "Model: SH-2024-X\n"
        "Invoice No: INV-88991\n"
        "Purchase Date: 2026-01-15\n"
        "Warranty Duration: 2 years limited warranty\n"
        "Coverage: ACME warrants against defects in materials and workmanship.\n"
        "Claim Requirements: Proof of purchase, original receipt, and device serial number.\n"
        "Exclusions: Water damage, accidental damage, and unauthorized repair are not covered.\n"
    )
    page.insert_text((50, 70), content, fontsize=12)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def create_synthetic_utility_bill_pdf(
    provider: str = "Apex Power & Light",
    account: str = "ACC-445566",
    billing_period: str = "2026-08-01 to 2026-08-31",
    due_date: str = "2026-09-15",
    total_amount: str = "142.50",
    usage: str = "850 kWh",
) -> bytes:
    """Creates a valid digital utility bill PDF."""
    doc = fitz.open()
    page = doc.new_page()
    content = (
        f"{provider}\n"
        "Monthly Statement & Service Invoice\n\n"
        f"Account No: {account}\n"
        f"Billing Period: {billing_period}\n"
        f"Due Date: {due_date}\n"
        f"Total Amount: ${total_amount}\n"
        f"Energy Used: {usage}\n"
        "Delivery and distribution charges included.\n"
    )
    page.insert_text((50, 70), content, fontsize=12)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def create_synthetic_invoice_pdf() -> bytes:
    """Creates a valid purchase invoice PDF."""
    doc = fitz.open()
    page = doc.new_page()
    content = (
        "BEST TECH RETAIL CORP\n"
        "Official Sales Invoice\n\n"
        "Invoice No: INV-99001\n"
        "Invoice Date: 2026-02-10\n"
        "Customer: Jane Doe\n"
        "Product: SmartHome Hub Max\n"
        "Unit Price: $299.99\n"
        "Total Amount: $299.99\n"
    )
    page.insert_text((50, 70), content, fontsize=12)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def create_scanned_empty_pdf() -> bytes:
    """Creates a PDF with blank pages (simulating scanned document without digital text)."""
    doc = fitz.open()
    doc.new_page()  # Blank page with no text
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def create_encrypted_pdf() -> bytes:
    """Creates a password-protected PDF."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 70), "Confidential Secret Text", fontsize=12)
    pdf_bytes = doc.write(encryption=fitz.PDF_ENCRYPT_AES_256, owner_pw="owner123", user_pw="secretpw")
    doc.close()
    return pdf_bytes


def create_synthetic_image(format: str = "PNG") -> bytes:
    """Creates a valid PNG or JPEG image file."""
    img = Image.new("RGB", (200, 200), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()
