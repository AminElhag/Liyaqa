-- Platform user inbox notifications
CREATE TABLE platform_user_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id    UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    title_en        VARCHAR(255) NOT NULL,
    title_ar        VARCHAR(255),
    description_en  TEXT NOT NULL,
    description_ar  TEXT,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('INFO','SUCCESS','WARNING','ERROR','SYSTEM')),
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    link            VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_platform_user_notif_recipient ON platform_user_notifications(recipient_id);
CREATE INDEX idx_platform_user_notif_recipient_read ON platform_user_notifications(recipient_id, read);
CREATE INDEX idx_platform_user_notif_recipient_created ON platform_user_notifications(recipient_id, created_at DESC);
