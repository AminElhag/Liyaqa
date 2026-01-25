-- Webhook subscriptions for external integrations
CREATE TABLE webhooks (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2000) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    headers TEXT,
    rate_limit_per_minute INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Webhook delivery tracking with retry support
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_id UUID NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    last_response_code INT,
    last_response_body TEXT,
    last_error TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_tenant_active ON webhooks(tenant_id, is_active);
CREATE INDEX idx_webhook_deliveries_tenant_id ON webhook_deliveries(tenant_id);
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(status, next_retry_at);
CREATE INDEX idx_webhook_deliveries_event_id ON webhook_deliveries(event_id);

-- Insert webhook permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar) VALUES
(gen_random_uuid(), 'webhooks_view', 'webhooks', 'view', 'View Webhooks', 'عرض الويب هوك', 'View webhook subscriptions and delivery logs', 'عرض اشتراكات الويب هوك وسجلات التسليم'),
(gen_random_uuid(), 'webhooks_create', 'webhooks', 'create', 'Create Webhooks', 'إنشاء الويب هوك', 'Create new webhook subscriptions', 'إنشاء اشتراكات ويب هوك جديدة'),
(gen_random_uuid(), 'webhooks_edit', 'webhooks', 'edit', 'Edit Webhooks', 'تحرير الويب هوك', 'Edit webhook settings and test webhooks', 'تحرير إعدادات الويب هوك واختبارها'),
(gen_random_uuid(), 'webhooks_delete', 'webhooks', 'delete', 'Delete Webhooks', 'حذف الويب هوك', 'Delete webhook subscriptions', 'حذف اشتراكات الويب هوك');

-- Grant webhook permissions to ADMIN role by default
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'ADMIN', id FROM permissions WHERE code IN ('webhooks_view', 'webhooks_create', 'webhooks_edit', 'webhooks_delete');
