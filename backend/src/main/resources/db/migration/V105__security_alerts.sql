-- Migration: Security Alerts and Anomaly Detection
-- Phase 4.1: Suspicious Activity Detection
-- Purpose: Track and alert on suspicious login patterns and security anomalies

CREATE TABLE security_alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    details TEXT,
    login_attempt_id UUID REFERENCES login_attempts(id) ON DELETE SET NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    device_info VARCHAR(500),
    location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for security alerts
CREATE INDEX idx_security_alerts_user ON security_alerts(user_id);
CREATE INDEX idx_security_alerts_unresolved ON security_alerts(user_id, resolved) WHERE resolved = FALSE;
CREATE INDEX idx_security_alerts_unread ON security_alerts(user_id, acknowledged_at) WHERE acknowledged_at IS NULL AND resolved = FALSE;
CREATE INDEX idx_security_alerts_type ON security_alerts(user_id, alert_type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_created ON security_alerts(created_at);

-- Add latitude and longitude to login_attempts if not exists (for impossible travel detection)
-- These columns should already exist from V101, but adding them here as fallback
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='login_attempts' AND column_name='latitude') THEN
        ALTER TABLE login_attempts ADD COLUMN latitude DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='login_attempts' AND column_name='longitude') THEN
        ALTER TABLE login_attempts ADD COLUMN longitude DOUBLE PRECISION;
    END IF;
END $$;

-- Comments
COMMENT ON TABLE security_alerts IS 'Security alerts for suspicious activity and anomaly detection';
COMMENT ON COLUMN security_alerts.user_id IS 'User who is affected by this alert';
COMMENT ON COLUMN security_alerts.alert_type IS 'Type of alert: IMPOSSIBLE_TRAVEL, NEW_DEVICE, BRUTE_FORCE, UNUSUAL_TIME, NEW_LOCATION, MULTIPLE_SESSIONS, PASSWORD_SPRAY';
COMMENT ON COLUMN security_alerts.severity IS 'Severity level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN security_alerts.details IS 'JSON or text details about the alert';
COMMENT ON COLUMN security_alerts.login_attempt_id IS 'Reference to the login attempt that triggered this alert';
COMMENT ON COLUMN security_alerts.resolved IS 'Whether this alert has been resolved or dismissed';
COMMENT ON COLUMN security_alerts.acknowledged_at IS 'When the user acknowledged this alert';
COMMENT ON COLUMN security_alerts.ip_address IS 'IP address associated with the alert';
COMMENT ON COLUMN security_alerts.device_info IS 'Device information or fingerprint';
COMMENT ON COLUMN security_alerts.location IS 'Geographic location (city, country)';
