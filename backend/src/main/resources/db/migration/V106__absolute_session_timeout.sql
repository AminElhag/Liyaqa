-- V106: Add absolute session timeout to refresh tokens
-- This enforces a maximum session duration regardless of token refreshes.
-- Default: 24 hours from initial login (configurable)

-- Add absolute_expires_at column
-- Set default to created_at + 24 hours for existing tokens
ALTER TABLE refresh_tokens
ADD COLUMN absolute_expires_at TIMESTAMP WITH TIME ZONE NOT NULL
DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- Remove default after adding column (so future inserts must explicitly set it)
ALTER TABLE refresh_tokens
ALTER COLUMN absolute_expires_at DROP DEFAULT;

-- Create index for efficient cleanup of expired sessions
CREATE INDEX idx_refresh_tokens_absolute_expires
ON refresh_tokens(absolute_expires_at)
WHERE revoked_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN refresh_tokens.absolute_expires_at IS
'Absolute session expiration time - enforces maximum session duration regardless of token refreshes. Typically set to 24 hours from initial login.';
