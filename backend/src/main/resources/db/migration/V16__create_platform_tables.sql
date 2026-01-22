-- Platform management tables for internal Liyaqa team
-- V16: Create platform module tables

-- ============================================
-- 1. Modify users table for platform support
-- ============================================

ALTER TABLE users ADD COLUMN is_platform_user BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN platform_organization_id UUID;

-- Index for platform users (partial index for efficiency)
CREATE INDEX idx_users_platform ON users(is_platform_user) WHERE is_platform_user = TRUE;

-- ============================================
-- 2. Insert Platform Organization (well-known UUID)
-- ============================================

INSERT INTO organizations (
    id,
    name_en,
    name_ar,
    organization_type,
    status,
    email,
    created_at,
    updated_at,
    version
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Liyaqa Platform',
    'منصة لياقة',
    'LLC',
    'ACTIVE',
    'platform@liyaqa.com',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
);

-- ============================================
-- 3. Client Plans (B2B pricing tiers)
-- ============================================

CREATE TABLE client_plans (
    id UUID PRIMARY KEY,

    -- Plan name (localized)
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),

    -- Description (localized)
    description_en TEXT,
    description_ar TEXT,

    -- Pricing
    monthly_price_amount DECIMAL(10, 2) NOT NULL,
    monthly_price_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    annual_price_amount DECIMAL(10, 2) NOT NULL,
    annual_price_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',

    -- Billing cycle options
    billing_cycle VARCHAR(30) NOT NULL DEFAULT 'MONTHLY',

    -- Limits
    max_clubs INT NOT NULL DEFAULT 1,
    max_locations_per_club INT NOT NULL DEFAULT 1,
    max_members INT NOT NULL DEFAULT 100,
    max_staff_users INT NOT NULL DEFAULT 5,

    -- Feature flags
    has_advanced_reporting BOOLEAN NOT NULL DEFAULT FALSE,
    has_api_access BOOLEAN NOT NULL DEFAULT FALSE,
    has_priority_support BOOLEAN NOT NULL DEFAULT FALSE,
    has_white_labeling BOOLEAN NOT NULL DEFAULT FALSE,
    has_custom_integrations BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_client_plans_active ON client_plans(is_active);
CREATE INDEX idx_client_plans_sort ON client_plans(sort_order);

-- ============================================
-- 4. Client Subscriptions (Organization-Level)
-- ============================================

CREATE TABLE client_subscriptions (
    id UUID PRIMARY KEY,

    -- References
    organization_id UUID NOT NULL,
    client_plan_id UUID NOT NULL,

    -- Subscription status
    status VARCHAR(30) NOT NULL DEFAULT 'TRIAL',

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trial_ends_at DATE,

    -- Negotiated pricing (may differ from plan)
    agreed_price_amount DECIMAL(10, 2) NOT NULL,
    agreed_price_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    discount_percentage DECIMAL(5, 2),

    -- Contract details
    contract_months INT NOT NULL DEFAULT 12,
    billing_cycle VARCHAR(30) NOT NULL DEFAULT 'MONTHLY',
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,

    -- Sales attribution
    sales_rep_id UUID,
    deal_id UUID,

    -- Notes (localized)
    notes_en TEXT,
    notes_ar TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_client_sub_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_client_sub_plan FOREIGN KEY (client_plan_id) REFERENCES client_plans(id)
);

CREATE INDEX idx_client_sub_org ON client_subscriptions(organization_id);
CREATE INDEX idx_client_sub_plan ON client_subscriptions(client_plan_id);
CREATE INDEX idx_client_sub_status ON client_subscriptions(status);
CREATE INDEX idx_client_sub_end_date ON client_subscriptions(end_date);
CREATE INDEX idx_client_sub_sales_rep ON client_subscriptions(sales_rep_id);
CREATE INDEX idx_client_sub_deal ON client_subscriptions(deal_id);

-- Composite index for expiring subscriptions
CREATE INDEX idx_client_sub_expiring ON client_subscriptions(status, end_date)
    WHERE status IN ('ACTIVE', 'TRIAL');

-- ============================================
-- 5. Client Invoice Sequences
-- ============================================

CREATE TABLE client_invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_year INT NOT NULL,
    current_sequence BIGINT NOT NULL DEFAULT 0
);

-- Insert initial sequence
INSERT INTO client_invoice_sequences (id, current_year, current_sequence)
VALUES ('00000000-0000-0000-0000-000000000002', EXTRACT(YEAR FROM CURRENT_DATE)::INT, 0);

-- ============================================
-- 6. Client Invoices (B2B Invoicing)
-- ============================================

CREATE TABLE client_invoices (
    id UUID PRIMARY KEY,

    -- Invoice identification
    invoice_number VARCHAR(50) NOT NULL,

    -- References
    organization_id UUID NOT NULL,
    client_subscription_id UUID,

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    -- Dates
    issue_date DATE,
    due_date DATE,
    paid_date DATE,
    billing_period_start DATE,
    billing_period_end DATE,

    -- Monetary amounts
    subtotal_amount DECIMAL(10, 2) NOT NULL,
    subtotal_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    vat_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    total_amount DECIMAL(10, 2) NOT NULL,
    total_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    paid_amount DECIMAL(10, 2),
    paid_currency VARCHAR(3),

    -- Notes (localized)
    notes_en TEXT,
    notes_ar TEXT,

    -- Payment info
    payment_method VARCHAR(30),
    payment_reference VARCHAR(255),

    -- Sales attribution
    sales_rep_id UUID,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT uq_client_invoices_number UNIQUE (invoice_number),
    CONSTRAINT fk_client_inv_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_client_inv_sub FOREIGN KEY (client_subscription_id) REFERENCES client_subscriptions(id)
);

CREATE INDEX idx_client_inv_org ON client_invoices(organization_id);
CREATE INDEX idx_client_inv_sub ON client_invoices(client_subscription_id);
CREATE INDEX idx_client_inv_status ON client_invoices(status);
CREATE INDEX idx_client_inv_issue_date ON client_invoices(issue_date);
CREATE INDEX idx_client_inv_due_date ON client_invoices(due_date);
CREATE INDEX idx_client_inv_number ON client_invoices(invoice_number);
CREATE INDEX idx_client_inv_sales_rep ON client_invoices(sales_rep_id);

-- Composite index for overdue invoice queries
CREATE INDEX idx_client_inv_overdue ON client_invoices(status, due_date)
    WHERE status = 'ISSUED';

-- ============================================
-- 7. Client Invoice Line Items
-- ============================================

CREATE TABLE client_invoice_line_items (
    invoice_id UUID NOT NULL,
    line_item_id UUID NOT NULL,

    -- Description (localized)
    line_description_en VARCHAR(500) NOT NULL,
    line_description_ar VARCHAR(500),

    -- Quantities and pricing
    line_quantity INT NOT NULL DEFAULT 1,
    line_unit_price DECIMAL(10, 2) NOT NULL,
    line_unit_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',

    -- Item type and ordering
    line_item_type VARCHAR(30) NOT NULL DEFAULT 'SUBSCRIPTION',
    line_sort_order INT NOT NULL DEFAULT 0,

    PRIMARY KEY (invoice_id, line_item_id),
    CONSTRAINT fk_client_line_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES client_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_client_line_items_invoice ON client_invoice_line_items(invoice_id);

-- ============================================
-- 8. Deals (Sales Pipeline)
-- ============================================

CREATE TABLE deals (
    id UUID PRIMARY KEY,

    -- Deal title (localized)
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),

    -- Status and source
    status VARCHAR(30) NOT NULL DEFAULT 'LEAD',
    source VARCHAR(30) NOT NULL DEFAULT 'WEBSITE',

    -- Contact information
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    company_name VARCHAR(255),

    -- Deal value
    estimated_value_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estimated_value_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    probability INT NOT NULL DEFAULT 0,

    -- Target dates
    expected_close_date DATE,
    actual_close_date DATE,

    -- Plan interest
    interested_plan_id UUID,

    -- Sales attribution
    sales_rep_id UUID NOT NULL,

    -- Conversion tracking
    converted_organization_id UUID,
    converted_subscription_id UUID,

    -- Notes (localized)
    notes_en TEXT,
    notes_ar TEXT,

    -- Lost reason (if status = LOST)
    lost_reason_en TEXT,
    lost_reason_ar TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_deals_plan FOREIGN KEY (interested_plan_id) REFERENCES client_plans(id),
    CONSTRAINT fk_deals_conv_org FOREIGN KEY (converted_organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_deals_conv_sub FOREIGN KEY (converted_subscription_id) REFERENCES client_subscriptions(id)
);

CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_source ON deals(source);
CREATE INDEX idx_deals_sales_rep ON deals(sales_rep_id);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);
CREATE INDEX idx_deals_contact_email ON deals(contact_email);
CREATE INDEX idx_deals_company ON deals(company_name);
CREATE INDEX idx_deals_conv_org ON deals(converted_organization_id);

-- Composite index for active deals by sales rep
CREATE INDEX idx_deals_active_sales_rep ON deals(sales_rep_id, status)
    WHERE status NOT IN ('WON', 'LOST');

-- ============================================
-- 9. Add foreign key for sales_rep_id
-- ============================================

-- Add FK for sales rep after deals table is created (avoids circular dependency)
ALTER TABLE client_subscriptions
    ADD CONSTRAINT fk_client_sub_sales_rep FOREIGN KEY (sales_rep_id) REFERENCES users(id);

ALTER TABLE client_invoices
    ADD CONSTRAINT fk_client_inv_sales_rep FOREIGN KEY (sales_rep_id) REFERENCES users(id);

ALTER TABLE deals
    ADD CONSTRAINT fk_deals_sales_rep FOREIGN KEY (sales_rep_id) REFERENCES users(id);

-- ============================================
-- 10. Insert default client plans
-- ============================================

INSERT INTO client_plans (
    id, name_en, name_ar, description_en, description_ar,
    monthly_price_amount, monthly_price_currency,
    annual_price_amount, annual_price_currency,
    billing_cycle, max_clubs, max_locations_per_club, max_members, max_staff_users,
    has_advanced_reporting, has_api_access, has_priority_support,
    has_white_labeling, has_custom_integrations,
    is_active, sort_order
) VALUES
-- Starter Plan
(
    'a0000000-0000-0000-0000-000000000001',
    'Starter', 'المبتدئ',
    'Perfect for small fitness studios starting their journey',
    'مثالي لاستوديوهات اللياقة الصغيرة التي تبدأ رحلتها',
    499.00, 'SAR', 4990.00, 'SAR',
    'MONTHLY', 1, 1, 100, 3,
    FALSE, FALSE, FALSE, FALSE, FALSE,
    TRUE, 1
),
-- Pro Plan
(
    'a0000000-0000-0000-0000-000000000002',
    'Pro', 'المحترف',
    'For growing gyms that need more features and capacity',
    'للصالات الرياضية النامية التي تحتاج المزيد من الميزات والسعة',
    999.00, 'SAR', 9990.00, 'SAR',
    'MONTHLY', 3, 2, 500, 10,
    TRUE, FALSE, TRUE, FALSE, FALSE,
    TRUE, 2
),
-- Enterprise Plan
(
    'a0000000-0000-0000-0000-000000000003',
    'Enterprise', 'المؤسسي',
    'Full-featured solution for large fitness chains',
    'حل متكامل لسلاسل اللياقة البدنية الكبيرة',
    2499.00, 'SAR', 24990.00, 'SAR',
    'MONTHLY', 10, 5, 2000, 50,
    TRUE, TRUE, TRUE, TRUE, TRUE,
    TRUE, 3
);
