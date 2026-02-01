-- =====================================================
-- Migration: V100 - Password Policy
-- Description: Adds password history tracking for password reuse prevention
-- Author: Liyaqa Security Team
-- Date: 2026-02-01
-- =====================================================

-- Create password_history table for tracking previously used passwords
CREATE TABLE password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to users table
    CONSTRAINT fk_password_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Index for efficient password history queries
CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_user_created ON password_history(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE password_history IS 'Tracks password history for users to prevent password reuse';
COMMENT ON COLUMN password_history.user_id IS 'Reference to the user who owns this password history entry';
COMMENT ON COLUMN password_history.password_hash IS 'BCrypt hash of the previously used password';
COMMENT ON COLUMN password_history.created_at IS 'When this password was set';
