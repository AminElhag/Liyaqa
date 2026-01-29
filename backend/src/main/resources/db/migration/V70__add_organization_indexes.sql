-- Performance indexes for organizations table
-- Optimizes queries for client list page and stats aggregation

-- Index on status for filtering by organization status
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Index on created_at for sorting (descending for recent-first queries)
CREATE INDEX IF NOT EXISTS idx_organizations_created_at_desc ON organizations(created_at DESC);

-- Composite index for status filtering with date sorting
CREATE INDEX IF NOT EXISTS idx_organizations_status_created_at ON organizations(status, created_at DESC);
