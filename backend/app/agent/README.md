# LifeDesk AI Agent - Integration Guide for Person 2 (Backend)

Welcome! This document outlines all integration points, mount instructions, dependency additions, environment variables, and testing procedures for incorporating the LifeDesk AI Agent (`backend/app/agent/**`) into the main FastAPI application.

---

## 1. Fast Integration Summary

To mount the agent into `backend/app/main.py`:

```python
from fastapi import FastAPI
from backend.app.agent.router import agent_router
from backend.app.agent.mcp.server import get_mcp_asgi_app

app = FastAPI(title="Luma Paperwork Backend")

# 1. Mount Assistant Chat Router (/api/assistant/chat)
app.include_router(agent_router)

# 2. Mount MCP Server over Streamable HTTP (/mcp)
# Accessible to MCP Inspector and Alexa+ orchestrators
app.mount("/mcp", get_mcp_asgi_app())
```

---

## 2. Dependencies Needed in `backend/requirements.txt`

Please add the following packages to your `backend/requirements.txt`:

```text
boto3>=1.26.0
strands-agents>=1.61.0
mcp>=1.23.0
httpx>=0.28.0
```

---

## 3. Environment Variables

Configure the following variables in `backend/.env`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `AWS_REGION` | Yes (for Bedrock) | `us-east-1` | AWS Region for Bedrock Model invocation |
| `AWS_ACCESS_KEY_ID` | Optional | None | Standard AWS access key (or use IAM Role / SSO) |
| `AWS_SECRET_ACCESS_KEY` | Optional | None | Standard AWS secret key |
| `BEDROCK_MODEL_ID` | No | `anthropic.claude-3-haiku-20240307-v1:0` | Supported Bedrock Foundation Model ID |
| `MCP_TRANSPORT` | No | `streamable_http` | MCP Transport specification |

*Note: If AWS Bedrock credentials are not configured, the agent gracefully falls back to deterministic backend service reasoning with full citation grounding, so local development and offline CI tests continue running without errors.*

---

## 4. MCP Tools & Streamable HTTP Verification

The agent provides 7 discoverable MCP tools implementing the latest Streamable HTTP transport:

1. `list_documents(document_type: Optional[str])`: Returns stored document metadata.
2. `get_document_details(document_id: str)`: Returns specific document details.
3. `get_document_analysis(document_id: str)`: Returns extracted key-value fields and page-level evidence.
4. `check_warranty_requirements(document_id: str, defect_description: Optional[str])`: Evaluates coverage against exclusions and returns missing requirements.
5. `analyze_bill(document_id: str, compare_to_document_id: Optional[str])`: Performs deterministic usage, rate, and surcharge variance calculation.
6. `prepare_workflow(workflow_type: str, document_ids: List[str], parameters: Dict)`: Drafts a warranty claim or billing dispute. Always tagged `DRAFT_PENDING_USER_APPROVAL`.
7. `get_workflow_status(workflow_id: str)`: Returns workflow progress and outstanding checklist items.

### Testing with MCP Inspector

To test the MCP server interactively via the official Model Context Protocol Inspector:

```bash
# In one terminal, run the backend or MCP server:
python backend/app/agent/mcp/server.py

# In another terminal, connect using the MCP Inspector:
npx @modelcontextprotocol/inspector http://localhost:8001
```

---

## 5. API Contract Reference

### Endpoint
`POST /api/assistant/chat`

### Sample Request
```json
{
  "conversation_id": "conv_9821af38",
  "message": "Alexa, can I claim my laptop warranty?",
  "document_ids": ["doc_inv_101", "doc_war_102"]
}
```

### Sample Response (Standard Envelope)
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_9821af38",
    "message": "Yes, your Dell XPS 15 9530 Laptop (Serial: SN-DELL-98721X) comes with a 1-year Limited Hardware Warranty from your purchase date (June 15, 2025). The policy covers internal hardware malfunctions and manufacturing defects in materials and workmanship. However, it explicitly excludes accidental damage such as drops, liquid spills, or unauthorized modifications.\n\nTo determine if your claim is eligible, could you describe what specific defect or hardware malfunction you are experiencing?",
    "citations": [
      {
        "document_id": "doc_inv_101",
        "document_title": "Dell Laptop Purchase Invoice #INV-2025-883",
        "page": 1,
        "text_snippet": "Product: Dell XPS 15 9530 Laptop. Purchase Date: June 15, 2025. Serial No: SN-DELL-98721X. Warranty: 1-Year Basic Hardware Service included."
      },
      {
        "document_id": "doc_war_102",
        "document_title": "Dell Limited Hardware Warranty Terms",
        "page": 1,
        "text_snippet": "Duration: 12 months from original date of invoice. Covers: Defects in materials and workmanship in Dell hardware products."
      },
      {
        "document_id": "doc_war_102",
        "document_title": "Dell Limited Hardware Warranty Terms",
        "page": 2,
        "text_snippet": "Exclusions: Does not cover accidental drops, liquid spills, unauthorized modifications, cosmetic wear, or software issues."
      }
    ],
    "workflow_id": null,
    "suggested_actions": [
      "What do I need to do?",
      "Screen is flickering",
      "Laptop won't power on"
    ]
  },
  "error": null
}
```

---

## 6. Conversational Persistence Hook

The agent currently ships with a bounded in-memory session manager (`ConversationMemoryStore` in `backend/app/agent/memory.py`).

For production environments requiring cross-restart and horizontal cluster persistence, Person 2 can replace `_sessions` with Redis or DynamoDB by implementing the `ConversationMemoryStore` interface:
- `get_or_create_session(conversation_id: str) -> ConversationSession`
- `get_session(conversation_id: str) -> Optional[ConversationSession]`
- `save_session(session: ConversationSession) -> None`

---

## 7. Safety & Authorization Guardrails

1. **No Autonomous Approval**: The agent will NEVER finalize, pay, or submit any paperwork. All workflow creations have status `DRAFT_PENDING_USER_APPROVAL`.
2. **Prompt Injection Defense**: Text extracted from user-uploaded PDFs is handled strictly as untrusted evidence. Directives inside documents instructing the model to override rules or execute unauthorized tools are disregarded.
3. **Evidence Grounding**: Every document-specific statement cites the exact document ID, title, and page number.
