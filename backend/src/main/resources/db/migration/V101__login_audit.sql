-- =====================================================
-- Migration: V101 - Login Activity Audit Trail
-- Description: Adds comprehensive login attempt tracking with device fingerprinting and geolocation
-- Author: Liyaqa Security Team
-- Date: 2026-02-01
-- =====================================================

-- Create login_attempts table for audit trail
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    device_fingerprint VARCHAR(64),
    device_name VARCHAR(100),
    os VARCHAR(50),
    browser VARCHAR(50),
    country VARCHAR(2),
    city VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    attempt_type VARCHAR(20) NOT NULL,
    failure_reason VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID,
    flagged_as_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,

    -- Foreign key to users table (nullable for failed attempts where user doesn't exist)
    CONSTRAINT fk_login_attempts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes for efficient audit queries
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_timestamp ON login_attempts(timestamp DESC);
CREATE INDEX idx_login_attempts_user_timestamp ON login_attempts(user_id, timestamp DESC);
CREATE INDEX idx_login_attempts_ip_timestamp ON login_attempts(ip_address, timestamp DESC);
CREATE INDEX idx_login_attempts_suspicious ON login_attempts(user_id, flagged_as_suspicious, timestamp DESC) WHERE flagged_as_suspicious = TRUE;
CREATE INDEX idx_login_attempts_type ON login_attempts(attempt_type, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE login_attempts IS 'Comprehensive audit trail for all login attempts';
COMMENT ON COLUMN login_attempts.user_id IS 'Reference to the user (null if user does not exist)';
COMMENT ON COLUMN login_attempts.email IS 'Email address used for login attempt';
COMMENT ON COLUMN login_attempts.ip_address IS 'IP address from which the login attempt originated';
COMMENT ON COLUMN login_attempts.device_fingerprint IS 'SHA-256 hash of User-Agent and Accept headers for device identification';
COMMENT ON COLUMN login_attempts.attempt_type IS 'Type of attempt: SUCCESS, FAILED, LOCKED, MFA_REQUIRED, MFA_SUCCESS, MFA_FAILED';
COMMENT ON COLUMN login_attempts.flagged_as_suspicious IS 'True if this login was flagged by anomaly detection';
COMMENT ON COLUMN login_attempts.acknowledged_at IS 'Timestamp when user acknowledged a suspicious login';
