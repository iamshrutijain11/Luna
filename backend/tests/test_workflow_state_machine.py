"""Tests for workflow state machine enforcement, legal transitions, and approval guards."""

import pytest
from backend.app.core.exceptions import InvalidWorkflowStateException
from backend.app.domain.workflows.state_machine import (
    WorkflowStateMachine,
    STATE_DRAFT,
    STATE_NEEDS_INFO,
    STATE_READY_FOR_REVIEW,
    STATE_APPROVED,
    STATE_COMPLETED,
    STATE_FAILED,
)


def test_legal_state_transitions():
    # Valid forward progressions
    WorkflowStateMachine.validate_transition(STATE_DRAFT, STATE_READY_FOR_REVIEW, "initial_assessment")
    WorkflowStateMachine.validate_transition(STATE_DRAFT, STATE_NEEDS_INFO, "initial_assessment")
    WorkflowStateMachine.validate_transition(STATE_NEEDS_INFO, STATE_READY_FOR_REVIEW, "provide_missing_data")
    WorkflowStateMachine.validate_transition(STATE_READY_FOR_REVIEW, STATE_APPROVED, "user_approval")
    WorkflowStateMachine.validate_transition(STATE_APPROVED, STATE_COMPLETED, "generate_artifact")


def test_illegal_state_transitions():
    # Cannot jump straight from draft to completed
    with pytest.raises(InvalidWorkflowStateException) as exc:
        WorkflowStateMachine.validate_transition(STATE_DRAFT, STATE_COMPLETED, "bypass_review")
    assert exc.value.status_code == 409

    # Cannot transition from terminal completed state
    with pytest.raises(InvalidWorkflowStateException) as exc:
        WorkflowStateMachine.validate_transition(STATE_COMPLETED, STATE_READY_FOR_REVIEW, "reopen")
    assert exc.value.status_code == 409


def test_approval_verification_guards():
    # Approving ready_for_review is permissible
    WorkflowStateMachine.verify_approvable(STATE_READY_FOR_REVIEW, "approve_action")

    # Cannot approve draft
    with pytest.raises(InvalidWorkflowStateException) as exc:
        WorkflowStateMachine.verify_approvable(STATE_DRAFT, "approve_action")
    assert exc.value.status_code == 409

    # Cannot approve when information is missing
    with pytest.raises(InvalidWorkflowStateException) as exc:
        WorkflowStateMachine.verify_approvable(STATE_NEEDS_INFO, "approve_action")
    assert exc.value.status_code == 409

    # Cannot approve already approved or completed workflow (duplicate approval guard)
    with pytest.raises(InvalidWorkflowStateException) as exc:
        WorkflowStateMachine.verify_approvable(STATE_COMPLETED, "approve_action")
    assert exc.value.status_code == 409

    with pytest.raises(InvalidWorkflowStateException) as exc:
        WorkflowStateMachine.verify_approvable(STATE_APPROVED, "approve_action")
    assert exc.value.status_code == 409
