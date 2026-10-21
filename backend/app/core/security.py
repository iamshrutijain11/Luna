"""Security utilities: safe filename generation, path traversal defense, magic bytes inspection."""

import re
import uuid
from pathlib import Path
from typing import Tuple

from backend.app.config import settings
from backend.app.core.exceptions import (
    OversizedFileException,
    UnsupportedMediaException,
    ValidationException,
)

# Known Magic Bytes signatures
MAGIC_SIGNATURES = {
    "application/pdf": [b"%PDF-"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
}

EXTENSION_MIME_MAP = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes user-provided filename to prevent path traversal or injection.
    Strips directory separators, relative path markers, and non-printable characters.
    """
    if not filename:
        return "unnamed_document"

    # Extract only the basename (removes ../ or ..\ or leading drives)
    base = Path(filename).name

    # Remove any null bytes or path separators
    clean = base.replace("\0", "").replace("/", "").replace("\\", "")

    # Clean characters, allow alphanumeric, dots, underscores, dashes
    clean = re.sub(r"[^a-zA-Z0-9._-]", "_", clean)

    # Prevent hidden files or double dots
    clean = re.sub(r"^\.+", "", clean)
    clean = re.sub(r"\.{2,}", ".", clean)

    if not clean or clean == ".":
        clean = "document"

    return clean[:255]


def generate_safe_storage_filename(original_filename: str) -> Tuple[str, str]:
    """
    Generates a cryptographically random, collision-resistant unique filename.
    Returns (safe_filename, file_extension).
    """
    sanitized = sanitize_filename(original_filename)
    suffix = Path(sanitized).suffix.lower()

    if suffix not in settings.ALLOWED_EXTENSIONS:
        # Default to bin or inspect later
        suffix = ".bin"

    unique_id = uuid.uuid4().hex
    safe_filename = f"{unique_id}{suffix}"
    return safe_filename, suffix


def validate_file_content(content: bytes, original_filename: str) -> Tuple[str, str]:
    """
    Validates file size, file extension, and actual magic bytes signature.
    Returns (detected_mime_type, sanitized_filename).
    Raises OversizedFileException, UnsupportedMediaException, or ValidationException.
    """
    # 1. Enforce size limit
    size_bytes = len(content)
    if size_bytes == 0:
        raise ValidationException("Uploaded file is empty (0 bytes).")

    if size_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
        raise OversizedFileException(
            max_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
            received_bytes=size_bytes,
        )

    # 2. Check sanitized extension
    sanitized_name = sanitize_filename(original_filename)
    suffix = Path(sanitized_name).suffix.lower()

    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise UnsupportedMediaException(
            mime_type=suffix or "unknown",
            reason=f"File extension '{suffix}' is not permitted. Allowed extensions: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}",
        )

    expected_mime = EXTENSION_MIME_MAP.get(suffix)

    # 3. Magic bytes verification
    detected_mime = None
    for mime, signatures in MAGIC_SIGNATURES.items():
        for sig in signatures:
            if content.startswith(sig):
                detected_mime = mime
                break
        if detected_mime:
            break

    if not detected_mime:
        raise UnsupportedMediaException(
            mime_type="unknown",
            reason="File header magic bytes do not match any allowed document types (PDF, JPEG, PNG).",
        )

    if expected_mime and detected_mime != expected_mime:
        # Mismatch between extension and actual payload header
        raise UnsupportedMediaException(
            mime_type=detected_mime,
            reason=f"File signature ({detected_mime}) does not match file extension '{suffix}'.",
        )

    return detected_mime, sanitized_name


def verify_safe_path(target_path: Path, base_dir: Path) -> Path:
    """
    Verifies that target_path strictly resolves inside base_dir to eliminate path traversal.
    """
    resolved_target = target_path.resolve()
    resolved_base = base_dir.resolve()

    try:
        resolved_target.relative_to(resolved_base)
    except ValueError:
        raise ValidationException("Path traversal attempt detected. Operation denied.")

    return resolved_target
