-- V86: Add class pricing models and class packs
-- This migration adds support for multiple pricing models for gym classes
-- and introduces class packs that members can purchase for class credits.

-- 1. Add pricing fields to gym_classes
ALTER TABLE gym_classes
ADD COLUMN pricing_model VARCHAR(50) NOT NULL DEFAULT 'INCLUDED_IN_MEMBERSHIP',
ADD COLUMN drop_in_price_amount DECIMAL(10,2),
ADD COLUMN drop_in_price_currency VARCHAR(3) DEFAULT 'SAR',
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 15.00,
ADD COLUMN allow_non_subscribers BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN advance_booking_days INT NOT NULL DEFAULT 7,
ADD COLUMN cancellation_deadline_hours INT NOT NULL DEFAULT 2,
ADD COLUMN late_cancel_fee_amount DECIMAL(10,2),
ADD COLUMN late_cancel_fee_currency VARCHAR(3) DEFAULT 'SAR';

-- 2. Create class_packs table
CREATE TABLE class_packs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    class_count INT NOT NULL,
    price_amount DECIMAL(10,2) NOT NULL,
    price_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    validity_days INT,
    valid_class_types VARCHAR(500),
    valid_class_ids TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 0
);

-- 3. Create member_class_pack_balances table
CREATE TABLE member_class_pack_balances (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    class_pack_id UUID NOT NULL REFERENCES class_packs(id),
    order_id UUID,
    classes_purchased INT NOT NULL,
    classes_remaining INT NOT NULL,
    purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 0
);

-- 4. Add payment tracking to class_bookings
ALTER TABLE class_bookings
ADD COLUMN payment_source VARCHAR(50),
ADD COLUMN class_pack_balance_id UUID REFERENCES member_class_pack_balances(id),
ADD COLUMN order_id UUID,
ADD COLUMN paid_amount DECIMAL(10,2),
ADD COLUMN paid_currency VARCHAR(3);

-- 5. Indexes for performance
CREATE INDEX idx_class_packs_tenant_status ON class_packs(tenant_id, status);
CREATE INDEX idx_member_pack_balances_member ON member_class_pack_balances(tenant_id, member_id, status);
CREATE INDEX idx_member_pack_balances_pack ON member_class_pack_balances(class_pack_id);
CREATE INDEX idx_member_pack_balances_expires ON member_class_pack_balances(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_class_bookings_payment_source ON class_bookings(payment_source) WHERE payment_source IS NOT NULL;
CREATE INDEX idx_class_bookings_pack_balance ON class_bookings(class_pack_balance_id) WHERE class_pack_balance_id IS NOT NULL;
CREATE INDEX idx_gym_classes_pricing_model ON gym_classes(tenant_id, pricing_model, status);

-- 6. Comments for documentation
COMMENT ON COLUMN gym_classes.pricing_model IS 'INCLUDED_IN_MEMBERSHIP, PAY_PER_ENTRY, CLASS_PACK_ONLY, HYBRID';
COMMENT ON COLUMN gym_classes.drop_in_price_amount IS 'Price for single class purchase (pay-per-entry)';
COMMENT ON COLUMN gym_classes.allow_non_subscribers IS 'Whether non-members can book this class';
COMMENT ON COLUMN gym_classes.advance_booking_days IS 'How many days in advance members can book';
COMMENT ON COLUMN gym_classes.cancellation_deadline_hours IS 'Hours before class when cancellation becomes late';
COMMENT ON COLUMN gym_classes.late_cancel_fee_amount IS 'Fee charged for late cancellations';

COMMENT ON TABLE class_packs IS 'Class credit bundles that members can purchase';
COMMENT ON COLUMN class_packs.class_count IS 'Number of class credits in this pack';
COMMENT ON COLUMN class_packs.validity_days IS 'Days until pack expires after purchase (null = never)';
COMMENT ON COLUMN class_packs.valid_class_types IS 'Comma-separated list of ClassType values this pack can be used for';
COMMENT ON COLUMN class_packs.valid_class_ids IS 'Comma-separated UUIDs of specific classes this pack can be used for';

COMMENT ON TABLE member_class_pack_balances IS 'Tracks individual member class pack purchases and usage';
COMMENT ON COLUMN member_class_pack_balances.classes_remaining IS 'Current number of unused credits';
COMMENT ON COLUMN member_class_pack_balances.expires_at IS 'When this balance expires (null = never)';

COMMENT ON COLUMN class_bookings.payment_source IS 'MEMBERSHIP_INCLUDED, CLASS_PACK, PAY_PER_ENTRY, COMPLIMENTARY';
COMMENT ON COLUMN class_bookings.class_pack_balance_id IS 'Reference to pack balance if paid with class pack';
