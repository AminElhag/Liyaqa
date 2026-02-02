-- V108: Add member uniqueness constraints and performance indexes
-- This prevents race conditions on member creation and improves query performance

-- Add unique constraints to prevent duplicate members per tenant
ALTER TABLE members
    ADD CONSTRAINT uk_members_email_tenant
    UNIQUE (email, tenant_id);

ALTER TABLE members
    ADD CONSTRAINT uk_members_phone_tenant
    UNIQUE (phone, tenant_id)
    WHERE phone IS NOT NULL;

ALTER TABLE members
    ADD CONSTRAINT uk_members_national_id_tenant
    UNIQUE (national_id, tenant_id)
    WHERE national_id IS NOT NULL;

-- Performance indexes for frequently accessed queries

-- Members: Status and creation date filtering (for member lists, reports)
CREATE INDEX idx_members_status_created
    ON members(tenant_id, status, created_at);

-- Subscriptions: Member and status lookups (for member subscription queries)
CREATE INDEX idx_subscriptions_member_status
    ON subscriptions(member_id, status);

-- Class bookings: Member and session lookups (for booking validation)
CREATE INDEX idx_class_bookings_member_session
    ON class_bookings(member_id, session_id);

-- Class sessions: Date and status filtering (for class schedules, booking availability)
CREATE INDEX idx_class_sessions_date_status
    ON class_sessions(session_date, status);

-- Invoices: Status and due date filtering (for payment processing, overdue reports)
CREATE INDEX idx_invoices_status_due
    ON invoices(status, due_date);

-- Notifications: Recipient and status filtering (for notification delivery, user inbox)
CREATE INDEX idx_notifications_recipient_status
    ON notifications(recipient_id, status, created_at);

-- Comments for documentation
COMMENT ON CONSTRAINT uk_members_email_tenant ON members IS
    'Ensures email uniqueness per tenant - prevents duplicate member registrations';

COMMENT ON CONSTRAINT uk_members_phone_tenant ON members IS
    'Ensures phone uniqueness per tenant when provided - prevents duplicate phone numbers';

COMMENT ON CONSTRAINT uk_members_national_id_tenant ON members IS
    'Ensures national ID uniqueness per tenant when provided - prevents duplicate government IDs';
