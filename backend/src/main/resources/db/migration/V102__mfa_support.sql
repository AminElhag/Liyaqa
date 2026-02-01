-- Migration V102: Add MFA (Multi-Factor Authentication) support
-- Adds TOTP-based MFA fields to users table and backup codes table

-- Add MFA fields to users table
ALTER TABLE users
    ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN mfa_secret VARCHAR(255),
    ADD COLUMN mfa_verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN backup_codes_hash TEXT;

-- Create comment
COMMENT ON COLUMN users.mfa_enabled IS 'Indicates if multi-factor authentication is enabled for this user';
COMMENT ON COLUMN users.mfa_secret IS 'Encrypted TOTP secret for MFA (Base32 encoded)';
COMMENT ON COLUMN users.mfa_verified_at IS 'Timestamp when MFA was verified and enabled';
COMMENT ON COLUMN users.backup_codes_hash IS 'Hashed backup codes for MFA recovery (deprecated - using separate table)';

-- Create MFA backup codes table
CREATE TABLE mfa_backup_codes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mfa_backup_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX idx_mfa_backup_codes_user_id ON mfa_backup_codes(user_id);
CREATE INDEX idx_mfa_backup_codes_user_unused ON mfa_backup_codes(user_id, used) WHERE used = FALSE;

-- Add comment
COMMENT ON TABLE mfa_backup_codes IS 'Stores backup codes for MFA recovery (one-time use codes)';
COMMENT ON COLUMN mfa_backup_codes.code_hash IS 'BCrypt hash of the backup code';
COMMENT ON COLUMN mfa_backup_codes.used IS 'Indicates if this backup code has been used';
COMMENT ON COLUMN mfa_backup_codes.used_at IS 'Timestamp when this backup code was used';
