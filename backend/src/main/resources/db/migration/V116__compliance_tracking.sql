-- V116: Compliance tracking tables for tenant contracts, ZATCA submissions, and data export requests

CREATE TABLE tenant_contracts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT false,
    document_url VARCHAR(1000),
    signed_at TIMESTAMPTZ,
    signed_by UUID,
    terms JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_tenant_contracts_tenant_id ON tenant_contracts(tenant_id);
CREATE INDEX idx_tenant_contracts_status ON tenant_contracts(status);
CREATE INDEX idx_tenant_contracts_end_date ON tenant_contracts(end_date);
CREATE INDEX idx_tenant_contracts_type ON tenant_contracts(type);

CREATE TABLE zatca_submissions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMPTZ,
    response_code VARCHAR(50),
    response_message TEXT,
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    zatca_hash VARCHAR(256),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_zatca_submissions_tenant_id ON zatca_submissions(tenant_id);
CREATE INDEX idx_zatca_submissions_invoice_id ON zatca_submissions(invoice_id);
CREATE INDEX idx_zatca_submissions_status ON zatca_submissions(status);

CREATE TABLE data_export_requests (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    requester_name VARCHAR(200) NOT NULL,
    requester_email VARCHAR(200) NOT NULL,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejected_by UUID,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    completed_at TIMESTAMPTZ,
    export_job_id UUID,
    file_url VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_data_export_requests_tenant_id ON data_export_requests(tenant_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);
