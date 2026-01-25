-- Family & Corporate Accounts Tables
-- Enables grouping members under family or corporate accounts with shared billing/discounts

-- Family groups
CREATE TABLE family_groups (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    primary_member_id UUID NOT NULL,
    max_members INT NOT NULL DEFAULT 5,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    billing_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_family_groups_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_family_groups_primary_member FOREIGN KEY (primary_member_id) REFERENCES members(id)
);

-- Family group members
CREATE TABLE family_group_members (
    id UUID PRIMARY KEY,
    family_group_id UUID NOT NULL,
    member_id UUID NOT NULL,
    relationship VARCHAR(30) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (family_group_id, member_id),
    CONSTRAINT fk_family_members_group FOREIGN KEY (family_group_id) REFERENCES family_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_family_members_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Corporate accounts
CREATE TABLE corporate_accounts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    company_name_ar VARCHAR(200),
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    cr_number VARCHAR(50),
    vat_number VARCHAR(50),
    address TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    max_members INT,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    billing_type VARCHAR(20) NOT NULL DEFAULT 'INVOICE',
    payment_terms_days INT NOT NULL DEFAULT 30,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_corporate_accounts_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Corporate members
CREATE TABLE corporate_members (
    id UUID PRIMARY KEY,
    corporate_account_id UUID NOT NULL,
    member_id UUID NOT NULL,
    employee_id VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    UNIQUE (corporate_account_id, member_id),
    CONSTRAINT fk_corporate_members_account FOREIGN KEY (corporate_account_id) REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_corporate_members_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_family_groups_tenant ON family_groups(tenant_id);
CREATE INDEX idx_family_groups_primary ON family_groups(primary_member_id);
CREATE INDEX idx_family_groups_status ON family_groups(tenant_id, status);

CREATE INDEX idx_family_members_group ON family_group_members(family_group_id);
CREATE INDEX idx_family_members_member ON family_group_members(member_id);

CREATE INDEX idx_corporate_accounts_tenant ON corporate_accounts(tenant_id);
CREATE INDEX idx_corporate_accounts_status ON corporate_accounts(tenant_id, status);
CREATE INDEX idx_corporate_accounts_contract ON corporate_accounts(contract_end_date);

CREATE INDEX idx_corporate_members_account ON corporate_members(corporate_account_id);
CREATE INDEX idx_corporate_members_member ON corporate_members(member_id);
CREATE INDEX idx_corporate_members_status ON corporate_members(corporate_account_id, status);

-- Comments
COMMENT ON TABLE family_groups IS 'Groups members into family units for shared benefits';
COMMENT ON TABLE family_group_members IS 'Links members to their family groups';
COMMENT ON TABLE corporate_accounts IS 'Corporate/company accounts with contract terms';
COMMENT ON TABLE corporate_members IS 'Links members to their corporate accounts';
COMMENT ON COLUMN family_groups.billing_type IS 'INDIVIDUAL, CONSOLIDATED';
COMMENT ON COLUMN family_group_members.relationship IS 'PRIMARY, SPOUSE, CHILD, PARENT, SIBLING, OTHER';
COMMENT ON COLUMN corporate_accounts.billing_type IS 'INVOICE, PREPAID, PER_MEMBER';
COMMENT ON COLUMN corporate_members.status IS 'ACTIVE, SUSPENDED, TERMINATED';
