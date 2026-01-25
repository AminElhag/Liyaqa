-- Enhanced Reporting Suite Tables
-- Supports scheduled reports and report generation history

-- Scheduled report configurations
CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    report_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    recipients TEXT NOT NULL,
    filters TEXT,
    format VARCHAR(10) NOT NULL DEFAULT 'PDF',
    next_run_at TIMESTAMPTZ NOT NULL,
    last_run_at TIMESTAMPTZ,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_scheduled_reports_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_scheduled_reports_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Report generation history
CREATE TABLE report_history (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    scheduled_report_id UUID,
    report_type VARCHAR(50) NOT NULL,
    parameters TEXT NOT NULL,
    file_url TEXT,
    file_size BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    generated_by UUID,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_report_history_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_history_scheduled FOREIGN KEY (scheduled_report_id) REFERENCES scheduled_reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_history_generated_by FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_scheduled_reports_tenant ON scheduled_reports(tenant_id);
CREATE INDEX idx_scheduled_reports_enabled ON scheduled_reports(tenant_id, enabled);
CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE enabled = true;
CREATE INDEX idx_scheduled_reports_type ON scheduled_reports(tenant_id, report_type);

CREATE INDEX idx_report_history_tenant ON report_history(tenant_id);
CREATE INDEX idx_report_history_scheduled ON report_history(scheduled_report_id);
CREATE INDEX idx_report_history_type ON report_history(tenant_id, report_type);
CREATE INDEX idx_report_history_status ON report_history(tenant_id, status);
CREATE INDEX idx_report_history_created ON report_history(tenant_id, created_at DESC);

-- Comments
COMMENT ON TABLE scheduled_reports IS 'Scheduled report configurations for automated delivery';
COMMENT ON TABLE report_history IS 'History of generated reports (manual and scheduled)';
COMMENT ON COLUMN scheduled_reports.frequency IS 'DAILY, WEEKLY, MONTHLY';
COMMENT ON COLUMN scheduled_reports.recipients IS 'JSON array of email addresses';
COMMENT ON COLUMN scheduled_reports.filters IS 'JSON object with report-specific filters';
COMMENT ON COLUMN report_history.status IS 'PENDING, PROCESSING, COMPLETED, FAILED';
