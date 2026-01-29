-- Migration: Create client usage tracking table
-- Description: Tracks resource usage against plan limits for enforcement

-- Client usage table
CREATE TABLE IF NOT EXISTS client_usage (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL UNIQUE,
    period_year_month VARCHAR(7) NOT NULL, -- YYYY-MM format

    -- Current usage counts
    current_clubs INTEGER NOT NULL DEFAULT 0,
    current_locations INTEGER NOT NULL DEFAULT 0,
    current_members INTEGER NOT NULL DEFAULT 0,
    current_staff INTEGER NOT NULL DEFAULT 0,
    api_calls_this_month BIGINT NOT NULL DEFAULT 0,
    storage_used_gb DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Plan limits (cached from ClientPlan)
    max_clubs INTEGER NOT NULL DEFAULT 1,
    max_locations_per_club INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL DEFAULT 100,
    max_staff_users INTEGER NOT NULL DEFAULT 5,
    max_api_calls BIGINT, -- NULL = unlimited
    max_storage_gb DOUBLE PRECISION, -- NULL = unlimited

    -- Status tracking
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_exceeded BOOLEAN NOT NULL DEFAULT FALSE,
    grace_period_ends TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_usage_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_current_clubs_positive
        CHECK (current_clubs >= 0),
    CONSTRAINT chk_current_locations_positive
        CHECK (current_locations >= 0),
    CONSTRAINT chk_current_members_positive
        CHECK (current_members >= 0),
    CONSTRAINT chk_current_staff_positive
        CHECK (current_staff >= 0),
    CONSTRAINT chk_api_calls_positive
        CHECK (api_calls_this_month >= 0),
    CONSTRAINT chk_storage_positive
        CHECK (storage_used_gb >= 0)
);

-- Indexes for efficient querying
CREATE INDEX idx_usage_organization ON client_usage(organization_id);
CREATE INDEX idx_usage_exceeded ON client_usage(is_exceeded) WHERE is_exceeded = TRUE;
CREATE INDEX idx_usage_grace_period ON client_usage(grace_period_ends) WHERE grace_period_ends IS NOT NULL;
CREATE INDEX idx_usage_period ON client_usage(period_year_month);

-- Comments
COMMENT ON TABLE client_usage IS 'Tracks real-time resource usage against plan limits for each organization';
COMMENT ON COLUMN client_usage.period_year_month IS 'Billing period in YYYY-MM format for API call tracking';
COMMENT ON COLUMN client_usage.is_exceeded IS 'Whether any limit is currently exceeded';
COMMENT ON COLUMN client_usage.grace_period_ends IS 'End of grace period if limits exceeded (7 days to upgrade)';
