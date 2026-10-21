"""Routers package."""

from backend.app.api.routers.health import router as health_router
from backend.app.api.routers.documents import router as documents_router
from backend.app.api.routers.workflows import router as workflows_router

__all__ = ["health_router", "documents_router", "workflows_router"]
