-- Billing and invoicing tables

-- Invoice number sequence per organization
CREATE TABLE invoice_sequences (
    organization_id UUID PRIMARY KEY,
    current_year INT NOT NULL,
    current_sequence BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_invoice_seq_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    member_id UUID NOT NULL,
    subscription_id UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    issue_date DATE,
    due_date DATE,
    paid_date DATE,

    -- Monetary amounts with currency
    subtotal_amount DECIMAL(10, 2) NOT NULL,
    subtotal_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    vat_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    total_amount DECIMAL(10, 2) NOT NULL,
    total_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    paid_amount DECIMAL(10, 2),
    paid_currency VARCHAR(3),

    -- Notes (bilingual)
    notes_en TEXT,
    notes_ar TEXT,

    -- Payment info
    payment_method VARCHAR(30),
    payment_reference VARCHAR(255),

    -- Zatca e-invoicing (future)
    zatca_invoice_hash VARCHAR(500),
    zatca_qr_code TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT uq_invoices_number UNIQUE (invoice_number),
    CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_invoices_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_invoices_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- Invoice line items (embedded collection)
CREATE TABLE invoice_line_items (
    invoice_id UUID NOT NULL,
    line_item_id UUID NOT NULL,
    line_description_en VARCHAR(500) NOT NULL,
    line_description_ar VARCHAR(500),
    line_quantity INT NOT NULL DEFAULT 1,
    line_unit_price DECIMAL(10, 2) NOT NULL,
    line_unit_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    line_item_type VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    line_sort_order INT NOT NULL DEFAULT 0,

    PRIMARY KEY (invoice_id, line_item_id),
    CONSTRAINT fk_line_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Indexes for invoices
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_member_id ON invoices(member_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Composite index for overdue invoice queries
CREATE INDEX idx_invoices_overdue ON invoices(status, due_date) WHERE status = 'ISSUED';

-- Index for line items
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
