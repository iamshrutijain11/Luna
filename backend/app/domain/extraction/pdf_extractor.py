"""PyMuPDF digital PDF text and metadata extraction with page provenance and scanned detection."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional
import fitz  # PyMuPDF

from backend.app.core.exceptions import DocumentCorruptException, DocumentEncryptedException


@dataclass
class PageData:
    page_number: int
    text: str
    char_count: int
    word_count: int


@dataclass
class PDFExtractionResult:
    pages: List[PageData]
    metadata: Dict[str, str]
    total_chars: int
    total_words: int
    is_scanned_or_empty: bool
    page_count: int


class PDFExtractor:
    # If average characters per page is below 35, the PDF is likely scanned or image-based
    MIN_CHARS_PER_PAGE_THRESHOLD = 35

    def extract(self, file_path: Path) -> PDFExtractionResult:
        if not file_path.exists():
            raise DocumentCorruptException("PDF file does not exist on disk.")

        try:
            doc = fitz.open(str(file_path))
        except Exception as e:
            raise DocumentCorruptException(f"Failed to open PDF: {str(e)}")

        try:
            # Check encryption
            if doc.is_encrypted:
                # Try empty string password
                auth_success = doc.authenticate("")
                if not auth_success:
                    raise DocumentEncryptedException()

            page_count = len(doc)
            pages: List[PageData] = []
            total_chars = 0
            total_words = 0

            for p_num in range(page_count):
                page = doc.load_page(p_num)
                text = page.get_text("text") or ""
                clean_text = text.strip()
                words = clean_text.split()
                char_len = len(clean_text)
                word_len = len(words)

                total_chars += char_len
                total_words += word_len

                pages.append(
                    PageData(
                        page_number=p_num + 1,  # 1-indexed
                        text=clean_text,
                        char_count=char_len,
                        word_count=word_len,
                    )
                )

            # Metadata extraction
            raw_meta = doc.metadata or {}
            meta = {
                "title": str(raw_meta.get("title") or ""),
                "author": str(raw_meta.get("author") or ""),
                "subject": str(raw_meta.get("subject") or ""),
                "creation_date": str(raw_meta.get("creationDate") or ""),
            }

            # Scanned / empty document heuristic
            avg_chars = (total_chars / page_count) if page_count > 0 else 0
            is_scanned = total_chars < 50 or avg_chars < self.MIN_CHARS_PER_PAGE_THRESHOLD

            return PDFExtractionResult(
                pages=pages,
                metadata=meta,
                total_chars=total_chars,
                total_words=total_words,
                is_scanned_or_empty=is_scanned,
                page_count=page_count,
            )
        except (DocumentEncryptedException, DocumentCorruptException):
            raise
        except Exception as e:
            raise DocumentCorruptException(f"Error parsing PDF content: {str(e)}")
        finally:
            doc.close()
