-- Marketing Automation Module
-- V46: Create marketing campaigns, segments, enrollments, and tracking tables

-- =============================================
-- Marketing Segments (Dynamic/Static member groups)
-- =============================================
CREATE TABLE marketing_segments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    segment_type VARCHAR(20) NOT NULL, -- DYNAMIC, STATIC
    criteria JSONB, -- JSON criteria for dynamic segments
    member_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_marketing_segments_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_marketing_segments_tenant ON marketing_segments(tenant_id);
CREATE INDEX idx_marketing_segments_active ON marketing_segments(tenant_id, is_active);
CREATE INDEX idx_marketing_segments_type ON marketing_segments(tenant_id, segment_type);

-- =============================================
-- Marketing Segment Members (Static segment membership)
-- =============================================
CREATE TABLE marketing_segment_members (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    segment_id UUID NOT NULL,
    member_id UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_segment_members_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_segment_members_segment FOREIGN KEY (segment_id) REFERENCES marketing_segments(id) ON DELETE CASCADE,
    CONSTRAINT fk_segment_members_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT uq_segment_member UNIQUE (segment_id, member_id)
);

CREATE INDEX idx_segment_members_tenant ON marketing_segment_members(tenant_id);
CREATE INDEX idx_segment_members_segment ON marketing_segment_members(segment_id);
CREATE INDEX idx_segment_members_member ON marketing_segment_members(member_id);

-- =============================================
-- Marketing Campaigns
-- =============================================
CREATE TABLE marketing_campaigns (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL, -- WELCOME_SEQUENCE, EXPIRY_REMINDER, WIN_BACK, BIRTHDAY, INACTIVITY_ALERT, PAYMENT_FOLLOWUP, CUSTOM
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED
    trigger_type VARCHAR(50) NOT NULL, -- MEMBER_CREATED, DAYS_BEFORE_EXPIRY, DAYS_AFTER_EXPIRY, BIRTHDAY, DAYS_INACTIVE, PAYMENT_FAILED, MANUAL
    trigger_config JSONB, -- Configuration for trigger (e.g., {"days": 7} for expiry reminders)
    segment_id UUID, -- Optional target segment
    start_date DATE,
    end_date DATE,
    total_enrolled INT NOT NULL DEFAULT 0,
    total_completed INT NOT NULL DEFAULT 0,
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_marketing_campaigns_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_marketing_campaigns_segment FOREIGN KEY (segment_id) REFERENCES marketing_segments(id) ON DELETE SET NULL
);

CREATE INDEX idx_marketing_campaigns_tenant ON marketing_campaigns(tenant_id);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(tenant_id, status);
CREATE INDEX idx_marketing_campaigns_type ON marketing_campaigns(tenant_id, campaign_type);
CREATE INDEX idx_marketing_campaigns_trigger ON marketing_campaigns(tenant_id, trigger_type, status);
CREATE INDEX idx_marketing_campaigns_active ON marketing_campaigns(tenant_id, status, start_date, end_date)
    WHERE status = 'ACTIVE';

-- =============================================
-- Marketing Campaign Steps (Multi-step sequences with A/B variants)
-- =============================================
CREATE TABLE marketing_campaign_steps (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    step_number INT NOT NULL, -- Order in sequence (1, 2, 3...)
    name VARCHAR(255) NOT NULL,
    delay_days INT NOT NULL DEFAULT 0, -- Days after enrollment/previous step
    delay_hours INT NOT NULL DEFAULT 0, -- Hours after enrollment/previous step
    channel VARCHAR(20) NOT NULL, -- EMAIL, SMS, WHATSAPP, PUSH
    subject_en VARCHAR(500), -- Email subject (English)
    subject_ar VARCHAR(500), -- Email subject (Arabic)
    body_en TEXT NOT NULL, -- Message body (English)
    body_ar TEXT NOT NULL, -- Message body (Arabic)
    is_ab_test BOOLEAN NOT NULL DEFAULT FALSE,
    ab_variant CHAR(1), -- 'A' or 'B' for A/B test variants
    ab_split_percentage INT, -- Percentage for this variant (e.g., 50)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_campaign_steps_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_steps_campaign FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT chk_ab_variant CHECK (ab_variant IS NULL OR ab_variant IN ('A', 'B'))
);

CREATE INDEX idx_campaign_steps_tenant ON marketing_campaign_steps(tenant_id);
CREATE INDEX idx_campaign_steps_campaign ON marketing_campaign_steps(campaign_id);
CREATE INDEX idx_campaign_steps_order ON marketing_campaign_steps(campaign_id, step_number);
CREATE INDEX idx_campaign_steps_active ON marketing_campaign_steps(campaign_id, is_active, step_number);

-- =============================================
-- Marketing Campaign Enrollments (Member enrollment tracking)
-- =============================================
CREATE TABLE marketing_campaign_enrollments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    member_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED, UNSUBSCRIBED
    current_step INT NOT NULL DEFAULT 0, -- Current step (0 = not started)
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    next_step_due_at TIMESTAMP WITH TIME ZONE, -- When next step should execute
    trigger_reference_id UUID, -- Reference to what triggered enrollment (e.g., subscription ID)
    trigger_reference_type VARCHAR(50), -- Type of reference (e.g., 'subscription')
    ab_group CHAR(1), -- Which A/B group member is in
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_enrollments_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_campaign FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT chk_enrollment_ab_group CHECK (ab_group IS NULL OR ab_group IN ('A', 'B'))
);

CREATE INDEX idx_enrollments_tenant ON marketing_campaign_enrollments(tenant_id);
CREATE INDEX idx_enrollments_campaign ON marketing_campaign_enrollments(campaign_id);
CREATE INDEX idx_enrollments_member ON marketing_campaign_enrollments(member_id);
CREATE INDEX idx_enrollments_status ON marketing_campaign_enrollments(tenant_id, status);
CREATE INDEX idx_enrollments_next_step ON marketing_campaign_enrollments(tenant_id, status, next_step_due_at)
    WHERE status = 'ACTIVE' AND next_step_due_at IS NOT NULL;
CREATE INDEX idx_enrollments_campaign_member ON marketing_campaign_enrollments(campaign_id, member_id);

-- =============================================
-- Marketing Message Logs (Delivery tracking)
-- =============================================
CREATE TABLE marketing_message_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    step_id UUID NOT NULL,
    enrollment_id UUID NOT NULL,
    member_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, FAILED, BOUNCED
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    external_message_id VARCHAR(255), -- ID from email/SMS provider
    notification_id UUID, -- Reference to notification table
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_message_logs_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_logs_campaign FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_logs_step FOREIGN KEY (step_id) REFERENCES marketing_campaign_steps(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_logs_enrollment FOREIGN KEY (enrollment_id) REFERENCES marketing_campaign_enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_logs_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_message_logs_tenant ON marketing_message_logs(tenant_id);
CREATE INDEX idx_message_logs_campaign ON marketing_message_logs(campaign_id);
CREATE INDEX idx_message_logs_step ON marketing_message_logs(step_id);
CREATE INDEX idx_message_logs_enrollment ON marketing_message_logs(enrollment_id);
CREATE INDEX idx_message_logs_member ON marketing_message_logs(member_id);
CREATE INDEX idx_message_logs_status ON marketing_message_logs(tenant_id, status);
CREATE INDEX idx_message_logs_sent ON marketing_message_logs(tenant_id, sent_at DESC);

-- =============================================
-- Marketing Tracking Pixels (Email open/click tracking)
-- =============================================
CREATE TABLE marketing_tracking_pixels (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    message_log_id UUID NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE, -- Unique token for tracking URL
    tracking_type VARCHAR(20) NOT NULL, -- OPEN, CLICK
    target_url TEXT, -- Original URL for click tracking
    triggered_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_tracking_pixels_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_tracking_pixels_message_log FOREIGN KEY (message_log_id) REFERENCES marketing_message_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_tracking_pixels_tenant ON marketing_tracking_pixels(tenant_id);
CREATE INDEX idx_tracking_pixels_token ON marketing_tracking_pixels(token);
CREATE INDEX idx_tracking_pixels_message ON marketing_tracking_pixels(message_log_id);
CREATE INDEX idx_tracking_pixels_type ON marketing_tracking_pixels(tenant_id, tracking_type);

-- =============================================
-- Add marketing notification types to enum
-- =============================================
-- (Handled in Kotlin enum, no DB change needed for PostgreSQL)

-- =============================================
-- Add marketing permissions
-- =============================================
INSERT INTO permissions (id, name, description, category, created_at, updated_at, version)
VALUES
    (gen_random_uuid(), 'marketing_campaigns_create', 'Create marketing campaigns', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_campaigns_read', 'View marketing campaigns', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_campaigns_update', 'Update marketing campaigns', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_campaigns_delete', 'Delete marketing campaigns', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_campaigns_activate', 'Activate/pause campaigns', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_segments_create', 'Create member segments', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_segments_read', 'View member segments', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_segments_update', 'Update member segments', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_segments_delete', 'Delete member segments', 'MARKETING', NOW(), NOW(), 0),
    (gen_random_uuid(), 'marketing_analytics_read', 'View marketing analytics', 'MARKETING', NOW(), NOW(), 0)
ON CONFLICT (name) DO NOTHING;

-- Grant marketing permissions to CLUB_ADMIN and SUPER_ADMIN roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('CLUB_ADMIN', 'SUPER_ADMIN')
AND p.name IN (
    'marketing_campaigns_create', 'marketing_campaigns_read', 'marketing_campaigns_update',
    'marketing_campaigns_delete', 'marketing_campaigns_activate',
    'marketing_segments_create', 'marketing_segments_read', 'marketing_segments_update',
    'marketing_segments_delete', 'marketing_analytics_read'
)
ON CONFLICT DO NOTHING;
