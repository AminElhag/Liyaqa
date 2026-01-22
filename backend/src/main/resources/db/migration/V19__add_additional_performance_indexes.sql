-- V19: Additional performance indexes
-- Adds composite indexes for common query patterns not covered in V10

-- ============================================
-- Member query optimization
-- ============================================
-- For queries filtering by status and sorting by creation date
CREATE INDEX IF NOT EXISTS idx_members_status_created_at
    ON members(status, created_at DESC);

-- For active member count queries
CREATE INDEX IF NOT EXISTS idx_members_tenant_status_active
    ON members(tenant_id, status) WHERE status = 'ACTIVE';

-- ============================================
-- Subscription query optimization
-- ============================================
-- For member subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_status
    ON subscriptions(member_id, status);

-- For expiring subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_end_date
    ON subscriptions(end_date, status) WHERE status = 'ACTIVE';

-- ============================================
-- Booking query optimization
-- ============================================
-- For upcoming/past booking queries by member
CREATE INDEX IF NOT EXISTS idx_class_bookings_member_status_date
    ON class_bookings(member_id, status);

-- ============================================
-- Attendance query optimization
-- ============================================
-- For today's attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_check_in_date
    ON attendance_records(tenant_id, DATE(check_in_time));

-- ============================================
-- Notification query optimization
-- ============================================
-- For pending notification processing
CREATE INDEX IF NOT EXISTS idx_notifications_pending_scheduled
    ON notifications(scheduled_at, status) WHERE status = 'PENDING';

-- ============================================
-- Invoice organization scope (for multi-tenant invoice number uniqueness)
-- ============================================
-- Note: The global unique constraint on invoice_number (V6) is intentionally kept
-- for audit trail purposes. This additional index helps with org-scoped queries.
CREATE INDEX IF NOT EXISTS idx_invoices_org_invoice_number
    ON invoices(organization_id, invoice_number);

-- ============================================
-- Platform tables optimization
-- ============================================
-- Deal pipeline queries
CREATE INDEX IF NOT EXISTS idx_deals_stage_updated_at
    ON deals(stage, updated_at DESC);

-- Client subscription status queries
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_org_status
    ON client_subscriptions(organization_id, status);

-- Support ticket priority queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority
    ON support_tickets(status, priority);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_status
    ON support_tickets(assigned_to, status);
