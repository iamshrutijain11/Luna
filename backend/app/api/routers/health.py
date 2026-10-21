"""Health check router."""

from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Returns application health status, version, and timestamp."""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
    )
