-- =====================================================
-- Migration: Create Shedlock Table
-- Version: V94
-- Description: Creates the shedlock table for distributed task locking
--              Required for @Scheduled tasks in multi-instance deployments
-- =====================================================

-- Shedlock table for distributed task coordination
-- Ensures scheduled tasks execute only once across multiple instances
CREATE TABLE shedlock (
    name VARCHAR(64) NOT NULL,
    lock_until TIMESTAMP NOT NULL,
    locked_at TIMESTAMP NOT NULL,
    locked_by VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);

-- Index for efficient lock expiry checks
CREATE INDEX idx_shedlock_lock_until ON shedlock(lock_until);

-- Add comment for documentation
COMMENT ON TABLE shedlock IS 'Distributed lock coordination for scheduled tasks across multiple application instances';
COMMENT ON COLUMN shedlock.name IS 'Unique name of the scheduled task';
COMMENT ON COLUMN shedlock.lock_until IS 'Timestamp when the lock expires';
COMMENT ON COLUMN shedlock.locked_at IS 'Timestamp when the lock was acquired';
COMMENT ON COLUMN shedlock.locked_by IS 'Instance identifier that acquired the lock';
