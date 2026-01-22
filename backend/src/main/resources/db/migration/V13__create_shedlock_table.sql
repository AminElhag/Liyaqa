-- V13: Create ShedLock table for distributed job locking
--
-- ShedLock uses this table to coordinate scheduled job execution
-- across multiple application instances, preventing duplicate runs.

CREATE TABLE IF NOT EXISTS shedlock (
    name VARCHAR(64) NOT NULL,
    lock_until TIMESTAMP NOT NULL,
    locked_at TIMESTAMP NOT NULL,
    locked_by VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);

-- Index for faster lock acquisition queries
CREATE INDEX IF NOT EXISTS idx_shedlock_lock_until ON shedlock(lock_until);

-- Comment for documentation
COMMENT ON TABLE shedlock IS 'ShedLock table for distributed scheduled job locking';
COMMENT ON COLUMN shedlock.name IS 'Unique name of the scheduled job';
COMMENT ON COLUMN shedlock.lock_until IS 'Timestamp when the lock expires';
COMMENT ON COLUMN shedlock.locked_at IS 'Timestamp when the lock was acquired';
COMMENT ON COLUMN shedlock.locked_by IS 'Identifier of the instance that acquired the lock';
