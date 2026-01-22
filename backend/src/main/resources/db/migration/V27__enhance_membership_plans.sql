-- V27: Enhance Membership Plans with Date/Age Restrictions and Multi-Fee Structure
-- Adds:
--   1. Date restrictions (available_from, available_until)
--   2. Age restrictions (minimum_age, maximum_age)
--   3. Multi-fee structure (membership_fee, admin_fee, join_fee with individual tax rates)

-- Add date restrictions
ALTER TABLE membership_plans ADD COLUMN available_from DATE;
ALTER TABLE membership_plans ADD COLUMN available_until DATE;

-- Add age restrictions
ALTER TABLE membership_plans ADD COLUMN minimum_age INT;
ALTER TABLE membership_plans ADD COLUMN maximum_age INT;

-- Add membership fee (will migrate existing price)
ALTER TABLE membership_plans ADD COLUMN membership_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE membership_plans ADD COLUMN membership_fee_currency VARCHAR(3) NOT NULL DEFAULT 'SAR';
ALTER TABLE membership_plans ADD COLUMN membership_fee_tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00;

-- Add administration fee
ALTER TABLE membership_plans ADD COLUMN admin_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE membership_plans ADD COLUMN admin_fee_currency VARCHAR(3) NOT NULL DEFAULT 'SAR';
ALTER TABLE membership_plans ADD COLUMN admin_fee_tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00;

-- Add join fee (one-time)
ALTER TABLE membership_plans ADD COLUMN join_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE membership_plans ADD COLUMN join_fee_currency VARCHAR(3) NOT NULL DEFAULT 'SAR';
ALTER TABLE membership_plans ADD COLUMN join_fee_tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00;

-- Migrate existing price to membership fee
UPDATE membership_plans
SET membership_fee_amount = price_amount,
    membership_fee_currency = price_currency
WHERE price_amount IS NOT NULL;

-- Drop old price columns (no longer needed)
ALTER TABLE membership_plans DROP COLUMN price_amount;
ALTER TABLE membership_plans DROP COLUMN price_currency;

-- Add constraint: available_from must be before available_until
ALTER TABLE membership_plans ADD CONSTRAINT chk_plan_dates
    CHECK (available_from IS NULL OR available_until IS NULL OR available_from <= available_until);

-- Add constraint: minimum_age must be less than or equal to maximum_age
ALTER TABLE membership_plans ADD CONSTRAINT chk_plan_ages
    CHECK (minimum_age IS NULL OR maximum_age IS NULL OR minimum_age <= maximum_age);

-- Add index for date-based queries
CREATE INDEX idx_membership_plans_availability ON membership_plans(available_from, available_until);
