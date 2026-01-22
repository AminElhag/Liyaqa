-- Performance indexes for common query patterns
-- V10: Add indexes for frequently queried columns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Members table indexes
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_tenant_email ON members(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_tenant_status ON members(tenant_id, status);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_end_date ON subscriptions(status, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);

-- Class sessions table indexes
CREATE INDEX IF NOT EXISTS idx_class_sessions_gym_class_id ON class_sessions(gym_class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_session_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_tenant_date ON class_sessions(tenant_id, session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_location_date ON class_sessions(location_id, session_date);

-- Class bookings table indexes
CREATE INDEX IF NOT EXISTS idx_class_bookings_session_id ON class_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_member_id ON class_bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_status ON class_bookings(status);
CREATE INDEX IF NOT EXISTS idx_class_bookings_session_member ON class_bookings(session_id, member_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_session_status ON class_bookings(session_id, status);

-- Attendance records table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_member_id ON attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_check_in_time ON attendance_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_date ON attendance_records(tenant_id, check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_records_location_date ON attendance_records(location_id, check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_notifications_member_status ON notifications(member_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Gym classes table indexes
CREATE INDEX IF NOT EXISTS idx_gym_classes_location_id ON gym_classes(location_id);
CREATE INDEX IF NOT EXISTS idx_gym_classes_status ON gym_classes(status);
CREATE INDEX IF NOT EXISTS idx_gym_classes_tenant_status ON gym_classes(tenant_id, status);

-- Organizations table indexes
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Clubs table indexes
CREATE INDEX IF NOT EXISTS idx_clubs_organization_id ON clubs(organization_id);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(status);

-- Locations table indexes
CREATE INDEX IF NOT EXISTS idx_locations_club_id ON locations(club_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_tenant_status ON locations(tenant_id, status);

-- Refresh tokens table indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Password reset tokens table indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Unique constraints for data integrity (if not already defined)
-- Note: These may fail if constraints already exist; they're defined here for completeness
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_members_email_tenant ON members(email, tenant_id);
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_number ON invoices(invoice_number);
