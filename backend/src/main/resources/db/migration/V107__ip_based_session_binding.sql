-- V107: Add IP-based session binding support
-- This adds IP binding preferences and originating IP tracking for enhanced security.
-- Users can optionally enable IP binding to prevent token theft across networks.

-- Add IP binding preference to users table
ALTER TABLE users
ADD COLUMN ip_binding_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Add originating IP address to user_sessions table
-- This tracks the IP address from which the session was initially created
ALTER TABLE user_sessions
ADD COLUMN originating_ip_address VARCHAR(45);

-- Update existing sessions to set originating IP from current IP
UPDATE user_sessions
SET originating_ip_address = ip_address
WHERE originating_ip_address IS NULL;

-- Create index for efficient IP validation queries
CREATE INDEX idx_user_sessions_originating_ip
ON user_sessions(user_id, originating_ip_address)
WHERE is_active = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.ip_binding_enabled IS
'When enabled, validates that token refresh requests come from the same IP address as the original login. Provides enhanced security against token theft across networks.';

COMMENT ON COLUMN user_sessions.originating_ip_address IS
'The IP address from which the session was initially created. Used for IP binding validation when user has ip_binding_enabled = true.';
