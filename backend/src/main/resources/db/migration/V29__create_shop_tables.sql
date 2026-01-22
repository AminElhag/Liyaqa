-- Product Categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    icon VARCHAR(50),
    department VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    custom_department VARCHAR(100),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_categories_tenant ON product_categories(tenant_id);
CREATE INDEX idx_product_categories_department ON product_categories(department);
CREATE INDEX idx_product_categories_active ON product_categories(is_active);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),

    -- Basic info
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    sku VARCHAR(50) UNIQUE,

    -- Classification
    product_type VARCHAR(20) NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    -- Pricing
    list_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,

    -- Stock-based pricing
    low_stock_threshold INT DEFAULT 10,
    low_stock_price DECIMAL(10,2),
    low_stock_currency VARCHAR(3),
    out_of_stock_price DECIMAL(10,2),
    out_of_stock_currency VARCHAR(3),

    -- Inventory
    stock_quantity INT,
    track_inventory BOOLEAN NOT NULL DEFAULT FALSE,

    -- Expiration
    has_expiration BOOLEAN NOT NULL DEFAULT FALSE,
    expiration_days INT,

    -- Zone access
    access_duration_days INT,

    -- Restrictions
    is_single_use BOOLEAN NOT NULL DEFAULT FALSE,
    max_quantity_per_order INT,

    -- Display
    sort_order INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500),

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sku ON products(sku);

-- Product Zone Access (many-to-many with enum)
CREATE TABLE product_zone_access (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    zone_type VARCHAR(30) NOT NULL,
    PRIMARY KEY (product_id, zone_type)
);

-- Bundle Items
CREATE TABLE bundle_items (
    id UUID PRIMARY KEY,
    bundle_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,

    CONSTRAINT uk_bundle_product UNIQUE (bundle_id, product_id)
);

CREATE INDEX idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_product ON bundle_items(product_id);

-- Member Product Access (tracks granted zone access from purchases)
CREATE TABLE member_product_access (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    product_id UUID NOT NULL REFERENCES products(id),
    zone_type VARCHAR(30) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    invoice_id UUID REFERENCES invoices(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_product_access_member ON member_product_access(member_id);
CREATE INDEX idx_member_product_access_expires ON member_product_access(expires_at);
CREATE INDEX idx_member_product_access_active ON member_product_access(is_active);

-- Member Single-Use Tracking (prevents re-purchasing single-use products)
CREATE TABLE member_product_purchases (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    product_id UUID NOT NULL REFERENCES products(id),
    invoice_id UUID REFERENCES invoices(id),
    purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_member_single_use UNIQUE (member_id, product_id)
);

CREATE INDEX idx_member_product_purchases_member ON member_product_purchases(member_id);
