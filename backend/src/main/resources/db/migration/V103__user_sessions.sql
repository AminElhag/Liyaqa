-- Migration: User Sessions Management
-- Phase 2.3: Session Management Dashboard
-- Purpose: Track user sessions across devices for security monitoring and remote logout

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL UNIQUE,
    access_token_hash VARCHAR(64),
    device_name VARCHAR(100),
    os VARCHAR(50),
    browser VARCHAR(50),
    ip_address VARCHAR(45),
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Index for finding sessions by user
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);

-- Index for finding active sessions efficiently
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;

-- Index for cleanup of expired sessions
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

-- Index for session lookup by session_id
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

-- Comment the table
COMMENT ON TABLE user_sessions IS 'Tracks user login sessions across devices for security monitoring and session management';

-- Comment the columns
COMMENT ON COLUMN user_sessions.session_id IS 'Unique session identifier (different from primary key id)';
COMMENT ON COLUMN user_sessions.access_token_hash IS 'Last 8 characters of SHA-256 hash of access token for identification';
COMMENT ON COLUMN user_sessions.device_name IS 'Device type (iPhone, Mac, Windows PC, etc.)';
COMMENT ON COLUMN user_sessions.os IS 'Operating system (iOS, Android, Windows, macOS, Linux)';
COMMENT ON COLUMN user_sessions.browser IS 'Browser name (Chrome, Safari, Firefox, Edge)';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP address of the session (supports IPv4 and IPv6)';
COMMENT ON COLUMN user_sessions.country IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN user_sessions.city IS 'City name extracted from GeoIP or audit log';
COMMENT ON COLUMN user_sessions.last_active_at IS 'Timestamp of last activity (updated on token refresh)';
COMMENT ON COLUMN user_sessions.expires_at IS 'Session expiration timestamp (matches access token expiry)';
COMMENT ON COLUMN user_sessions.is_active IS 'Whether the session is currently active (false if revoked or expired)';
COMMENT ON COLUMN user_sessions.revoked_at IS 'Timestamp when session was manually revoked (remote logout)';
