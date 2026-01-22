-- Notification tables for email and SMS notifications

-- Notification preferences table (member notification settings)
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL UNIQUE,

    -- Channel preferences
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Subscription notifications
    subscription_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    subscription_reminder_days INT NOT NULL DEFAULT 7,

    -- Invoice notifications
    invoice_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Class booking notifications
    class_booking_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    class_reminder_24h_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    class_reminder_1h_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Marketing/promotional
    marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Language preference (en or ar)
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en',

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_notification_preferences_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_notification_preferences_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Notifications table (individual notification records)
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,

    -- Notification type and channel
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,

    -- Content (bilingual)
    subject_en VARCHAR(500),
    subject_ar VARCHAR(500),
    body_en TEXT NOT NULL,
    body_ar TEXT,

    -- Status and priority
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',

    -- Recipient info
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),

    -- Timing
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_at TIMESTAMP,

    -- Failure handling
    failure_reason TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,

    -- Reference to related entity (subscription, invoice, booking, etc.)
    reference_id UUID,
    reference_type VARCHAR(50),

    -- External provider ID (e.g., Twilio message SID)
    external_id VARCHAR(255),

    -- Additional metadata (JSON)
    metadata TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_notifications_member FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Indexes for notification_preferences
CREATE INDEX idx_notification_preferences_tenant_id ON notification_preferences(tenant_id);
CREATE INDEX idx_notification_preferences_member_id ON notification_preferences(member_id);

-- Indexes for notifications
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_reference ON notifications(reference_id, reference_type);

-- Composite indexes for common queries
CREATE INDEX idx_notifications_member_status ON notifications(member_id, status);
CREATE INDEX idx_notifications_pending_due ON notifications(status, scheduled_at)
    WHERE status = 'PENDING';
CREATE INDEX idx_notifications_failed_retryable ON notifications(status, retry_count, max_retries)
    WHERE status = 'FAILED';

-- Index for unread count query
CREATE INDEX idx_notifications_unread ON notifications(member_id, status)
    WHERE status IN ('SENT', 'DELIVERED');
