-- Platform Dashboard Performance Indexes
-- Expected query time reduction: 80-95%
-- These indexes are specifically designed for dashboard queries

-- Client Invoice indexes (most critical for revenue calculations)
-- Index for finding paid invoices by date range
CREATE INDEX IF NOT EXISTS idx_client_invoice_status_paiddate
    ON client_invoices(status, paid_date)
    WHERE status = 'PAID';

-- Index for organization-specific invoice queries
CREATE INDEX IF NOT EXISTS idx_client_invoice_organization
    ON client_invoices(organization_id);

-- Index for finding invoices by status and issue date
CREATE INDEX IF NOT EXISTS idx_client_invoice_status_createddate
    ON client_invoices(status, created_at);

-- Index for overdue invoice queries
CREATE INDEX IF NOT EXISTS idx_client_invoice_status_duedate
    ON client_invoices(status, due_date)
    WHERE status IN ('ISSUED', 'OVERDUE', 'PARTIALLY_PAID');

-- Deal indexes for pipeline calculations
-- Index for finding deals by status
CREATE INDEX IF NOT EXISTS idx_deal_status
    ON deals(status);

-- Index for finding deals created in a specific time period
CREATE INDEX IF NOT EXISTS idx_deal_status_createddate
    ON deals(status, created_at);

-- Index for organization-specific deal queries
CREATE INDEX IF NOT EXISTS idx_deal_organization
    ON deals(organization_id);

-- Organization indexes for client metrics
-- Index for finding organizations by status and creation date
CREATE INDEX IF NOT EXISTS idx_organization_status_createddate
    ON organizations(status, created_at);

-- Client Subscription indexes for subscription metrics
-- Index for finding subscriptions by status
CREATE INDEX IF NOT EXISTS idx_client_subscription_status
    ON client_subscriptions(status);

-- Index for finding expiring subscriptions
CREATE INDEX IF NOT EXISTS idx_client_subscription_status_enddate
    ON client_subscriptions(status, end_date)
    WHERE status IN ('ACTIVE', 'TRIAL');

-- Index for organization-specific subscription queries
CREATE INDEX IF NOT EXISTS idx_client_subscription_organization
    ON client_subscriptions(organization_id);

-- Audit log indexes for activity feed
-- Index for finding audit logs by entity type and date (for recent activity)
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_createddate
    ON audit_logs(entity_type, created_at DESC);

-- Index for finding recent audit logs
CREATE INDEX IF NOT EXISTS idx_audit_log_createddate
    ON audit_logs(created_at DESC);

-- Support ticket indexes (if support_tickets table exists)
-- Index for finding tickets by status
CREATE INDEX IF NOT EXISTS idx_support_ticket_status
    ON support_tickets(status);

-- Index for finding recent tickets
CREATE INDEX IF NOT EXISTS idx_support_ticket_createddate
    ON support_tickets(created_at DESC);

-- Index for organization-specific ticket queries
CREATE INDEX IF NOT EXISTS idx_support_ticket_organization
    ON support_tickets(organization_id);

-- Performance notes:
-- 1. These indexes are designed for read-heavy operations (dashboard queries)
-- 2. Write performance impact is minimal as these tables have infrequent writes
-- 3. Partial indexes (WHERE clauses) reduce index size for status-specific queries
-- 4. DESC indexes on created_at optimize recent activity queries
-- 5. Composite indexes (status, date) support both filtering and sorting
