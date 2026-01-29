-- ==========================================
-- V72: MEMBERSHIP CONTRACTS & CATEGORIES
-- ==========================================
-- Implements formal contracts with commitment terms, early termination fees,
-- Saudi cooling-off period compliance, and contract pricing tiers.

-- ==========================================
-- 1. MEMBERSHIP CATEGORIES
-- ==========================================
-- Defines membership category types: individual, family, corporate, student, senior, etc.

CREATE TABLE membership_categories (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description_en VARCHAR(500),
    description_ar VARCHAR(500),
    category_type VARCHAR(30) NOT NULL,
    minimum_age INT,
    maximum_age INT,
    requires_verification BOOLEAN DEFAULT FALSE,
    verification_document_type VARCHAR(50),
    max_family_members INT,
    default_discount_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_membership_categories_tenant ON membership_categories(tenant_id);
CREATE INDEX idx_membership_categories_type ON membership_categories(tenant_id, category_type);
CREATE INDEX idx_membership_categories_active ON membership_categories(tenant_id, is_active);

-- ==========================================
-- 2. MEMBERSHIP CONTRACTS
-- ==========================================
-- Formal contracts with commitment terms, pricing snapshots, and signatures.

CREATE TABLE membership_contracts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id),
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    subscription_id UUID REFERENCES subscriptions(id),
    category_id UUID REFERENCES membership_categories(id),

    -- Contract type and terms
    contract_type VARCHAR(20) NOT NULL,           -- MONTH_TO_MONTH, FIXED_TERM
    contract_term VARCHAR(20) NOT NULL,           -- MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
    commitment_months INT NOT NULL DEFAULT 0,
    notice_period_days INT NOT NULL DEFAULT 30,

    -- Contract dates
    start_date DATE NOT NULL,
    commitment_end_date DATE,
    effective_end_date DATE,

    -- Locked pricing (snapshot at signing)
    locked_membership_fee_amount DECIMAL(19,4) NOT NULL,
    locked_membership_fee_currency VARCHAR(3) DEFAULT 'SAR',
    locked_membership_fee_tax_rate DECIMAL(5,2) DEFAULT 15.00,
    locked_admin_fee_amount DECIMAL(19,4) DEFAULT 0,
    locked_admin_fee_currency VARCHAR(3) DEFAULT 'SAR',
    locked_admin_fee_tax_rate DECIMAL(5,2) DEFAULT 15.00,
    locked_join_fee_amount DECIMAL(19,4) DEFAULT 0,
    locked_join_fee_currency VARCHAR(3) DEFAULT 'SAR',
    locked_join_fee_tax_rate DECIMAL(5,2) DEFAULT 15.00,

    -- Early termination
    early_termination_fee_type VARCHAR(30) DEFAULT 'REMAINING_MONTHS',
    early_termination_fee_value DECIMAL(19,4),

    -- Cooling-off (Saudi regulation - 7 days)
    cooling_off_days INT DEFAULT 7,
    cooling_off_end_date DATE NOT NULL,

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_SIGNATURE',

    -- Signatures
    member_signed_at TIMESTAMPTZ,
    member_signature_data TEXT,
    staff_approved_by UUID REFERENCES users(id),
    staff_approved_at TIMESTAMPTZ,

    -- Cancellation details
    cancellation_requested_at DATE,
    cancellation_effective_date DATE,
    cancellation_type VARCHAR(30),
    cancellation_reason TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_contracts_tenant ON membership_contracts(tenant_id);
CREATE INDEX idx_contracts_member ON membership_contracts(member_id);
CREATE INDEX idx_contracts_plan ON membership_contracts(plan_id);
CREATE INDEX idx_contracts_subscription ON membership_contracts(subscription_id);
CREATE INDEX idx_contracts_status ON membership_contracts(tenant_id, status);
CREATE INDEX idx_contracts_start_date ON membership_contracts(start_date);
CREATE INDEX idx_contracts_commitment_end ON membership_contracts(commitment_end_date);
CREATE INDEX idx_contracts_cooling_off ON membership_contracts(cooling_off_end_date);
CREATE INDEX idx_contracts_number ON membership_contracts(contract_number);

-- ==========================================
-- 3. CONTRACT PRICING TIERS
-- ==========================================
-- Term-based pricing discounts (annual = 20% off, etc.)

CREATE TABLE contract_pricing_tiers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    contract_term VARCHAR(20) NOT NULL,           -- MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
    discount_percentage DECIMAL(5,2),
    override_monthly_fee_amount DECIMAL(19,4),
    override_monthly_fee_currency VARCHAR(3) DEFAULT 'SAR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE(tenant_id, plan_id, contract_term)
);

CREATE INDEX idx_pricing_tiers_tenant ON contract_pricing_tiers(tenant_id);
CREATE INDEX idx_pricing_tiers_plan ON contract_pricing_tiers(plan_id);
CREATE INDEX idx_pricing_tiers_active ON contract_pricing_tiers(tenant_id, is_active);

-- ==========================================
-- 4. CONTRACT NUMBER SEQUENCE
-- ==========================================
-- Sequence for generating unique contract numbers per tenant

CREATE TABLE contract_number_sequences (
    tenant_id UUID PRIMARY KEY REFERENCES clubs(id),
    year INT NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. SUBSCRIPTION ENHANCEMENTS
-- ==========================================
-- Add new status values and contract reference to subscriptions

-- Add contract reference
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES membership_contracts(id);

-- Add new status-related fields for the enhanced state machine
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS past_due_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pending_cancellation_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notice_period_end_date DATE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_contract ON subscriptions(contract_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_past_due ON subscriptions(past_due_at) WHERE past_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_notice_period ON subscriptions(notice_period_end_date) WHERE notice_period_end_date IS NOT NULL;
