-- V129: Class Categories and Per-Category Class Pack Credit Allocation
-- Adds admin-created class categories, per-category credit distribution in packs,
-- and per-category balance tracking for members.

-- 1. Class Categories — admin-created, per-tenant class groupings
CREATE TABLE class_categories (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    color_code VARCHAR(7),
    icon VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_class_categories_tenant ON class_categories(tenant_id);
CREATE INDEX idx_class_categories_active ON class_categories(tenant_id, is_active);

-- 2. Add category_id to gym_classes
ALTER TABLE gym_classes ADD COLUMN category_id UUID REFERENCES class_categories(id) ON DELETE SET NULL;
CREATE INDEX idx_gym_classes_category ON gym_classes(category_id);

-- 3. Add allocation_mode to class_packs
ALTER TABLE class_packs ADD COLUMN allocation_mode VARCHAR(20) NOT NULL DEFAULT 'FLAT';

-- 4. Per-category credit allocation within a pack
CREATE TABLE class_pack_category_allocations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    class_pack_id UUID NOT NULL REFERENCES class_packs(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES class_categories(id) ON DELETE RESTRICT,
    credit_count INT NOT NULL CHECK (credit_count >= 1),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE(class_pack_id, category_id)
);

CREATE INDEX idx_cpca_class_pack ON class_pack_category_allocations(class_pack_id);
CREATE INDEX idx_cpca_category ON class_pack_category_allocations(category_id);

-- 5. Per-category balance tracking for members
CREATE TABLE member_category_balances (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    balance_id UUID NOT NULL REFERENCES member_class_pack_balances(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES class_categories(id) ON DELETE RESTRICT,
    credits_allocated INT NOT NULL,
    credits_remaining INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE(balance_id, category_id)
);

CREATE INDEX idx_mcb_balance ON member_category_balances(balance_id);
CREATE INDEX idx_mcb_category ON member_category_balances(category_id);

-- 6. Add category_balance_id to class_bookings
ALTER TABLE class_bookings ADD COLUMN category_balance_id UUID REFERENCES member_category_balances(id) ON DELETE SET NULL;
