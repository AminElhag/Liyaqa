-- V107: Add IP binding configuration to users
-- Allows users to opt-in to IP-based session binding for enhanced security

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS ip_binding_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for efficient lookups when validating IP binding
CREATE INDEX IF NOT EXISTS idx_users_ip_binding ON users(id, ip_binding_enabled) WHERE ip_binding_enabled = TRUE;

COMMENT ON COLUMN users.ip_binding_enabled IS 'When enabled, validates that token refresh requests come from the same IP as the original login';
