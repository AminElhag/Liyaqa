-- ===========================================
-- V15: Rate Limit Persistence Table
-- ===========================================
-- Stores rate limit counters in database for persistence across restarts
-- Supports multi-instance deployments with consistent rate limiting

CREATE TABLE rate_limits (
    id UUID PRIMARY KEY,
    client_key VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Composite unique constraint for client + tier combination
    CONSTRAINT uk_rate_limits_client_tier UNIQUE (client_key, tier)
);

-- Index for efficient lookups and cleanup
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX idx_rate_limits_client_key ON rate_limits(client_key);

-- Comment for documentation
COMMENT ON TABLE rate_limits IS 'Persistent rate limit counters for API throttling';
COMMENT ON COLUMN rate_limits.client_key IS 'User ID or IP address identifying the client';
COMMENT ON COLUMN rate_limits.tier IS 'Rate limit tier (AUTH_LOGIN, WRITE, READ, etc.)';
COMMENT ON COLUMN rate_limits.request_count IS 'Number of requests in current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start time of the current rate limit window';
