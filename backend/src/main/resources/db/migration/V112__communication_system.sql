-- Communication System: Announcements, Templates, Notification Logs

CREATE TABLE announcements (
    id              UUID PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    content         TEXT NOT NULL,
    type            VARCHAR(50) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    target_audience VARCHAR(50) NOT NULL DEFAULT 'ALL',
    target_tenant_ids JSONB DEFAULT '[]',
    target_plan_tier VARCHAR(50),
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    published_at    TIMESTAMP WITH TIME ZONE,
    created_by      UUID NOT NULL,
    priority        INTEGER NOT NULL DEFAULT 3,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_scheduled_at ON announcements(scheduled_at) WHERE status = 'SCHEDULED';
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

CREATE TABLE communication_templates (
    id          UUID PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    name_en     VARCHAR(200) NOT NULL,
    name_ar     VARCHAR(200),
    subject_en  TEXT NOT NULL,
    subject_ar  TEXT,
    body_en     TEXT NOT NULL,
    body_ar     TEXT,
    channel     VARCHAR(50) NOT NULL DEFAULT 'EMAIL',
    variables   JSONB DEFAULT '[]',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    version     BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_communication_templates_code ON communication_templates(code);

CREATE TABLE notification_logs (
    id              UUID PRIMARY KEY,
    announcement_id UUID REFERENCES announcements(id),
    template_code   VARCHAR(100),
    tenant_id       UUID NOT NULL,
    channel         VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    subject         VARCHAR(500),
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    sent_at         TIMESTAMP WITH TIME ZONE,
    delivered_at    TIMESTAMP WITH TIME ZONE,
    failure_reason  TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_notification_logs_announcement_id ON notification_logs(announcement_id);
CREATE INDEX idx_notification_logs_tenant_id ON notification_logs(tenant_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
