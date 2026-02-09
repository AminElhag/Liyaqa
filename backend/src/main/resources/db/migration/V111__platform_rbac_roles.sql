-- Platform RBAC: Rename existing roles to new names
UPDATE platform_users SET role = 'PLATFORM_SUPER_ADMIN' WHERE role = 'PLATFORM_ADMIN';
UPDATE platform_users SET role = 'ACCOUNT_MANAGER' WHERE role = 'SALES_REP';
UPDATE platform_users SET role = 'SUPPORT_AGENT' WHERE role = 'SUPPORT_REP';

-- Create platform_refresh_tokens table (platform users currently share refresh_tokens which FKs to users)
CREATE TABLE platform_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    absolute_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info VARCHAR(500),
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_platform_refresh_tokens_user ON platform_refresh_tokens(user_id);
CREATE INDEX idx_platform_refresh_tokens_hash ON platform_refresh_tokens(token_hash);
