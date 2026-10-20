# Luma AI Agent (Person 3) — Multi-Provider Paperwork Assistant

The Luma AI Agent transforms personal paperwork (warranties, purchase receipts, utility bills, claims) into actionable workflows through natural conversation.

This package has been upgraded with a **modular LLM provider subsystem** supporting **Google Gemini API (Primary free-tier)**, **Groq Cloud API**, **Ollama (local)**, and **Amazon Bedrock (optional)**, while maintaining 100% functionality without requiring AWS promotional credits or credentials.

---

## 1. Provider System Architecture

```
ai-agent/luma_agent/
├── providers/
│   ├── __init__.py           # Subsystem exports
│   ├── base.py               # BaseLLMProvider, ProviderResponse, and error hierarchy
│   ├── factory.py            # get_llm_provider() factory controlled by LLM_PROVIDER
│   ├── gemini.py             # Google Gemini API (Primary / Free Tier)
│   ├── groq.py               # Groq Cloud API (Optional fast free tier)
│   ├── ollama.py             # Local Ollama inference (Optional zero-cost local)
│   └── bedrock.py            # Amazon Bedrock (Optional legacy cloud provider)
├── mcp/
│   ├── server.py             # Streamable HTTP FastMCP ASGI server
│   ├── client.py             # MCP client (in-process & Streamable HTTP)
│   └── tools.py              # 7 typed MCP tools & validation logic
├── orchestrator.py           # Core conversational reasoning & tool loop
├── router.py                 # POST /api/assistant/chat router
├── memory.py                 # Conversation session & turn tracking
├── prompts.py                # LifeDesk instructions & prompt injection defenses
└── tests/
    ├── test_providers.py     # Provider selection, auth, backoff, and mock tests
    └── test_agent.py         # MCP discovery, Streamable HTTP, Scenarios 1-3
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env` or set environment variables:

```bash
# Provider Selection (Default: gemini)
LLM_PROVIDER=gemini

# Primary Provider (Free Tier Compatible)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Optional Providers
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Optional Amazon Bedrock
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

*Note: If no API key is provided for a cloud provider, the system gracefully operates using its deterministic document verification engine without crashing or fabricating responses.*

---

## 3. Running Tests

Run all unit, integration, and provider tests:

```powershell
$env:PYTHONPATH=".;ai-agent"
pytest ai-agent/luma_agent/tests/ -v
```

---

## 4. MCP Tools & Streamable HTTP Verification

The MCP server exposes 7 discoverable tools over the modern Streamable HTTP transport:
- `list_documents`: Returns document vault metadata.
- `get_document_details`: Retrieves specific document metadata.
- `get_document_analysis`: Retrieves extracted fields & page-level citations.
- `check_warranty_requirements`: Validates warranty conditions against exclusions.
- `analyze_bill`: Computes deterministic consumption & rate variance.
- `prepare_workflow`: Prepares workflow draft with status `DRAFT_PENDING_USER_APPROVAL`.
- `get_workflow_status`: Returns draft status and missing checklist items.
