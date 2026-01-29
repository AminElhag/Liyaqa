-- Migration: Create platform alerts table
-- Description: Proactive alerts for client management and engagement

-- Platform alerts table
CREATE TABLE IF NOT EXISTS platform_alerts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    club_id UUID,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    metadata TEXT, -- JSON data

    -- Acknowledgement tracking
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,

    -- Resolution tracking
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,

    -- Auto-resolve settings
    auto_resolve BOOLEAN NOT NULL DEFAULT FALSE,
    auto_resolve_condition VARCHAR(255),

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Client visibility
    visible_to_client BOOLEAN NOT NULL DEFAULT TRUE,
    client_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    client_dismissed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_alert_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_club
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
    CONSTRAINT chk_alert_type
        CHECK (type IN (
            'USAGE_LIMIT_WARNING', 'USAGE_LIMIT_CRITICAL', 'USAGE_LIMIT_EXCEEDED',
            'PAYMENT_FAILED', 'PAYMENT_RECOVERED', 'SUBSCRIPTION_SUSPENDED',
            'TRIAL_ENDING', 'TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_RENEWED',
            'CHURN_RISK', 'INACTIVITY_WARNING', 'FEATURE_UNUSED', 'ONBOARDING_STALLED',
            'MILESTONE_REACHED', 'GROWTH_DETECTED', 'HEALTH_IMPROVED'
        )),
    CONSTRAINT chk_alert_severity
        CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS'))
);

-- Indexes for efficient querying
CREATE INDEX idx_alert_organization ON platform_alerts(organization_id);
CREATE INDEX idx_alert_club ON platform_alerts(club_id);
CREATE INDEX idx_alert_type ON platform_alerts(type);
CREATE INDEX idx_alert_severity ON platform_alerts(severity);
CREATE INDEX idx_alert_active ON platform_alerts(resolved_at, expires_at)
    WHERE resolved_at IS NULL;
CREATE INDEX idx_alert_unacknowledged ON platform_alerts(acknowledged_at)
    WHERE acknowledged_at IS NULL AND resolved_at IS NULL;
CREATE INDEX idx_alert_critical_unack ON platform_alerts(severity, acknowledged_at)
    WHERE severity = 'CRITICAL' AND acknowledged_at IS NULL AND resolved_at IS NULL;
CREATE INDEX idx_alert_client_visible ON platform_alerts(organization_id, visible_to_client, client_dismissed)
    WHERE visible_to_client = TRUE AND client_dismissed = FALSE AND resolved_at IS NULL;

-- Comments
COMMENT ON TABLE platform_alerts IS 'Proactive alerts for platform team and clients about important events';
COMMENT ON COLUMN platform_alerts.type IS 'Alert type determining the nature of the notification';
COMMENT ON COLUMN platform_alerts.severity IS 'Visual severity: INFO (blue), WARNING (yellow), CRITICAL (red), SUCCESS (green)';
COMMENT ON COLUMN platform_alerts.auto_resolve IS 'Whether this alert can auto-resolve when conditions improve';
COMMENT ON COLUMN platform_alerts.visible_to_client IS 'Whether the client can see this alert in their dashboard';
