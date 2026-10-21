"""Centralized application settings and configuration."""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LifeDesk"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Base workspace path
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # Storage paths (outside public directories)
    STORAGE_BASE_DIR: Path = BASE_DIR / "storage"
    DOCUMENTS_DIR: Path = STORAGE_BASE_DIR / "documents"
    ARTIFACTS_DIR: Path = STORAGE_BASE_DIR / "artifacts"

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'lifedesk.db'}"

    # File Upload Security Constraints
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS: set[str] = {".pdf", ".jpg", ".jpeg", ".png"}
    ALLOWED_MIME_TYPES: set[str] = {"application/pdf", "image/jpeg", "image/png"}

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    # Security & Auth Notice:
    # LifeDesk currently operates in Hackathon Demonstration Mode.
    # DEMO LIMITATION NOTICE: Production deployment requires an active OIDC/OAuth2
    # or AWS Cognito authentication layer to prevent unauthorized access to sensitive documents.
    DEMO_MODE: bool = True
    AUTH_WARNING_MESSAGE: str = (
        "DEMO MODE: Authentication is bypassed for local hackathon evaluation. "
        "Do not deploy to public production without strict IAM/OAuth2 access controls."
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()

# Ensure critical storage directories exist
settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
settings.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
