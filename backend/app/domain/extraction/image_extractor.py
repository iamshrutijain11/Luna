"""Image inspection and OCR pipeline check using Pillow."""

import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional
from PIL import Image

from backend.app.core.exceptions import DocumentCorruptException


@dataclass
class ImageExtractionResult:
    width: int
    height: int
    format: str
    mode: str
    ocr_available: bool
    text: Optional[str]
    needs_ocr: bool


class ImageExtractor:
    def __init__(self):
        # Detect if tesseract executable is installed on host system
        self._tesseract_path = shutil.which("tesseract")

    def extract(self, file_path: Path) -> ImageExtractionResult:
        if not file_path.exists():
            raise DocumentCorruptException("Image file does not exist on disk.")

        try:
            with Image.open(str(file_path)) as img:
                img.verify()  # Verify image integrity
        except Exception as e:
            raise DocumentCorruptException(f"Corrupt or invalid image file: {str(e)}")

        # Re-open after verify to get image details
        try:
            with Image.open(str(file_path)) as img:
                width, height = img.size
                img_format = img.format or "UNKNOWN"
                mode = img.mode

            extracted_text = None
            needs_ocr = True

            # If reliable tesseract is installed, attempt OCR safely
            if self._tesseract_path:
                try:
                    import pytesseract
                    extracted_text = pytesseract.image_to_string(Image.open(str(file_path))).strip()
                    if extracted_text:
                        needs_ocr = False
                except Exception:
                    # OCR failed or not configured properly
                    needs_ocr = True
            else:
                # Reliable OCR pipeline is not installed on system
                # Do NOT fabricate content; return explicit needs_ocr
                needs_ocr = True

            return ImageExtractionResult(
                width=width,
                height=height,
                format=img_format,
                mode=mode,
                ocr_available=bool(self._tesseract_path),
                text=extracted_text,
                needs_ocr=needs_ocr,
            )
        except DocumentCorruptException:
            raise
        except Exception as e:
            raise DocumentCorruptException(f"Failed to inspect image: {str(e)}")
