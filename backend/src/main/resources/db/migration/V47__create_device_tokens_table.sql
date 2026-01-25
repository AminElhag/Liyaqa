-- Device tokens for push notifications (FCM/APNs)
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('ANDROID', 'IOS')),
    device_name VARCHAR(100),
    app_version VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    tenant_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT uq_device_token UNIQUE (token)
);

-- Indexes
CREATE INDEX idx_device_tokens_member ON device_tokens(member_id);
CREATE INDEX idx_device_tokens_tenant ON device_tokens(tenant_id);
CREATE INDEX idx_device_tokens_platform ON device_tokens(platform);
