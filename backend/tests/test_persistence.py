"""Tests for persistent SQLite storage across engine/session restarts."""

import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.models.approval import Approval
from backend.app.models.document import Document
from backend.app.models.workflow import Workflow


def test_persistence_across_restarts(tmp_path):
    db_file = tmp_path / "persistent_test.db"
    db_url = f"sqlite:///{db_file}"

    # First session lifecycle: Create tables and insert records
    engine1 = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine1)
    SessionMaker1 = sessionmaker(bind=engine1)
    session1 = SessionMaker1()

    wf_id = str(uuid.uuid4())
    doc_id = str(uuid.uuid4())
    doc = Document(
        id=doc_id,
        original_filename="persistent_receipt.pdf",
        document_type="invoice",
        mime_type="application/pdf",
        storage_path=str(tmp_path / "fake_file.pdf"),
        size_bytes=2048,
        status="processed",
    )
    session1.add(doc)

    wf = Workflow(
        id=wf_id,
        workflow_type="warranty_claim",
        status="completed",
        linked_document_ids=[doc_id],
        collected_information={"product": "Persistent Widget"},
        missing_requirements=[],
        generated_artifact_path=str(tmp_path / "artifact.pdf"),
    )
    session1.add(wf)

    appr = Approval(
        workflow_id=wf_id,
        approved_action="generate_claim_packet",
        resulting_status="completed",
    )
    session1.add(appr)

    session1.commit()
    doc_id = doc.id
    wf_id = wf.id
    appr_id = appr.id

    # Simulate application shutdown: close session and dispose engine
    session1.close()
    engine1.dispose()

    # Second session lifecycle: Restart application with fresh engine and session
    engine2 = create_engine(db_url, connect_args={"check_same_thread": False})
    SessionMaker2 = sessionmaker(bind=engine2)
    session2 = SessionMaker2()

    # Query persistent data
    reloaded_doc = session2.get(Document, doc_id)
    reloaded_wf = session2.get(Workflow, wf_id)
    reloaded_appr = session2.get(Approval, appr_id)

    assert reloaded_doc is not None
    assert reloaded_doc.original_filename == "persistent_receipt.pdf"
    assert reloaded_doc.status == "processed"

    assert reloaded_wf is not None
    assert reloaded_wf.status == "completed"
    assert reloaded_wf.collected_information["product"] == "Persistent Widget"

    assert reloaded_appr is not None
    assert reloaded_appr.approved_action == "generate_claim_packet"
    assert reloaded_appr.workflow_id == wf_id

    session2.close()
    engine2.dispose()
