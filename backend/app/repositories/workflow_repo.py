"""Workflow repository for database operations on Workflow entities."""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.workflow import Workflow


class WorkflowRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, workflow: Workflow) -> Workflow:
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def get_by_id(self, workflow_id: str) -> Optional[Workflow]:
        stmt = select(Workflow).where(Workflow.id == workflow_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def update(self, workflow: Workflow) -> Workflow:
        self.db.commit()
        self.db.refresh(workflow)
        return workflow
