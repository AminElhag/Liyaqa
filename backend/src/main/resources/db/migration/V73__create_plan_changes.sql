-- ==========================================
-- V73: PLAN CHANGES (UPGRADES/DOWNGRADES)
-- ==========================================
-- Implements plan change history and scheduled changes with proration.

-- ==========================================
-- 1. PLAN CHANGE HISTORY
-- ==========================================
-- Tracks all plan changes (upgrades and downgrades)

CREATE TABLE plan_change_history (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    contract_id UUID REFERENCES membership_contracts(id),
    member_id UUID NOT NULL REFERENCES members(id),

    -- Plan details
    old_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    new_plan_id UUID NOT NULL REFERENCES membership_plans(id),

    -- Change type and timing
    change_type VARCHAR(20) NOT NULL,             -- UPGRADE, DOWNGRADE
    proration_mode VARCHAR(30) NOT NULL,          -- PRORATE_IMMEDIATELY, END_OF_PERIOD, FULL_PERIOD_CREDIT, NO_PRORATION
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_date DATE NOT NULL,

    -- Billing period context
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    days_remaining INT NOT NULL,
    total_days INT NOT NULL,

    -- Proration amounts
    credit_amount DECIMAL(19,4),
    credit_currency VARCHAR(3) DEFAULT 'SAR',
    charge_amount DECIMAL(19,4),
    charge_currency VARCHAR(3) DEFAULT 'SAR',
    net_amount DECIMAL(19,4),
    net_currency VARCHAR(3) DEFAULT 'SAR',

    -- Invoice reference
    invoice_id UUID REFERENCES invoices(id),
    wallet_transaction_id UUID,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',

    -- Who initiated
    initiated_by_user_id UUID,
    initiated_by_member BOOLEAN DEFAULT FALSE,

    -- Notes
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_plan_changes_tenant ON plan_change_history(tenant_id);
CREATE INDEX idx_plan_changes_subscription ON plan_change_history(subscription_id);
CREATE INDEX idx_plan_changes_member ON plan_change_history(member_id);
CREATE INDEX idx_plan_changes_effective_date ON plan_change_history(effective_date);
CREATE INDEX idx_plan_changes_type ON plan_change_history(tenant_id, change_type);
CREATE INDEX idx_plan_changes_old_plan ON plan_change_history(old_plan_id);
CREATE INDEX idx_plan_changes_new_plan ON plan_change_history(new_plan_id);

-- ==========================================
-- 2. SCHEDULED PLAN CHANGES
-- ==========================================
-- For downgrades that take effect at end of billing period

CREATE TABLE scheduled_plan_changes (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    contract_id UUID REFERENCES membership_contracts(id),
    member_id UUID NOT NULL REFERENCES members(id),

    -- What's changing
    current_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    new_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    change_type VARCHAR(20) NOT NULL,             -- UPGRADE, DOWNGRADE

    -- When it's scheduled for
    scheduled_date DATE NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',         -- PENDING, PROCESSED, CANCELLED

    -- Processing details
    processed_at TIMESTAMPTZ,
    plan_change_history_id UUID REFERENCES plan_change_history(id),

    -- Who initiated
    initiated_by_user_id UUID,
    initiated_by_member BOOLEAN DEFAULT FALSE,

    -- Cancellation details
    cancelled_at TIMESTAMPTZ,
    cancelled_by_user_id UUID,
    cancellation_reason TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_scheduled_changes_tenant ON scheduled_plan_changes(tenant_id);
CREATE INDEX idx_scheduled_changes_subscription ON scheduled_plan_changes(subscription_id);
CREATE INDEX idx_scheduled_changes_member ON scheduled_plan_changes(member_id);
CREATE INDEX idx_scheduled_changes_date ON scheduled_plan_changes(scheduled_date, status);
CREATE INDEX idx_scheduled_changes_status ON scheduled_plan_changes(tenant_id, status);
CREATE INDEX idx_scheduled_changes_pending ON scheduled_plan_changes(scheduled_date) WHERE status = 'PENDING';

-- ==========================================
-- 3. PLAN CHANGE ELIGIBILITY RULES
-- ==========================================
-- Rules for which plans can be upgraded/downgraded to

CREATE TABLE plan_change_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    from_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    to_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    change_type VARCHAR(20) NOT NULL,             -- UPGRADE, DOWNGRADE, LATERAL
    is_allowed BOOLEAN DEFAULT TRUE,
    requires_staff_approval BOOLEAN DEFAULT FALSE,
    minimum_days_on_current_plan INT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE(tenant_id, from_plan_id, to_plan_id)
);

CREATE INDEX idx_plan_change_rules_tenant ON plan_change_rules(tenant_id);
CREATE INDEX idx_plan_change_rules_from ON plan_change_rules(from_plan_id);
CREATE INDEX idx_plan_change_rules_to ON plan_change_rules(to_plan_id);
CREATE INDEX idx_plan_change_rules_active ON plan_change_rules(tenant_id, is_active);

-- ==========================================
-- 4. SUBSCRIPTION ENHANCEMENTS FOR PLAN CHANGES
-- ==========================================

-- Track scheduled changes on subscription
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS scheduled_plan_change_id UUID REFERENCES scheduled_plan_changes(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_billing_period_start DATE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_billing_period_end DATE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_scheduled_change ON subscriptions(scheduled_plan_change_id) WHERE scheduled_plan_change_id IS NOT NULL;
