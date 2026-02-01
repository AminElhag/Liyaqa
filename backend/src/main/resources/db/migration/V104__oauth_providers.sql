-- Migration: OAuth 2.0 / OpenID Connect Support
-- Phase 3.1: OAuth/SSO Integration
-- Purpose: Enable enterprise SSO with Google, Microsoft, Okta, and custom OAuth providers

-- Create OAuth providers table
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY,
    organization_id UUID,
    provider VARCHAR(50) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL,
    authorization_uri VARCHAR(500),
    token_uri VARCHAR(500),
    user_info_uri VARCHAR(500),
    scopes TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_provision BOOLEAN NOT NULL DEFAULT FALSE,
    display_name VARCHAR(100),
    icon_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add OAuth fields to users table
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN oauth_provider_id VARCHAR(255);

-- Indexes for OAuth providers
CREATE INDEX idx_oauth_providers_org ON oauth_providers(organization_id);
CREATE INDEX idx_oauth_providers_enabled ON oauth_providers(organization_id, enabled) WHERE enabled = true;

-- Unique index for OAuth provider per organization
CREATE UNIQUE INDEX idx_oauth_providers_unique ON oauth_providers(organization_id, provider) 
    WHERE organization_id IS NOT NULL;

-- Index for finding users by OAuth credentials
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id) 
    WHERE oauth_provider IS NOT NULL;

-- Comments
COMMENT ON TABLE oauth_providers IS 'OAuth 2.0 / OpenID Connect provider configurations for enterprise SSO';
COMMENT ON COLUMN oauth_providers.organization_id IS 'Organization ID (null for platform-wide providers)';
COMMENT ON COLUMN oauth_providers.provider IS 'Provider type: GOOGLE, MICROSOFT, OKTA, GITHUB, CUSTOM';
COMMENT ON COLUMN oauth_providers.client_id IS 'OAuth client ID from provider';
COMMENT ON COLUMN oauth_providers.client_secret IS 'OAuth client secret (should be encrypted at rest)';
COMMENT ON COLUMN oauth_providers.authorization_uri IS 'Custom authorization endpoint (uses default if null)';
COMMENT ON COLUMN oauth_providers.token_uri IS 'Custom token endpoint (uses default if null)';
COMMENT ON COLUMN oauth_providers.user_info_uri IS 'Custom user info endpoint (uses default if null)';
COMMENT ON COLUMN oauth_providers.scopes IS 'JSON array of OAuth scopes (e.g., ["openid", "email", "profile"])';
COMMENT ON COLUMN oauth_providers.enabled IS 'Whether this provider is currently enabled';
COMMENT ON COLUMN oauth_providers.auto_provision IS 'Auto-create users on first OAuth login (vs. require existing account)';
COMMENT ON COLUMN oauth_providers.display_name IS 'Display name for login button (e.g., "Sign in with Company SSO")';
COMMENT ON COLUMN oauth_providers.icon_url IS 'URL to provider icon/logo for login button';

COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider name if user signed up via OAuth';
COMMENT ON COLUMN users.oauth_provider_id IS 'Unique user ID from OAuth provider';
