-- Vouchers (promo codes, discounts, gift cards)
CREATE TABLE vouchers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    discount_type VARCHAR(50) NOT NULL,
    discount_amount DECIMAL(10, 2),
    discount_currency VARCHAR(3) DEFAULT 'SAR',
    discount_percent DECIMAL(5, 2),
    free_trial_days INT,
    gift_card_balance DECIMAL(10, 2),
    max_uses INT,
    max_uses_per_member INT DEFAULT 1,
    current_use_count INT NOT NULL DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    first_time_member_only BOOLEAN NOT NULL DEFAULT FALSE,
    minimum_purchase DECIMAL(10, 2),
    applicable_plan_ids TEXT,
    applicable_product_ids TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_vouchers_code_tenant UNIQUE (tenant_id, code)
);

-- Track voucher usage
CREATE TABLE voucher_usages (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    voucher_id UUID NOT NULL REFERENCES vouchers(id),
    member_id UUID NOT NULL,
    used_for_type VARCHAR(50) NOT NULL,
    used_for_id UUID,
    discount_applied DECIMAL(10, 2),
    discount_currency VARCHAR(3) DEFAULT 'SAR',
    invoice_id UUID,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vouchers_tenant ON vouchers(tenant_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_active ON vouchers(tenant_id, is_active);
CREATE INDEX idx_vouchers_valid ON vouchers(valid_from, valid_until);
CREATE INDEX idx_voucher_usages_tenant ON voucher_usages(tenant_id);
CREATE INDEX idx_voucher_usages_voucher ON voucher_usages(voucher_id);
CREATE INDEX idx_voucher_usages_member ON voucher_usages(member_id);

-- Insert voucher permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar) VALUES
(gen_random_uuid(), 'vouchers_view', 'vouchers', 'view', 'View Vouchers', 'عرض القسائم', 'View vouchers and promo codes', 'عرض القسائم وأكواد الخصم'),
(gen_random_uuid(), 'vouchers_create', 'vouchers', 'create', 'Create Vouchers', 'إنشاء قسائم', 'Create new vouchers and promo codes', 'إنشاء قسائم وأكواد خصم جديدة'),
(gen_random_uuid(), 'vouchers_edit', 'vouchers', 'edit', 'Edit Vouchers', 'تعديل القسائم', 'Edit existing vouchers', 'تعديل القسائم الموجودة'),
(gen_random_uuid(), 'vouchers_delete', 'vouchers', 'delete', 'Delete Vouchers', 'حذف القسائم', 'Delete vouchers', 'حذف القسائم');

-- Grant voucher permissions to ADMIN role by default
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'ADMIN', id FROM permissions WHERE code IN ('vouchers_view', 'vouchers_create', 'vouchers_edit', 'vouchers_delete');
