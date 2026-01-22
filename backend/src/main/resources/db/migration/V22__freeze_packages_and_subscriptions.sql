-- ==========================================
-- V22: FREEZE PACKAGES & SUBSCRIPTION ENHANCEMENTS
-- ==========================================

-- ==========================================
-- 1. FREEZE PACKAGES
-- ==========================================

CREATE TABLE freeze_packages (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description_en VARCHAR(500),
    description_ar VARCHAR(500),
    freeze_days INTEGER NOT NULL,
    price_amount DECIMAL(19,4) NOT NULL,
    price_currency VARCHAR(3) DEFAULT 'SAR',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    extends_contract BOOLEAN DEFAULT TRUE,
    requires_documentation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_freeze_package_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_freeze_packages_tenant ON freeze_packages(tenant_id);
CREATE INDEX idx_freeze_packages_active ON freeze_packages(is_active);

-- ==========================================
-- 2. MEMBER FREEZE BALANCES
-- ==========================================

CREATE TABLE member_freeze_balances (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    total_freeze_days INTEGER DEFAULT 0,
    used_freeze_days INTEGER DEFAULT 0,
    source VARCHAR(20) DEFAULT 'PURCHASED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_freeze_balance_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_freeze_balances_member ON member_freeze_balances(member_id);
CREATE INDEX idx_freeze_balances_subscription ON member_freeze_balances(subscription_id);
CREATE UNIQUE INDEX idx_freeze_balances_unique ON member_freeze_balances(subscription_id);

-- ==========================================
-- 3. SUBSCRIPTION FREEZE HISTORY (Audit Trail)
-- ==========================================

CREATE TABLE subscription_freeze_history (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    freeze_start_date DATE NOT NULL,
    freeze_end_date DATE,
    freeze_days INTEGER NOT NULL,
    freeze_type VARCHAR(20) NOT NULL,
    reason VARCHAR(500),
    document_path VARCHAR(500),
    freeze_package_id UUID REFERENCES freeze_packages(id),
    created_by_user_id UUID,
    contract_extended BOOLEAN DEFAULT TRUE,
    original_end_date DATE,
    new_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_freeze_history_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_freeze_history_subscription ON subscription_freeze_history(subscription_id);
CREATE INDEX idx_freeze_history_tenant ON subscription_freeze_history(tenant_id);
CREATE INDEX idx_freeze_history_dates ON subscription_freeze_history(freeze_start_date, freeze_end_date);

-- ==========================================
-- 4. SUBSCRIPTION ENHANCEMENTS
-- ==========================================

-- Discount fields
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_reason VARCHAR(500);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_applied_by_user_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS original_price DECIMAL(19,4);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS final_price DECIMAL(19,4);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS final_currency VARCHAR(3);

-- Enhanced freeze tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS freeze_reason VARCHAR(500);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS freeze_end_date DATE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS freeze_document_path VARCHAR(500);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS total_freeze_days_used INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS freeze_type VARCHAR(20);

-- Notes fields
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS contract_notes TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS staff_notes TEXT;

-- Sales attribution
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS referred_by_member_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS sales_rep_user_id UUID;

-- ==========================================
-- 5. INDEXES FOR SUBSCRIPTION ENHANCEMENTS
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_discount_type ON subscriptions(discount_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_sales_rep ON subscriptions(sales_rep_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_referred_by ON subscriptions(referred_by_member_id);
