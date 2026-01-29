-- Migration: Create onboarding progress tables
-- Description: Tracks client onboarding journey with gamified progress

-- Onboarding progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL UNIQUE,
    club_id UUID,
    total_points INTEGER NOT NULL DEFAULT 0,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    current_phase VARCHAR(50) NOT NULL DEFAULT 'GETTING_STARTED',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    days_active INTEGER NOT NULL DEFAULT 1,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    marketing_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    reports_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    api_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_onboarding_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_onboarding_club
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
    CONSTRAINT chk_progress_percent
        CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT chk_current_phase
        CHECK (current_phase IN ('GETTING_STARTED', 'CORE_SETUP', 'OPERATIONS', 'COMPLETE'))
);

-- Completed onboarding steps (many-to-many relationship)
CREATE TABLE IF NOT EXISTS onboarding_completed_steps (
    onboarding_progress_id UUID NOT NULL,
    step VARCHAR(50) NOT NULL,

    PRIMARY KEY (onboarding_progress_id, step),
    CONSTRAINT fk_completed_steps_progress
        FOREIGN KEY (onboarding_progress_id) REFERENCES onboarding_progress(id) ON DELETE CASCADE,
    CONSTRAINT chk_step_value
        CHECK (step IN (
            'ACCOUNT_CREATED', 'EMAIL_VERIFIED', 'PROFILE_COMPLETED',
            'FIRST_LOCATION_ADDED', 'MEMBERSHIP_PLANS_CREATED',
            'FIRST_MEMBER_ADDED', 'MEMBERS_IMPORTED',
            'PAYMENT_GATEWAY_CONNECTED', 'FIRST_PAYMENT_RECEIVED',
            'ACCESS_CONTROL_CONFIGURED', 'FIRST_CLASS_SCHEDULED', 'STAFF_INVITED',
            'MOBILE_APP_CONFIGURED'
        ))
);

-- Indexes for efficient querying
CREATE INDEX idx_onboarding_organization ON onboarding_progress(organization_id);
CREATE INDEX idx_onboarding_phase ON onboarding_progress(current_phase);
CREATE INDEX idx_onboarding_incomplete ON onboarding_progress(completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_onboarding_last_activity ON onboarding_progress(last_activity_at);

-- Comments
COMMENT ON TABLE onboarding_progress IS 'Tracks client onboarding journey with gamified progress and feature unlocking';
COMMENT ON COLUMN onboarding_progress.total_points IS 'Cumulative points earned from completing onboarding steps';
COMMENT ON COLUMN onboarding_progress.progress_percent IS 'Overall completion percentage (0-100)';
COMMENT ON COLUMN onboarding_progress.current_phase IS 'Current onboarding phase based on progress';
COMMENT ON COLUMN onboarding_progress.marketing_unlocked IS 'Whether marketing suite has been unlocked (60+ points)';
COMMENT ON COLUMN onboarding_progress.reports_unlocked IS 'Whether advanced reports have been unlocked (90+ points)';
COMMENT ON COLUMN onboarding_progress.api_unlocked IS 'Whether API access has been unlocked (100% complete)';
