# Luma — AI-Powered Personal Paperwork Assistant
**Amazon Developer Hackathon 2026 — Alexa+ Track**

Luma is an advanced agentic paperwork assistant that transforms complex personal documents (warranties, purchase receipts, utility bills, claims) into actionable workflows through natural conversation.

---

## Architecture Overview

```
LUMA/
│
├── frontend/                      # PERSON 1: Alexa+ Web & Chat UI
├── backend/                       # PERSON 2: FastAPI, Extraction, Billing, Workflows
│   └── app/
│       ├── main.py                # FastAPI entrypoint (mounts agent + MCP)
│       ├── agent/                 # PERSON 3: LifeDesk Agent, MCP Server, Orchestrator
│       │   ├── mcp/               # FastMCP Server (Streamable HTTP) & Client
│       │   ├── orchestrator.py    # Multi-provider Orchestration Engine
│       │   ├── router.py          # POST /api/assistant/chat Router
│       │   ├── memory.py          # Session & Conversational Turn State
│       │   ├── prompts.py         # Guardrails, Security & System Prompts
│       │   ├── README.md          # Person 2 Integration Guide
│       │   └── tests/             # Comprehensive Test Suite (14 Tests)
│       ├── services/              # Structured Document & Domain Logic
│       └── models/                # Document & Workflow Data Schemas
│
├── ai-agent/                      # PERSON 3 (Primary AI agent package)
│   └── luma_agent/
│       ├── providers/             # Pluggable LLM backends (Gemini, Groq, Ollama, Bedrock)
│       ├── mcp/                   # FastMCP Streamable HTTP server & client
│       ├── orchestrator.py        # Core agentic reasoning loop
│       ├── router.py              # FastAPI chat router
│       ├── memory.py              # In-memory conversation session store
│       ├── prompts.py             # System prompt & security guardrails
│       └── tests/                 # 26 tests (unit + live provider integration)
│
├── contracts/                     # Frozen OpenAPI Contracts & Schemas
└── README.md
```

---

## LLM Provider System

The agent supports 4 configurable providers (set `LLM_PROVIDER` in `.env`):

| Provider | Variable | Notes |
|---|---|---|
| **Google Gemini** (default) | `LLM_PROVIDER=gemini` | Free tier, model: `gemini-2.5-flash` |
| Groq Cloud | `LLM_PROVIDER=groq` | Free tier, fast inference |
| Ollama (local) | `LLM_PROVIDER=ollama` | Fully offline, no API key needed |
| Amazon Bedrock | `LLM_PROVIDER=bedrock` | Optional, requires AWS credentials |

If no API key is provided, the agent automatically falls back to its deterministic document reasoning engine — no crashes, no hallucinations.

---

## Key Features

1. **Evidence-Based Reasoning & Grounded Citations**: Every claim cites verified document title, page number, and text snippet. No hallucinated amounts or dates.
2. **Model Context Protocol (MCP) Streamable HTTP**: Modern Streamable HTTP transport (protocol `2025-11-25`) exposing 7 typed tools — compatible with MCP Inspector and Alexa+ orchestrators.
3. **Conversational Workflows & Safe Actions**:
   - Warranty Coverage: Identifies exclusions, checks active policy windows, prepares claim drafts (`DRAFT_PENDING_USER_APPROVAL`).
   - Electricity Bill Comparison: Deterministic variance breakdown between consecutive billing cycles.
   - Follow-up Memory: Maintains session state across turns using `conversation_id`.
4. **Prompt Injection & Security Guardrails**: Retrieved PDF text is handled strictly as passive evidence; embedded prompt injections cannot trigger unauthorized operations.
5. **No Autonomous Actions**: All workflows are saved as `DRAFT_PENDING_USER_APPROVAL` — the agent never submits or approves anything without explicit user authorization.

---

## Running the Full Test Suite

```powershell
# Run all 26 tests (unit + live Gemini + live Groq)
$env:PYTHONPATH=".;ai-agent"
pytest ai-agent/luma_agent/tests/ -v
```

Expected output: `26 passed` ✅

---

## Starting the Backend Server

```powershell
$env:PYTHONPATH=".;ai-agent"
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

API available at: `http://127.0.0.1:8000`
MCP server at: `http://127.0.0.1:8000/mcp`
API docs at: `http://127.0.0.1:8000/docs`

---

## Chat API

**Endpoint**: `POST /api/assistant/chat`

```json
{
  "conversation_id": "conv_001",
  "message": "Can I claim my laptop warranty?",
  "document_ids": []
}
```

Response: `ChatResponseEnvelope` — see `contracts/openapi.yaml` for full schema.
