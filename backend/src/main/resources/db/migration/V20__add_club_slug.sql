-- Add slug column to clubs table for subdomain-based multi-tenancy
-- Slug format: 3-63 lowercase alphanumeric characters with hyphens (no leading/trailing/double hyphens)
-- Example: fitness-gym, downtown-club, acme-sports-123

-- Add nullable slug column first (to allow existing data)
ALTER TABLE clubs ADD COLUMN slug VARCHAR(63);

-- Create unique index on slug (only non-null values must be unique)
CREATE UNIQUE INDEX idx_clubs_slug ON clubs(slug) WHERE slug IS NOT NULL;

-- Add check constraint for slug format:
-- - Must be 3-63 characters
-- - Must start and end with alphanumeric
-- - Can contain lowercase letters, numbers, and single hyphens
-- - No consecutive hyphens allowed
ALTER TABLE clubs ADD CONSTRAINT chk_clubs_slug_format
    CHECK (
        slug IS NULL
        OR (
            LENGTH(slug) >= 3
            AND LENGTH(slug) <= 63
            AND slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
            AND slug NOT LIKE '%--'
        )
    );

-- Add comment for documentation
COMMENT ON COLUMN clubs.slug IS 'URL-friendly subdomain slug for tenant access (e.g., fitness-gym.liyaqa.com). Reserved slugs: api, www, admin, platform, app, mail, ftp, docs, help, support, status, blog, demo, staging, test, dev, login, register, auth, dashboard';
