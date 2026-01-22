-- V12: Fix notification body columns and add soft delete support
--
-- 1. Ensure notification body columns are TEXT (idempotent check)
-- 2. Add soft delete columns to key entities

-- ===========================================
-- PART 1: Ensure notification body is TEXT
-- ===========================================
-- The original V9 migration defined body_ar as TEXT, but we add an explicit
-- ALTER to ensure consistency in case of any schema drift

-- Only alter if column exists and is not already TEXT
DO $$
BEGIN
    -- Check body_ar column type
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'body_ar'
        AND data_type != 'text'
    ) THEN
        ALTER TABLE notifications ALTER COLUMN body_ar TYPE TEXT;
    END IF;

    -- Ensure body_en is also TEXT
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'body_en'
        AND data_type != 'text'
    ) THEN
        ALTER TABLE notifications ALTER COLUMN body_en TYPE TEXT;
    END IF;
END $$;

-- ===========================================
-- PART 2: Add soft delete columns to entities
-- ===========================================

-- Members table - soft delete support
ALTER TABLE members
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries on members
CREATE INDEX IF NOT EXISTS idx_members_deleted ON members(deleted) WHERE deleted = FALSE;

-- Subscriptions table - soft delete support
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries on subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted ON subscriptions(deleted) WHERE deleted = FALSE;

-- Invoices table - soft delete support
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries on invoices
CREATE INDEX IF NOT EXISTS idx_invoices_deleted ON invoices(deleted) WHERE deleted = FALSE;

-- Membership plans table - soft delete support
ALTER TABLE membership_plans
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries on membership_plans
CREATE INDEX IF NOT EXISTS idx_membership_plans_deleted ON membership_plans(deleted) WHERE deleted = FALSE;

-- Attendance records table - soft delete support
ALTER TABLE attendance_records
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries on attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_records_deleted ON attendance_records(deleted) WHERE deleted = FALSE;

-- Gym classes table - soft delete support
ALTER TABLE gym_classes
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries on gym_classes
CREATE INDEX IF NOT EXISTS idx_gym_classes_deleted ON gym_classes(deleted) WHERE deleted = FALSE;

-- Bookings table - soft delete support
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for soft delete queries on bookings
CREATE INDEX IF NOT EXISTS idx_bookings_deleted ON bookings(deleted) WHERE deleted = FALSE;

-- ===========================================
-- PART 3: Add foreign key for deleted_by
-- ===========================================
-- Note: We don't add FK constraints for deleted_by to users table
-- because the deleting user might be from a different tenant or system

-- Comments for documentation
COMMENT ON COLUMN members.deleted IS 'Soft delete flag';
COMMENT ON COLUMN members.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN members.deleted_by IS 'UUID of user who soft deleted the record';

COMMENT ON COLUMN subscriptions.deleted IS 'Soft delete flag';
COMMENT ON COLUMN subscriptions.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN subscriptions.deleted_by IS 'UUID of user who soft deleted the record';

COMMENT ON COLUMN invoices.deleted IS 'Soft delete flag';
COMMENT ON COLUMN invoices.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN invoices.deleted_by IS 'UUID of user who soft deleted the record';

COMMENT ON COLUMN membership_plans.deleted IS 'Soft delete flag';
COMMENT ON COLUMN membership_plans.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN membership_plans.deleted_by IS 'UUID of user who soft deleted the record';

COMMENT ON COLUMN attendance_records.deleted IS 'Soft delete flag';
COMMENT ON COLUMN attendance_records.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN attendance_records.deleted_by IS 'UUID of user who soft deleted the record';

COMMENT ON COLUMN gym_classes.deleted IS 'Soft delete flag';
COMMENT ON COLUMN gym_classes.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN gym_classes.deleted_by IS 'UUID of user who soft deleted the record';

COMMENT ON COLUMN bookings.deleted IS 'Soft delete flag';
COMMENT ON COLUMN bookings.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN bookings.deleted_by IS 'UUID of user who soft deleted the record';
