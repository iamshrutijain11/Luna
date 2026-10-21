"""Approval repository for database operations on Approval entities."""

from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.approval import Approval


class ApprovalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, approval: Approval) -> Approval:
        self.db.add(approval)
        self.db.commit()
        self.db.refresh(approval)
        return approval

    def get_by_workflow_id(self, workflow_id: str) -> List[Approval]:
        stmt = (
            select(Approval)
            .where(Approval.workflow_id == workflow_id)
            .order_by(Approval.approved_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())
