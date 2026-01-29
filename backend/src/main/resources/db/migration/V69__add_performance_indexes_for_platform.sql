-- ============================================
-- Performance Indexes for Platform Tables
-- Addresses slow page load times (38-47 seconds)
-- ============================================

-- Index on client_invoices.created_at for default sort order
-- The main list query sorts by created_at DESC, which requires a table scan without this index
CREATE INDEX IF NOT EXISTS idx_client_invoices_created_at_desc
ON client_invoices(created_at DESC);

-- Composite index for common filter + sort pattern
CREATE INDEX IF NOT EXISTS idx_client_invoices_status_created_at
ON client_invoices(status, created_at DESC);

-- Index for organization filtering with sort
CREATE INDEX IF NOT EXISTS idx_client_invoices_org_created_at
ON client_invoices(organization_id, created_at DESC);

-- Support tickets - created_at for default sort
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at_desc
ON support_tickets(created_at DESC);

-- Client subscriptions - for dashboard queries
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_org_status
ON client_subscriptions(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_client_subscriptions_created_at_desc
ON client_subscriptions(created_at DESC);

-- Platform users - for login and list queries
CREATE INDEX IF NOT EXISTS idx_platform_users_email_status
ON platform_users(email, status);

-- Deals - for pipeline views
CREATE INDEX IF NOT EXISTS idx_deals_stage_created_at
ON deals(stage, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deals_assigned_to_stage
ON deals(assigned_to_id, stage);
