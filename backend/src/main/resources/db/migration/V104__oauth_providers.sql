-- OAuth Providers Table
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL,
    authorization_uri VARCHAR(500),
    token_uri VARCHAR(500),
    user_info_uri VARCHAR(500),
    scopes TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_provision BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    CONSTRAINT fk_oauth_providers_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_oauth_providers_org ON oauth_providers(organization_id);
CREATE INDEX idx_oauth_providers_enabled ON oauth_providers(organization_id, enabled);

-- Add OAuth fields to users table
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN oauth_provider_id VARCHAR(255);

CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id) 
    WHERE oauth_provider IS NOT NULL;

COMMENT ON TABLE oauth_providers IS 'OAuth 2.0 / OpenID Connect provider configurations per organization';
COMMENT ON COLUMN oauth_providers.provider IS 'Provider type: GOOGLE, MICROSOFT, OKTA, CUSTOM';
COMMENT ON COLUMN oauth_providers.client_secret IS 'OAuth client secret (should be encrypted at rest)';
COMMENT ON COLUMN oauth_providers.auto_provision IS 'Automatically create new users on first OAuth login';
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider name if user logged in via OAuth';
COMMENT ON COLUMN users.oauth_provider_id IS 'User ID from OAuth provider (sub claim)';
