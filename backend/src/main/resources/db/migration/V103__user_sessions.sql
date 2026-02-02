-- User Sessions Table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL UNIQUE,
    access_token_hash VARCHAR(64),
    device_name VARCHAR(100),
    os VARCHAR(50),
    browser VARCHAR(50),
    ip_address VARCHAR(45) NOT NULL,
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

COMMENT ON TABLE user_sessions IS 'Tracks active user sessions across devices for security monitoring and remote logout';
COMMENT ON COLUMN user_sessions.session_id IS 'Unique session identifier (different from ID for security)';
COMMENT ON COLUMN user_sessions.access_token_hash IS 'Hash of last 20 chars of access token for identification';
COMMENT ON COLUMN user_sessions.device_name IS 'User-friendly device name (e.g., Chrome on MacBook Pro)';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP address of the client';
COMMENT ON COLUMN user_sessions.last_active_at IS 'Last time this session made an API request';
COMMENT ON COLUMN user_sessions.expires_at IS 'When this session expires (refresh token expiry)';
COMMENT ON COLUMN user_sessions.is_active IS 'Whether session is currently active (not revoked)';
COMMENT ON COLUMN user_sessions.revoked_at IS 'When session was manually revoked (remote logout)';
