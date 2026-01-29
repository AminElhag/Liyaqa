-- Migration V81: Create member onboarding table for journey tracking
-- Part of Club Member Management System Redesign - Phase 6

CREATE TABLE member_onboardings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL UNIQUE,
    steps JSONB NOT NULL DEFAULT '{}',
    current_step VARCHAR(50),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    assigned_to_user_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_onboarding_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_onboarding_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_onboarding_assigned FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for finding incomplete onboardings
CREATE INDEX idx_onboarding_incomplete ON member_onboardings(tenant_id, completed_at) WHERE completed_at IS NULL;

-- Index for finding onboardings assigned to a user
CREATE INDEX idx_onboarding_assigned ON member_onboardings(assigned_to_user_id, completed_at) WHERE assigned_to_user_id IS NOT NULL;

-- Index for recent onboardings
CREATE INDEX idx_onboarding_started ON member_onboardings(tenant_id, started_at DESC);

COMMENT ON TABLE member_onboardings IS 'Tracks new member onboarding journey progress';
COMMENT ON COLUMN member_onboardings.steps IS 'JSON object mapping step names to their completion status and timestamps';
COMMENT ON COLUMN member_onboardings.current_step IS 'The current step the member is on in the onboarding journey';
COMMENT ON COLUMN member_onboardings.assigned_to_user_id IS 'Staff member responsible for this member''s onboarding';
