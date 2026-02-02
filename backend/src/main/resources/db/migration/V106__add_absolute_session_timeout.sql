-- V106: Add absolute session timeout to refresh tokens
-- This enforces a maximum session duration (24 hours) regardless of token refreshes

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS absolute_expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- Update existing tokens to have absolute expiry set to 24 hours from creation
UPDATE refresh_tokens
SET absolute_expires_at = created_at + INTERVAL '24 hours'
WHERE absolute_expires_at IS NULL OR absolute_expires_at = created_at;

-- Add index for absolute expiry checks
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_absolute_expires ON refresh_tokens(absolute_expires_at);

COMMENT ON COLUMN refresh_tokens.absolute_expires_at IS 'Absolute session expiry time - enforces maximum session duration regardless of token refreshes (default: 24 hours)';
