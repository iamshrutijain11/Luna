# LifeDesk Backend

LifeDesk is an AI-powered document-to-action assistant built for the **Amazon Developer Hackathon 2026 — Alexa+ Track**.

Users upload documents such as warranties, purchase invoices, and utility bills. LifeDesk extracts important details, identifies requirements, detects missing information, and prepares reviewable actions.

---

## Architecture Overview

LifeDesk follows a clean layered architecture:

```
FastAPI API Routers (backend/app/api/routers)
    ↓
Application Services (backend/app/services)
    ↓
Document & Workflow Domain Logic (backend/app/domain)
    ↓
Persistence Repositories (backend/app/repositories)
    ↓
Database (SQLite / SQLAlchemy) & File Storage (storage/)
```

### Key Modules:
- `backend/app/main.py`: Entry point, lifespan management, CORS configuration, and Person 3 router/MCP integration wiring.
- `backend/app/config.py`: Centralized configuration settings and storage path enforcement.
- `backend/app/core/`: Database engine/session management (`database.py`), domain exceptions (`exceptions.py`), and security sanitization & signature inspection (`security.py`).
- `backend/app/models/`: SQLAlchemy persistent models for `Document`, `ExtractedField`, `Workflow`, and `Approval`.
- `backend/app/schemas/`: Pydantic V2 request and response contracts strictly mirroring `contracts/openapi.yaml`.
- `backend/app/domain/extraction/`: PyMuPDF digital PDF extractor, Pillow image inspector, scanned detection without fabrication, and deterministic pattern parsers.
- `backend/app/domain/workflows/`: Strict lifecycle state machine, date-based warranty eligibility evaluator, utility bill comparative analyzer, and ReportLab PDF artifact generator.
- `backend/app/services/`: Application services for document ingestion, workflow lifecycle, and Person 3 agent integration interfaces (`agent_interface.py`).

---

## API Endpoints Summary

- `GET /api/health` — Service health check and version.
- `POST /api/documents` — Secure file upload (PDF/JPEG/PNG), magic byte verification, automated extraction.
- `GET /api/documents` — Paginated list of documents with optional status/type filtering.
- `GET /api/documents/{id}` — Document metadata.
- `GET /api/documents/{id}/download` — Stream raw stored document file.
- `GET /api/documents/{id}/analysis` — Provenance-backed extracted facts, page numbers, and excerpts.
- `POST /api/workflows` — Initialize action workflow (`warranty_claim` or `utility_bill_assistant`).
- `GET /api/workflows/{id}` — Workflow status, collected facts, eligibility, and missing requirements.
- `POST /api/workflows/{id}/approve` — Explicit user approval, state transition to `completed`, and PDF artifact generation.
- `GET /api/workflows/{id}/artifact` — Download generated PDF service packet or inquiry letter.

---

## Agent Integration Guide (Person 3)

Person 3 owns `backend/app/agent/**`. The backend provides clean, typed interfaces and Pydantic return models in `backend.app.services.agent_interface`:

```python
from backend.app.services.agent_interface import (
    list_documents,
    get_document_details,
    get_document_analysis,
    check_warranty_requirements,
    analyze_bill,
    prepare_workflow,
    get_workflow_status,
)
```

### Auto-Mounting:
In `backend/app/main.py`, the backend automatically discovers and mounts:
1. `backend.app.agent.router.router` at `/api/agent`.
2. `backend.app.agent.mcp.mcp_app` ASGI application at `/mcp`.
3. `backend.app.agent.mcp_lifespan` inside the FastAPI lifespan context manager.

---

## How to Run & Test

### 1. Install Dependencies
```powershell
pip install -r backend/requirements.txt
```

### 2. Run Test Suite
```powershell
python -m pytest -v backend/tests
```

### 3. Run System Verification / Smoke Test
```powershell
python scripts/verify_system.py
```

### 4. Start Local Development Server
```powershell
uvicorn backend.app.main:app --reload --port 8000
```
API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`
