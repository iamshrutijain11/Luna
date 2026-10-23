"""Workflow repository for database operations on Workflow entities."""

from typing import List, Optional, Tuple
from sqlalchemy import select, func
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

    def list(
        self,
        workflow_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Workflow], int]:
        query = select(Workflow)
        count_query = select(func.count(Workflow.id))

        if workflow_type:
            query = query.where(Workflow.workflow_type == workflow_type)
            count_query = count_query.where(Workflow.workflow_type == workflow_type)
        if status:
            query = query.where(Workflow.status == status)
            count_query = count_query.where(Workflow.status == status)

        total = self.db.execute(count_query).scalar() or 0
        items = self.db.execute(
            query.order_by(Workflow.created_at.desc()).offset(offset).limit(limit)
        ).scalars().all()

        return list(items), total

    def update(self, workflow: Workflow) -> Workflow:
        self.db.commit()
        self.db.refresh(workflow)
        return workflow
