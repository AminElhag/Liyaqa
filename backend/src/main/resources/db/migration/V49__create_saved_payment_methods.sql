-- Saved Payment Methods Table
-- Allows members to save their payment methods for future use

CREATE TABLE saved_payment_methods (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

    -- Payment method type
    payment_type VARCHAR(50) NOT NULL,  -- CARD, STCPAY, MADA, APPLE_PAY

    -- Card details (if type is CARD or MADA)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),  -- VISA, MASTERCARD, MADA
    card_exp_month INT,
    card_exp_year INT,

    -- Provider details
    provider_token TEXT,  -- Encrypted token from payment provider
    provider_type VARCHAR(50) NOT NULL,  -- STRIPE, MOYASAR, HYPERPAY
    provider_customer_id VARCHAR(255),

    -- User preferences
    nickname VARCHAR(100),
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Billing address (optional)
    billing_name VARCHAR(255),
    billing_country VARCHAR(2),
    billing_city VARCHAR(100),

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_saved_payment_methods_tenant ON saved_payment_methods(tenant_id);
CREATE INDEX idx_saved_payment_methods_member ON saved_payment_methods(member_id);
CREATE INDEX idx_saved_payment_methods_active ON saved_payment_methods(member_id, is_active) WHERE is_active = true;
CREATE INDEX idx_saved_payment_methods_default ON saved_payment_methods(member_id, is_default) WHERE is_default = true;

-- Ensure only one default payment method per member
CREATE UNIQUE INDEX idx_saved_payment_methods_one_default
    ON saved_payment_methods(member_id)
    WHERE is_default = true AND is_active = true;

-- Comments
COMMENT ON TABLE saved_payment_methods IS 'Saved payment methods for members to use in future transactions';
COMMENT ON COLUMN saved_payment_methods.provider_token IS 'Encrypted token from the payment provider (Stripe, Moyasar, etc.)';
COMMENT ON COLUMN saved_payment_methods.payment_type IS 'Type of payment method: CARD, STCPAY, MADA, APPLE_PAY';
