-- Referral program configuration per tenant
CREATE TABLE referral_configs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    code_prefix VARCHAR(10) DEFAULT 'REF',
    referrer_reward_type VARCHAR(50) NOT NULL DEFAULT 'WALLET_CREDIT',
    referrer_reward_amount DECIMAL(10, 2),
    referrer_reward_currency VARCHAR(3) DEFAULT 'SAR',
    referrer_free_days INT,
    min_subscription_days INT DEFAULT 30,
    max_referrals_per_member INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Individual referral codes for members
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    click_count INT NOT NULL DEFAULT 0,
    conversion_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_referral_codes_code_tenant UNIQUE (tenant_id, code)
);

-- Referral tracking (click to conversion journey)
CREATE TABLE referrals (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
    referrer_member_id UUID NOT NULL,
    referee_member_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'CLICKED',
    clicked_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    subscription_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Rewards earned from referrals
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    referral_id UUID NOT NULL REFERENCES referrals(id),
    member_id UUID NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'SAR',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    distributed_at TIMESTAMP WITH TIME ZONE,
    wallet_transaction_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_referral_configs_tenant ON referral_configs(tenant_id);
CREATE INDEX idx_referral_codes_tenant ON referral_codes(tenant_id);
CREATE INDEX idx_referral_codes_member ON referral_codes(member_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_member_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_member_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referral_rewards_tenant ON referral_rewards(tenant_id);
CREATE INDEX idx_referral_rewards_referral ON referral_rewards(referral_id);
CREATE INDEX idx_referral_rewards_member ON referral_rewards(member_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);

-- Insert referral permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar) VALUES
(gen_random_uuid(), 'referrals_view', 'referrals', 'view', 'View Referrals', 'عرض الإحالات', 'View referral program data and analytics', 'عرض بيانات برنامج الإحالة والتحليلات'),
(gen_random_uuid(), 'referrals_manage', 'referrals', 'manage', 'Manage Referrals', 'إدارة الإحالات', 'Configure referral program settings', 'تكوين إعدادات برنامج الإحالة');

-- Grant referral permissions to ADMIN role by default
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'ADMIN', id FROM permissions WHERE code IN ('referrals_view', 'referrals_manage');
