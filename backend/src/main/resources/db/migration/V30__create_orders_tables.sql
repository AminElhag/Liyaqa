-- Orders table (shopping cart and placed orders)
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    status VARCHAR(20) NOT NULL DEFAULT 'CART',
    invoice_id UUID REFERENCES invoices(id),
    notes TEXT,
    placed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_member ON orders(member_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_invoice ON orders(invoice_id);

-- Ensure only one active cart per member per tenant
CREATE UNIQUE INDEX idx_orders_active_cart ON orders(tenant_id, member_id) WHERE status = 'CART';

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name_en VARCHAR(255) NOT NULL,
    product_name_ar VARCHAR(255),
    product_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
