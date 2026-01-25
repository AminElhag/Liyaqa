-- Loyalty Points System Tables
-- Enables members to earn and redeem points with tier-based benefits

-- Member points balance and tier tracking
CREATE TABLE member_points (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL UNIQUE,
    points_balance BIGINT NOT NULL DEFAULT 0,
    lifetime_earned BIGINT NOT NULL DEFAULT 0,
    lifetime_redeemed BIGINT NOT NULL DEFAULT 0,
    tier VARCHAR(20) NOT NULL DEFAULT 'BRONZE',
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_member_points_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_points_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Points transaction history
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL,
    points BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    description_ar TEXT,
    balance_after BIGINT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_points_tx_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_points_tx_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Loyalty configuration per tenant
CREATE TABLE loyalty_config (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    points_per_checkin INT NOT NULL DEFAULT 10,
    points_per_referral INT NOT NULL DEFAULT 100,
    points_per_sar_spent INT NOT NULL DEFAULT 1,
    redemption_rate_sar DECIMAL(5,2) NOT NULL DEFAULT 0.01,
    bronze_threshold BIGINT NOT NULL DEFAULT 0,
    silver_threshold BIGINT NOT NULL DEFAULT 500,
    gold_threshold BIGINT NOT NULL DEFAULT 2000,
    platinum_threshold BIGINT NOT NULL DEFAULT 5000,
    points_expiry_months INT NOT NULL DEFAULT 12,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_loyalty_config_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_member_points_tenant ON member_points(tenant_id);
CREATE INDEX idx_member_points_member ON member_points(member_id);
CREATE INDEX idx_member_points_tier ON member_points(tenant_id, tier);

CREATE INDEX idx_points_tx_tenant ON points_transactions(tenant_id);
CREATE INDEX idx_points_tx_member ON points_transactions(member_id);
CREATE INDEX idx_points_tx_type ON points_transactions(tenant_id, type);
CREATE INDEX idx_points_tx_source ON points_transactions(tenant_id, source);
CREATE INDEX idx_points_tx_created ON points_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_points_tx_expires ON points_transactions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_loyalty_config_tenant ON loyalty_config(tenant_id);

-- Comments
COMMENT ON TABLE member_points IS 'Tracks member loyalty points balance and tier status';
COMMENT ON TABLE points_transactions IS 'Audit trail for all points earn/redeem/expire transactions';
COMMENT ON TABLE loyalty_config IS 'Per-tenant loyalty program configuration';
COMMENT ON COLUMN points_transactions.type IS 'EARN, REDEEM, EXPIRE, ADJUSTMENT';
COMMENT ON COLUMN points_transactions.source IS 'ATTENDANCE, REFERRAL, PURCHASE, MANUAL, PROMOTION, BIRTHDAY';
