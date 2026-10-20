"""
main.py - Luma Paperwork Assistant FastAPI Application Entrypoint.

Mounts the AI Agent chat router and MCP Streamable HTTP server.
Person 2 can extend this file with additional backend routers, middleware,
database startup hooks, and CORS configuration.

Run:
    $env:PYTHONPATH=".;ai-agent"
    uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ────────────────────────────────────────────────────────────────────────────
# AI Agent (Person 3) — imports from luma_agent package (ai-agent/)
# PYTHONPATH must include the ai-agent/ directory for these imports.
# ────────────────────────────────────────────────────────────────────────────
from luma_agent.router import agent_router
from luma_agent.mcp.server import get_mcp_asgi_app

# ────────────────────────────────────────────────────────────────────────────
# FastAPI Application
# ────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Luma — AI-Powered Paperwork Assistant",
    description=(
        "Amazon Developer Hackathon 2026 — Alexa+ Track. "
        "Luma helps users understand warranties, compare utility bills, "
        "and prepare document workflows through natural conversation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ────────────────────────────────────────────────────────────────────────────
# CORS — allow all origins for hackathon/development.
# Person 2: tighten allow_origins for production.
# ────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────────────────
# AI Agent Chat Router → POST /api/assistant/chat
# ────────────────────────────────────────────────────────────────────────────
app.include_router(agent_router)

# ────────────────────────────────────────────────────────────────────────────
# MCP Streamable HTTP Server → /mcp
# Alexa+ orchestrators and MCP Inspector connect here.
# ────────────────────────────────────────────────────────────────────────────
app.mount("/mcp", get_mcp_asgi_app())

# ────────────────────────────────────────────────────────────────────────────
# Health Check
# ────────────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """Quick liveness probe — returns OK if the server is running."""
    return {"status": "ok", "service": "luma-paperwork-assistant", "version": "1.0.0"}


# ────────────────────────────────────────────────────────────────────────────
# Person 2: Add your routers below this line.
# Example:
#   from backend.app.routers import documents, workflows
#   app.include_router(documents.router, prefix="/api")
#   app.include_router(workflows.router, prefix="/api")
# ────────────────────────────────────────────────────────────────────────────
