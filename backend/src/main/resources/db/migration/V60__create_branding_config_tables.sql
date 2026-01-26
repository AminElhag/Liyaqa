-- White-Label Branding Configuration
-- V60: Create branding_configs table for tenant-specific app branding

CREATE TABLE branding_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- App Identity
    app_name VARCHAR(100) NOT NULL DEFAULT 'Liyaqa',
    app_name_ar VARCHAR(100) DEFAULT 'لياقة',

    -- Colors (hex format)
    primary_color VARCHAR(7) NOT NULL DEFAULT '#1E3A5F',
    primary_dark_color VARCHAR(7) NOT NULL DEFAULT '#3D5A80',
    secondary_color VARCHAR(7) NOT NULL DEFAULT '#2E7D32',
    secondary_dark_color VARCHAR(7) NOT NULL DEFAULT '#4CAF50',
    accent_color VARCHAR(7) NOT NULL DEFAULT '#FFB300',

    -- Logos
    logo_light_url VARCHAR(500),
    logo_dark_url VARCHAR(500),

    -- Feature Flags
    feature_classes BOOLEAN DEFAULT true,
    feature_facilities BOOLEAN DEFAULT true,
    feature_loyalty BOOLEAN DEFAULT true,
    feature_wearables BOOLEAN DEFAULT true,
    feature_payments BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,

    CONSTRAINT fk_branding_configs_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Index for tenant lookup
CREATE INDEX idx_branding_configs_tenant ON branding_configs(tenant_id);

-- Add branding permissions
INSERT INTO permissions (id, name, description, category, created_at, updated_at, version)
VALUES
    (gen_random_uuid(), 'branding_read', 'View branding configuration', 'SETTINGS', NOW(), NOW(), 0),
    (gen_random_uuid(), 'branding_update', 'Update branding configuration', 'SETTINGS', NOW(), NOW(), 0)
ON CONFLICT (name) DO NOTHING;

-- Grant branding permissions to CLUB_ADMIN and SUPER_ADMIN roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('CLUB_ADMIN', 'SUPER_ADMIN')
AND p.name IN ('branding_read', 'branding_update')
ON CONFLICT DO NOTHING;
