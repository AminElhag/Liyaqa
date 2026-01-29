-- ==========================================
-- V74: CANCELLATION FLOW & RETENTION
-- ==========================================
-- Implements exit surveys, retention offers, and cancellation management.

-- ==========================================
-- 1. EXIT SURVEYS
-- ==========================================
-- Collects feedback when members cancel

CREATE TABLE exit_surveys (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    contract_id UUID REFERENCES membership_contracts(id),

    -- Primary reason
    reason_category VARCHAR(30) NOT NULL,         -- FINANCIAL, RELOCATION, HEALTH, DISSATISFACTION, USAGE, COMPETITION, PERSONAL, OTHER
    reason_detail TEXT,

    -- Detailed feedback
    feedback TEXT,

    -- Satisfaction scores
    nps_score INT CHECK (nps_score >= 0 AND nps_score <= 10),
    would_recommend BOOLEAN,
    overall_satisfaction INT CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),

    -- Specific areas of dissatisfaction (optional)
    dissatisfaction_areas VARCHAR(200)[],         -- Array: FACILITIES, STAFF, CLEANLINESS, EQUIPMENT, CLASSES, PRICE, LOCATION, HOURS, CROWDING

    -- What would bring them back
    what_would_bring_back TEXT,
    open_to_future_offers BOOLEAN DEFAULT TRUE,

    -- Competitor info (if they're switching)
    competitor_name VARCHAR(100),
    competitor_reason TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_exit_surveys_tenant ON exit_surveys(tenant_id);
CREATE INDEX idx_exit_surveys_member ON exit_surveys(member_id);
CREATE INDEX idx_exit_surveys_subscription ON exit_surveys(subscription_id);
CREATE INDEX idx_exit_surveys_reason ON exit_surveys(tenant_id, reason_category);
CREATE INDEX idx_exit_surveys_date ON exit_surveys(tenant_id, created_at);
CREATE INDEX idx_exit_surveys_nps ON exit_surveys(tenant_id, nps_score);

-- ==========================================
-- 2. RETENTION OFFERS
-- ==========================================
-- Offers shown during cancellation flow

CREATE TABLE retention_offers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    contract_id UUID REFERENCES membership_contracts(id),

    -- Offer details
    offer_type VARCHAR(30) NOT NULL,              -- FREE_FREEZE, DISCOUNT, CREDIT, DOWNGRADE, EXTENSION, PERSONAL_TRAINING, CUSTOM
    title_en VARCHAR(200),
    title_ar VARCHAR(200),
    description_en TEXT,
    description_ar TEXT,

    -- Value
    value_amount DECIMAL(19,4),
    value_currency VARCHAR(3) DEFAULT 'SAR',
    discount_percentage DECIMAL(5,2),
    duration_days INT,
    duration_months INT,

    -- For downgrade offers
    alternative_plan_id UUID REFERENCES membership_plans(id),

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',         -- PENDING, ACCEPTED, DECLINED, EXPIRED
    expires_at TIMESTAMPTZ,

    -- Response
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,

    -- What was applied
    wallet_transaction_id UUID,
    freeze_history_id UUID REFERENCES subscription_freeze_history(id),
    plan_change_id UUID REFERENCES plan_change_history(id),

    -- Priority for display order
    priority INT DEFAULT 1,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_retention_offers_tenant ON retention_offers(tenant_id);
CREATE INDEX idx_retention_offers_member ON retention_offers(member_id);
CREATE INDEX idx_retention_offers_subscription ON retention_offers(subscription_id);
CREATE INDEX idx_retention_offers_status ON retention_offers(tenant_id, status);
CREATE INDEX idx_retention_offers_type ON retention_offers(tenant_id, offer_type);
CREATE INDEX idx_retention_offers_expires ON retention_offers(expires_at) WHERE status = 'PENDING';

-- ==========================================
-- 3. RETENTION OFFER TEMPLATES
-- ==========================================
-- Templates for generating retention offers based on member profiles

CREATE TABLE retention_offer_templates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),

    -- Template info
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    offer_type VARCHAR(30) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200),
    description_en TEXT,
    description_ar TEXT,

    -- Value
    value_amount DECIMAL(19,4),
    discount_percentage DECIMAL(5,2),
    duration_days INT,
    duration_months INT,
    alternative_plan_id UUID REFERENCES membership_plans(id),

    -- Eligibility criteria
    min_tenure_days INT,                          -- Member must have been subscribed for at least X days
    min_membership_value DECIMAL(19,4),           -- Lifetime value threshold
    applicable_plans UUID[],                      -- Only for members on these plans
    applicable_categories UUID[],                 -- Only for these membership categories
    cancellation_reasons VARCHAR(30)[],           -- Only for these cancellation reasons

    -- Validity
    valid_from DATE,
    valid_until DATE,
    max_uses_per_member INT DEFAULT 1,
    max_total_uses INT,
    current_uses INT DEFAULT 0,

    -- Priority
    priority INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_retention_templates_tenant ON retention_offer_templates(tenant_id);
CREATE INDEX idx_retention_templates_active ON retention_offer_templates(tenant_id, is_active);
CREATE INDEX idx_retention_templates_type ON retention_offer_templates(tenant_id, offer_type);

-- ==========================================
-- 4. CANCELLATION REQUESTS
-- ==========================================
-- Tracks cancellation requests through the process

CREATE TABLE cancellation_requests (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    contract_id UUID REFERENCES membership_contracts(id),

    -- Request details
    reason_category VARCHAR(30) NOT NULL,
    reason_detail TEXT,

    -- Notice period
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notice_period_days INT NOT NULL,
    notice_period_end_date DATE NOT NULL,
    effective_date DATE NOT NULL,

    -- Early termination
    is_within_commitment BOOLEAN DEFAULT FALSE,
    early_termination_fee DECIMAL(19,4),
    early_termination_fee_currency VARCHAR(3) DEFAULT 'SAR',
    fee_waived BOOLEAN DEFAULT FALSE,
    fee_waived_by UUID REFERENCES users(id),
    fee_waived_reason TEXT,

    -- Cooling-off
    is_within_cooling_off BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_NOTICE',  -- PENDING_NOTICE, IN_NOTICE, SAVED, COMPLETED, WITHDRAWN

    -- Retention
    retention_offer_accepted_id UUID REFERENCES retention_offers(id),
    exit_survey_id UUID REFERENCES exit_surveys(id),

    -- Processing
    completed_at TIMESTAMPTZ,
    saved_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    withdrawn_reason TEXT,

    -- Staff handling
    assigned_to_user_id UUID REFERENCES users(id),
    staff_notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_cancellation_requests_tenant ON cancellation_requests(tenant_id);
CREATE INDEX idx_cancellation_requests_member ON cancellation_requests(member_id);
CREATE INDEX idx_cancellation_requests_subscription ON cancellation_requests(subscription_id);
CREATE INDEX idx_cancellation_requests_status ON cancellation_requests(tenant_id, status);
CREATE INDEX idx_cancellation_requests_effective ON cancellation_requests(effective_date);
CREATE INDEX idx_cancellation_requests_pending ON cancellation_requests(tenant_id, notice_period_end_date) WHERE status IN ('PENDING_NOTICE', 'IN_NOTICE');

-- ==========================================
-- 5. WIN-BACK CAMPAIGNS
-- ==========================================
-- Track outreach to former members

CREATE TABLE win_back_campaigns (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),

    -- Former subscription info
    former_subscription_id UUID REFERENCES subscriptions(id),
    former_contract_id UUID REFERENCES membership_contracts(id),
    cancellation_date DATE,
    cancellation_reason VARCHAR(30),

    -- Campaign details
    campaign_name VARCHAR(100),
    offer_type VARCHAR(30),
    offer_description TEXT,
    offer_value_amount DECIMAL(19,4),
    offer_discount_percentage DECIMAL(5,2),

    -- Outreach
    first_contact_at TIMESTAMPTZ,
    last_contact_at TIMESTAMPTZ,
    contact_count INT DEFAULT 0,
    contact_channel VARCHAR(20),                  -- EMAIL, SMS, WHATSAPP, PHONE

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',         -- PENDING, CONTACTED, INTERESTED, CONVERTED, NOT_INTERESTED, UNSUBSCRIBED

    -- Conversion
    converted_at TIMESTAMPTZ,
    new_subscription_id UUID REFERENCES subscriptions(id),
    new_contract_id UUID REFERENCES membership_contracts(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_win_back_tenant ON win_back_campaigns(tenant_id);
CREATE INDEX idx_win_back_member ON win_back_campaigns(member_id);
CREATE INDEX idx_win_back_status ON win_back_campaigns(tenant_id, status);
CREATE INDEX idx_win_back_converted ON win_back_campaigns(converted_at) WHERE converted_at IS NOT NULL;

-- ==========================================
-- 6. SUBSCRIPTION ENHANCEMENTS FOR CANCELLATION
-- ==========================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_request_id UUID REFERENCES cancellation_requests(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_effective_date DATE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reactivation_eligible_until DATE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_cancellation_request ON subscriptions(cancellation_request_id) WHERE cancellation_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancellation_effective ON subscriptions(cancellation_effective_date) WHERE cancellation_effective_date IS NOT NULL;
