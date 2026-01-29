-- ==========================================
-- V75: Add Contract Configuration to Membership Plans
-- ==========================================
-- Adds contract configuration fields to membership_plans to enable
-- contract type selection, terms, commitment periods, and termination policies.

-- Add membership category reference
ALTER TABLE membership_plans ADD COLUMN category_id UUID REFERENCES membership_categories(id);

-- Add contract type and terms
ALTER TABLE membership_plans ADD COLUMN contract_type VARCHAR(20) DEFAULT 'MONTH_TO_MONTH';
ALTER TABLE membership_plans ADD COLUMN supported_terms VARCHAR(255) DEFAULT 'MONTHLY';  -- Comma-separated values
ALTER TABLE membership_plans ADD COLUMN default_commitment_months INT DEFAULT 1;
ALTER TABLE membership_plans ADD COLUMN minimum_commitment_months INT;

-- Add notice period
ALTER TABLE membership_plans ADD COLUMN default_notice_period_days INT DEFAULT 30;

-- Add early termination fee configuration
ALTER TABLE membership_plans ADD COLUMN early_termination_fee_type VARCHAR(30) DEFAULT 'NONE';
ALTER TABLE membership_plans ADD COLUMN early_termination_fee_value DECIMAL(19,4);

-- Add cooling-off period
ALTER TABLE membership_plans ADD COLUMN cooling_off_days INT DEFAULT 14;

-- Add constraints
ALTER TABLE membership_plans ADD CONSTRAINT chk_commitment_months
    CHECK (default_commitment_months >= 1 AND default_commitment_months <= 60);

ALTER TABLE membership_plans ADD CONSTRAINT chk_minimum_commitment
    CHECK (minimum_commitment_months IS NULL OR (minimum_commitment_months >= 0 AND minimum_commitment_months <= 60));

ALTER TABLE membership_plans ADD CONSTRAINT chk_notice_period
    CHECK (default_notice_period_days >= 0 AND default_notice_period_days <= 90);

ALTER TABLE membership_plans ADD CONSTRAINT chk_cooling_off
    CHECK (cooling_off_days >= 0 AND cooling_off_days <= 30);

-- Add indexes for common queries
CREATE INDEX idx_membership_plans_category ON membership_plans(category_id);
CREATE INDEX idx_membership_plans_contract_type ON membership_plans(tenant_id, contract_type);

-- Add comment for documentation
COMMENT ON COLUMN membership_plans.supported_terms IS 'Comma-separated list of supported contract terms: MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL';
COMMENT ON COLUMN membership_plans.early_termination_fee_type IS 'Type of termination fee: NONE, FLAT_FEE, REMAINING_MONTHS, PERCENTAGE';
