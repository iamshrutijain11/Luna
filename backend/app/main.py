"""LifeDesk FastAPI Backend Application Entry Point.

Architected for Amazon Developer Hackathon 2026 - Alexa+ Track.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.error_handlers import register_error_handlers
from backend.app.api.routers import documents_router, health_router, workflows_router
from backend.app.config import settings
from backend.app.core.database import init_db

logger = logging.getLogger("lifedesk")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    Initializes persistent SQLite tables and storage folders.
    Preserves MCP lifespan requirements if Person 3 provides an MCP lifecycle handler.
    """
    logger.info("Initializing LifeDesk persistent database schemas...")
    init_db()

    # Ensure storage paths exist
    settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    settings.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # Demo Authentication Limitation Warning
    if settings.DEMO_MODE:
        logger.warning("=" * 70)
        logger.warning(settings.AUTH_WARNING_MESSAGE)
        logger.warning("=" * 70)

    # Check for Person 3 MCP lifespan if present
    agent_lifespan_cm = None
    try:
        from backend.app.agent import mcp_lifespan  # type: ignore
        if callable(mcp_lifespan):
            agent_lifespan_cm = mcp_lifespan(app)
            await agent_lifespan_cm.__aenter__()
            logger.info("Mounted Person 3 MCP lifespan successfully.")
    except (ImportError, AttributeError):
        logger.info("No custom agent/MCP lifespan detected. Operating in standalone mode.")

    yield

    if agent_lifespan_cm:
        try:
            await agent_lifespan_cm.__aexit__(None, None, None)
        except Exception as e:
            logger.error(f"Error shutting down Person 3 MCP lifespan: {e}")

    logger.info("LifeDesk shutdown complete.")


def create_application() -> FastAPI:
    app = FastAPI(
        title="LifeDesk API",
        description="AI-powered document-to-action assistant (Amazon Developer Hackathon 2026 - Alexa+ Track)",
        version=settings.VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Security: CORS Middleware configured via environment settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register custom contract error handlers
    register_error_handlers(app)

    # Mount Core Domain Routers
    app.include_router(health_router, prefix=settings.API_PREFIX)
    app.include_router(documents_router, prefix=settings.API_PREFIX)
    app.include_router(workflows_router, prefix=settings.API_PREFIX)

    # Wire Person 3's Agent Router & MCP layer conditionally
    try:
        from backend.app.agent.router import agent_router  # type: ignore
        app.include_router(agent_router)
        logger.info("Integrated Person 3 agent router at /api/assistant")
    except Exception as e:
        logger.info(f"Agent router not loaded: {e}")

    try:
        from backend.app.agent.mcp.server import get_mcp_asgi_app  # type: ignore
        app.mount("/mcp", get_mcp_asgi_app())
        logger.info("Mounted Person 3 MCP ASGI application at /mcp")
    except Exception as e:
        logger.info(f"MCP ASGI app not loaded: {e}")

    return app


app = create_application()
