"""Workflow state machine enforcing strict legal transitions and conflict guards."""

from typing import Set
from backend.app.core.exceptions import InvalidWorkflowStateException

# Allowed lifecycle states
STATE_DRAFT = "draft"
STATE_NEEDS_INFO = "needs_information"
STATE_READY_FOR_REVIEW = "ready_for_review"
STATE_APPROVED = "approved"
STATE_COMPLETED = "completed"
STATE_FAILED = "failed"

VALID_STATES: Set[str] = {
    STATE_DRAFT,
    STATE_NEEDS_INFO,
    STATE_READY_FOR_REVIEW,
    STATE_APPROVED,
    STATE_COMPLETED,
    STATE_FAILED,
}

# Legal transition graph
LEGAL_TRANSITIONS = {
    STATE_DRAFT: {STATE_NEEDS_INFO, STATE_READY_FOR_REVIEW, STATE_FAILED},
    STATE_NEEDS_INFO: {STATE_READY_FOR_REVIEW, STATE_FAILED},
    STATE_READY_FOR_REVIEW: {STATE_APPROVED, STATE_NEEDS_INFO, STATE_FAILED},
    STATE_APPROVED: {STATE_COMPLETED, STATE_FAILED},
    STATE_COMPLETED: set(),  # Terminal state
    STATE_FAILED: set(),     # Terminal state
}


class WorkflowStateMachine:
    @staticmethod
    def validate_transition(current_state: str, new_state: str, action_name: str) -> None:
        """
        Validates whether transitioning from current_state to new_state is permissible.
        Raises InvalidWorkflowStateException (HTTP 409) if the transition is illegal.
        """
        if current_state not in VALID_STATES:
            raise InvalidWorkflowStateException(
                f"Unknown current workflow state: '{current_state}'.",
                current_state=current_state,
                attempted_action=action_name,
            )

        if new_state not in VALID_STATES:
            raise InvalidWorkflowStateException(
                f"Unknown target workflow state: '{new_state}'.",
                current_state=current_state,
                attempted_action=action_name,
            )

        allowed = LEGAL_TRANSITIONS.get(current_state, set())
        if new_state not in allowed:
            raise InvalidWorkflowStateException(
                f"Cannot transition workflow from '{current_state}' to '{new_state}' for action '{action_name}'. "
                f"Legal target states are: {sorted(list(allowed)) or 'none (terminal state)'}.",
                current_state=current_state,
                attempted_action=action_name,
            )

    @staticmethod
    def verify_approvable(current_state: str, action_name: str) -> None:
        """
        Verifies that a workflow is in 'ready_for_review' state prior to approval.
        Enforces idempotency and prevents duplicate approvals or premature approvals.
        """
        if current_state in {STATE_APPROVED, STATE_COMPLETED}:
            raise InvalidWorkflowStateException(
                f"Workflow has already been approved (current state: '{current_state}'). Duplicate approvals are prohibited.",
                current_state=current_state,
                attempted_action=action_name,
            )

        if current_state == STATE_DRAFT:
            raise InvalidWorkflowStateException(
                "Workflow is still in draft state and has not been analyzed or reviewed. Cannot approve draft.",
                current_state=current_state,
                attempted_action=action_name,
            )

        if current_state == STATE_NEEDS_INFO:
            raise InvalidWorkflowStateException(
                "Workflow requires missing information before it can be approved. Please supply required details.",
                current_state=current_state,
                attempted_action=action_name,
            )

        if current_state != STATE_READY_FOR_REVIEW:
            raise InvalidWorkflowStateException(
                f"Workflow state '{current_state}' is not eligible for approval. Must be in '{STATE_READY_FOR_REVIEW}'.",
                current_state=current_state,
                attempted_action=action_name,
            )
