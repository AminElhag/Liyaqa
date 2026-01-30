-- Create trainer_notifications table for notification queue and delivery tracking
-- This table manages all notifications sent to trainers (push, email, SMS)

CREATE TABLE trainer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    message_en TEXT,
    message_ar TEXT,
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    send_push BOOLEAN NOT NULL DEFAULT false,
    send_email BOOLEAN NOT NULL DEFAULT false,
    send_sms BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP,
    action_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_trainer_notif_type CHECK (notification_type IN (
        'PT_REQUEST',
        'PT_ACCEPTED',
        'PT_DECLINED',
        'PT_CANCELLED',
        'PT_REMINDER',
        'BOOKING_CANCELLED',
        'CLASS_REMINDER',
        'CLASS_ASSIGNED',
        'SUBSTITUTE_REQUEST',
        'SUBSTITUTE_ACCEPTED',
        'SUBSTITUTE_DECLINED',
        'EARNINGS_APPROVED',
        'EARNINGS_PAID',
        'MESSAGE',
        'TIME_BLOCK_APPROVED',
        'TIME_BLOCK_REJECTED',
        'CERTIFICATION_EXPIRING',
        'PROFILE_INCOMPLETE',
        'SCHEDULE_CONFLICT',
        'SYSTEM'
    )),
    CONSTRAINT chk_trainer_notif_read CHECK (
        (NOT is_read AND read_at IS NULL) OR
        (is_read AND read_at IS NOT NULL)
    )
);

-- Add foreign key constraints
ALTER TABLE trainer_notifications
    ADD CONSTRAINT fk_trainer_notif_trainer
    FOREIGN KEY (trainer_id)
    REFERENCES trainers(id)
    ON DELETE CASCADE;

ALTER TABLE trainer_notifications
    ADD CONSTRAINT fk_trainer_notif_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

-- Create indexes for efficient queries
CREATE INDEX idx_trainer_notif_trainer_read ON trainer_notifications(trainer_id, is_read);
CREATE INDEX idx_trainer_notif_trainer_created ON trainer_notifications(trainer_id, created_at DESC);
CREATE INDEX idx_trainer_notif_unread ON trainer_notifications(trainer_id) WHERE is_read = false;
CREATE INDEX idx_trainer_notif_created ON trainer_notifications(created_at DESC);
CREATE INDEX idx_trainer_notif_tenant ON trainer_notifications(tenant_id);
CREATE INDEX idx_trainer_notif_org ON trainer_notifications(organization_id);
CREATE INDEX idx_trainer_notif_type ON trainer_notifications(notification_type);
CREATE INDEX idx_trainer_notif_entity ON trainer_notifications(related_entity_id) WHERE related_entity_id IS NOT NULL;
CREATE INDEX idx_trainer_notif_pending_delivery ON trainer_notifications(created_at)
    WHERE sent_at IS NULL AND (send_push = true OR send_email = true OR send_sms = true);

-- Add comments for documentation
COMMENT ON TABLE trainer_notifications IS 'Queue and tracking for all trainer notifications';
COMMENT ON COLUMN trainer_notifications.notification_type IS 'Type of notification for categorization and filtering';
COMMENT ON COLUMN trainer_notifications.related_entity_id IS 'ID of related entity (PT session, class session, earnings, etc.)';
COMMENT ON COLUMN trainer_notifications.action_url IS 'Deep link or URL to navigate to when notification is clicked';
COMMENT ON COLUMN trainer_notifications.send_push IS 'Send push notification (mobile/web)';
COMMENT ON COLUMN trainer_notifications.send_email IS 'Send email notification';
COMMENT ON COLUMN trainer_notifications.send_sms IS 'Send SMS notification';
COMMENT ON COLUMN trainer_notifications.sent_at IS 'Timestamp when notification was successfully delivered';
