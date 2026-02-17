-- ============================================================================
-- V127: GX (Group Exercise) Enhancements
-- Adds access policies, room layouts, spot booking, GX settings, and
-- enhanced membership plan class access.
-- ============================================================================

-- 1. Add access_policy and related fields to gym_classes
ALTER TABLE gym_classes
    ADD COLUMN access_policy VARCHAR(30) NOT NULL DEFAULT 'MEMBERS_ONLY',
    ADD COLUMN online_bookable_spots INT,
    ADD COLUMN no_show_fee_amount DECIMAL(10,2),
    ADD COLUMN no_show_fee_currency VARCHAR(3),
    ADD COLUMN spot_booking_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN room_layout_id UUID;

-- Index for access policy filtering
CREATE INDEX idx_gym_classes_access_policy ON gym_classes(tenant_id, access_policy, status);

-- 2. Join table for class → eligible membership plans (Specific Memberships policy)
CREATE TABLE gym_class_eligible_plans (
    gym_class_id UUID NOT NULL REFERENCES gym_classes(id) ON DELETE CASCADE,
    membership_plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
    PRIMARY KEY (gym_class_id, membership_plan_id)
);

CREATE INDEX idx_gym_class_eligible_plans_plan ON gym_class_eligible_plans(membership_plan_id);

-- 3. Room layouts table for spot booking
CREATE TABLE room_layouts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    rows INT NOT NULL DEFAULT 4,
    columns INT NOT NULL DEFAULT 5,
    layout_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_room_layouts_tenant ON room_layouts(tenant_id);
CREATE INDEX idx_room_layouts_active ON room_layouts(tenant_id, is_active);

-- FK from gym_classes to room_layouts
ALTER TABLE gym_classes
    ADD CONSTRAINT fk_gym_classes_room_layout
    FOREIGN KEY (room_layout_id) REFERENCES room_layouts(id) ON DELETE SET NULL;

-- 4. Add spot_id and spot_label to class_bookings
ALTER TABLE class_bookings
    ADD COLUMN spot_id VARCHAR(20),
    ADD COLUMN spot_label VARCHAR(50);

-- Index for spot uniqueness per session (one person per spot)
CREATE UNIQUE INDEX idx_class_bookings_session_spot
    ON class_bookings(session_id, spot_id)
    WHERE spot_id IS NOT NULL AND status IN ('CONFIRMED', 'CHECKED_IN');

-- 5. GX settings (per-tenant configuration)
CREATE TABLE gx_settings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE REFERENCES clubs(id),
    default_booking_window_days INT NOT NULL DEFAULT 7,
    default_cancellation_deadline_hours INT NOT NULL DEFAULT 4,
    default_late_cancellation_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    default_late_cancellation_fee_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    default_no_show_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    default_no_show_fee_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    walkin_reserve_spots INT NOT NULL DEFAULT 0,
    auto_mark_no_shows BOOLEAN NOT NULL DEFAULT true,
    pre_class_reminder_minutes INT NOT NULL DEFAULT 60,
    waitlist_auto_promote BOOLEAN NOT NULL DEFAULT true,
    waitlist_notification_channel VARCHAR(30) NOT NULL DEFAULT 'SMS_PUSH',
    prayer_time_blocking_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_gx_settings_tenant ON gx_settings(tenant_id);

-- 6. Enhanced membership plan class access
ALTER TABLE membership_plans
    ADD COLUMN class_access_level VARCHAR(20) NOT NULL DEFAULT 'UNLIMITED',
    ADD COLUMN eligible_class_categories VARCHAR(500);

-- Join table for plan → eligible class groups
CREATE TABLE membership_plan_eligible_classes (
    membership_plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
    gym_class_id UUID NOT NULL REFERENCES gym_classes(id) ON DELETE CASCADE,
    PRIMARY KEY (membership_plan_id, gym_class_id)
);

CREATE INDEX idx_membership_plan_eligible_classes_class ON membership_plan_eligible_classes(gym_class_id);

-- 7. Migrate existing data: set access_policy based on current fields
-- Classes that require subscription → MEMBERS_ONLY
-- Classes that allow non-subscribers → OPEN_TO_ANYONE
UPDATE gym_classes SET access_policy = 'OPEN_TO_ANYONE' WHERE allow_non_subscribers = true;

-- Set class_access_level for existing plans
-- Plans with maxClassesPerPeriod = null → UNLIMITED
-- Plans with maxClassesPerPeriod > 0 → LIMITED
-- Plans with maxClassesPerPeriod = 0 → NO_ACCESS
UPDATE membership_plans SET class_access_level = 'UNLIMITED' WHERE max_classes_per_period IS NULL;
UPDATE membership_plans SET class_access_level = 'LIMITED' WHERE max_classes_per_period IS NOT NULL AND max_classes_per_period > 0;
UPDATE membership_plans SET class_access_level = 'NO_ACCESS' WHERE max_classes_per_period IS NOT NULL AND max_classes_per_period = 0;
