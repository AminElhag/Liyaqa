-- Payment entity table (one-to-many from Invoice)
CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    payment_method VARCHAR(30) NOT NULL,
    payment_reference VARCHAR(255),
    notes TEXT,
    paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    gateway_transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_tenant_id ON invoice_payments(tenant_id);

-- ZATCA Phase 1 fields on invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_date_time TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type_code VARCHAR(20) DEFAULT 'SIMPLIFIED';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type_code VARCHAR(20) DEFAULT 'INVOICE_388';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_reference VARCHAR(100);

-- VAT category code on line items
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS line_vat_category_code VARCHAR(5) DEFAULT 'S';

-- Seller ZATCA config on clubs
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS zatca_seller_name_ar VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS zatca_cr_number VARCHAR(50);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS zatca_street VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS zatca_building_number VARCHAR(20);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS zatca_city VARCHAR(100);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS zatca_postal_code VARCHAR(10);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS zatca_district VARCHAR(100);
