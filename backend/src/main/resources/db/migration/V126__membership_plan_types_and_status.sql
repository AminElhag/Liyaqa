-- ==========================================
-- V126: MEMBERSHIP PLAN TYPES & STATUS MODEL
-- ==========================================
-- Adds plan types (RECURRING, CLASS_PACK, DAY_PASS, TRIAL) and
-- replaces binary is_active with tri-state status (DRAFT, ACTIVE, ARCHIVED).

-- 1. Add plan_type column
ALTER TABLE membership_plans ADD COLUMN plan_type VARCHAR(20) NOT NULL DEFAULT 'RECURRING';

-- 2. Add status column (replaces is_active)
ALTER TABLE membership_plans ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 3. Add class-pack fields
ALTER TABLE membership_plans ADD COLUMN session_count INTEGER;
ALTER TABLE membership_plans ADD COLUMN expiry_days INTEGER;

-- 4. Add trial conversion reference
ALTER TABLE membership_plans ADD COLUMN converts_to_plan_id UUID;
ALTER TABLE membership_plans ADD CONSTRAINT fk_plan_converts_to
    FOREIGN KEY (converts_to_plan_id) REFERENCES membership_plans(id);

-- 5. Migrate is_active to status
UPDATE membership_plans SET status = 'ACTIVE' WHERE is_active = true;
UPDATE membership_plans SET status = 'ARCHIVED' WHERE is_active = false;

-- 6. Add indexes
CREATE INDEX idx_membership_plans_plan_type ON membership_plans(tenant_id, plan_type);
CREATE INDEX idx_membership_plans_status ON membership_plans(tenant_id, status);
