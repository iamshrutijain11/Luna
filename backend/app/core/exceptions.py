"""Domain and API exceptions for LifeDesk."""

from typing import Any, Optional


class LifeDeskException(Exception):
    """Base application exception."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class ResourceNotFoundException(LifeDeskException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource} with identifier '{identifier}' was not found.",
            status_code=404,
            details={"resource": resource, "identifier": identifier},
        )


class InvalidWorkflowStateException(LifeDeskException):
    def __init__(self, message: str, current_state: str, attempted_action: str):
        super().__init__(
            code="INVALID_WORKFLOW_STATE",
            message=message,
            status_code=409,
            details={"current_state": current_state, "attempted_action": attempted_action},
        )


class OversizedFileException(LifeDeskException):
    def __init__(self, max_bytes: int, received_bytes: int):
        super().__init__(
            code="FILE_TOO_LARGE",
            message=f"Uploaded file exceeds maximum allowed limit of {max_bytes} bytes.",
            status_code=413,
            details={"max_bytes": max_bytes, "received_bytes": received_bytes},
        )


class UnsupportedMediaException(LifeDeskException):
    def __init__(self, mime_type: str, reason: str = "Unsupported format or signature mismatch"):
        super().__init__(
            code="UNSUPPORTED_MEDIA_TYPE",
            message=f"File media type '{mime_type}' is unsupported. {reason}",
            status_code=415,
            details={"mime_type": mime_type, "reason": reason},
        )


class DocumentCorruptException(LifeDeskException):
    def __init__(self, reason: str):
        super().__init__(
            code="CORRUPT_DOCUMENT",
            message=f"Document file is corrupt or unreadable: {reason}",
            status_code=400,
            details={"reason": reason},
        )


class DocumentEncryptedException(LifeDeskException):
    def __init__(self):
        super().__init__(
            code="PASSWORD_PROTECTED_DOCUMENT",
            message="Document is password protected and cannot be processed.",
            status_code=400,
            details={"encrypted": True},
        )


class ValidationException(LifeDeskException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=422,
            details=details,
        )
