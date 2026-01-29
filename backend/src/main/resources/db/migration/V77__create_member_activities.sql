-- Migration V77: Create member activities table for activity timeline
-- Part of Club Member Management System Redesign - Phase 2

CREATE TABLE member_activities (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB,
    performed_by_user_id UUID,
    performed_by_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_activity_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_activity_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_activity_performed_by FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for querying member's activity timeline (most recent first)
CREATE INDEX idx_activities_member ON member_activities(member_id, created_at DESC);

-- Index for filtering by activity type
CREATE INDEX idx_activities_type ON member_activities(tenant_id, activity_type, created_at DESC);

-- Index for querying by performer (staff audit)
CREATE INDEX idx_activities_performer ON member_activities(performed_by_user_id, created_at DESC) WHERE performed_by_user_id IS NOT NULL;

-- Index for GIN on metadata for JSON queries
CREATE INDEX idx_activities_metadata ON member_activities USING GIN (metadata);

COMMENT ON TABLE member_activities IS 'Audit trail of all member-related activities and changes';
COMMENT ON COLUMN member_activities.activity_type IS 'Type of activity: STATUS_CHANGED, SUBSCRIPTION_CREATED, PAYMENT_RECEIVED, CHECK_IN, NOTE_ADDED, etc.';
COMMENT ON COLUMN member_activities.metadata IS 'Additional context stored as JSON (e.g., old/new values for changes)';
COMMENT ON COLUMN member_activities.performed_by_user_id IS 'Staff user who performed the action (null for system or member self-service)';
COMMENT ON COLUMN member_activities.performed_by_name IS 'Denormalized name for display when user is deleted';
