"""
main.py - LUNA Paperwork Assistant FastAPI Application Entrypoint.

Mounts the AI Agent chat router, MCP Streamable HTTP server,
and OpenAPI document vault + workflow management APIs for the frontend.

Run:
    uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ────────────────────────────────────────────────────────────────────────────
# AI Agent (Person 3) — imports from luna_agent package (ai-agent/)
# ────────────────────────────────────────────────────────────────────────────
from luna_agent.router import agent_router
from luna_agent.mcp.server import get_mcp_asgi_app

# ────────────────────────────────────────────────────────────────────────────
# Core Database & Error Handling
# ────────────────────────────────────────────────────────────────────────────
from backend.app.core.database import init_db
from backend.app.api.error_handlers import register_error_handlers

# ────────────────────────────────────────────────────────────────────────────
# OpenAPI Routers (Person 1 & 2)
# ────────────────────────────────────────────────────────────────────────────
from backend.app.api.routers.health import router as health_router
from backend.app.api.routers.documents import router as documents_router
from backend.app.api.routers.workflows import router as workflows_router
from backend.app.schemas.common import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


# ────────────────────────────────────────────────────────────────────────────
# FastAPI Application
# ────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LUNA — AI-Powered Paperwork Assistant",
    description=(
        "Amazon Developer Hackathon 2026 — Alexa+ Track. "
        "LUNA helps users understand warranties, compare utility bills, "
        "and prepare document workflows through natural conversation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ────────────────────────────────────────────────────────────────────────────
# CORS Configuration
# ────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────────────────
# Global Error Handlers (Contract-compliant { "error": { "code", "message" } })
# ────────────────────────────────────────────────────────────────────────────
register_error_handlers(app)

# ────────────────────────────────────────────────────────────────────────────
# AI Agent Chat Router → POST /api/assistant/chat
# ────────────────────────────────────────────────────────────────────────────
app.include_router(agent_router)

# ────────────────────────────────────────────────────────────────────────────
# MCP Streamable HTTP Server → /mcp
# ────────────────────────────────────────────────────────────────────────────
app.mount("/mcp", get_mcp_asgi_app())

# ────────────────────────────────────────────────────────────────────────────
# Health Endpoints → /api/health and /health
# ────────────────────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api")

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def root_health() -> HealthResponse:
    """Quick liveness probe — returns OK if the server is running."""
    return HealthResponse(status="healthy", version="1.0.0")

# ────────────────────────────────────────────────────────────────────────────
# Document Vault & Workflow Management Endpoints → /api/documents, /api/workflows
# ────────────────────────────────────────────────────────────────────────────
app.include_router(documents_router, prefix="/api")
app.include_router(workflows_router, prefix="/api")

# ────────────────────────────────────────────────────────────────────────────
# Production Frontend SPA Static Asset Serving
# ────────────────────────────────────────────────────────────────────────────
from pathlib import Path
from fastapi.staticfiles import StaticFiles

dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_path.exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="frontend")

