-- Migration V79: Create member tasks table for staff follow-up
-- Part of Club Member Management System Redesign - Phase 4

CREATE TABLE member_tasks (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_to_user_id UUID,
    completed_at TIMESTAMPTZ,
    completed_by_user_id UUID,
    outcome VARCHAR(50),
    outcome_notes TEXT,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assigned_to FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_task_completed_by FOREIGN KEY (completed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for finding tasks assigned to a user (staff task list)
CREATE INDEX idx_tasks_assigned ON member_tasks(assigned_to_user_id, status, due_date) WHERE assigned_to_user_id IS NOT NULL;

-- Index for finding pending tasks for a member
CREATE INDEX idx_tasks_member ON member_tasks(member_id, status);

-- Index for finding overdue tasks
CREATE INDEX idx_tasks_overdue ON member_tasks(tenant_id, status, due_date) WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Index for finding tasks by type (for dashboards)
CREATE INDEX idx_tasks_type ON member_tasks(tenant_id, task_type, status, due_date);

-- Index for finding auto-generated tasks
CREATE INDEX idx_tasks_auto ON member_tasks(tenant_id, auto_generated, created_at DESC) WHERE auto_generated = TRUE;

COMMENT ON TABLE member_tasks IS 'Staff tasks and follow-ups related to members';
COMMENT ON COLUMN member_tasks.task_type IS 'Type: ONBOARDING_CALL, RENEWAL_FOLLOWUP, PAYMENT_COLLECTION, RETENTION_OUTREACH, WIN_BACK, GENERAL_FOLLOWUP';
COMMENT ON COLUMN member_tasks.priority IS 'Priority: LOW, MEDIUM, HIGH, URGENT';
COMMENT ON COLUMN member_tasks.status IS 'Status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, SNOOZED';
COMMENT ON COLUMN member_tasks.outcome IS 'Completion outcome: SUCCESSFUL, UNSUCCESSFUL, NO_ANSWER, RESCHEDULED, CANCELLED';
COMMENT ON COLUMN member_tasks.auto_generated IS 'TRUE if task was automatically created by the system';
COMMENT ON COLUMN member_tasks.source IS 'Source of auto-generation: ONBOARDING, EXPIRY_REMINDER, CHURN_RISK, PAYMENT_FAILURE';
