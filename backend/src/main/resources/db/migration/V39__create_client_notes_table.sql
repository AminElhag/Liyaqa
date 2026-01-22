-- =============================================
-- V39: Create client notes table
-- Client notes for platform admin to track
-- business details, troubleshooting info, and
-- client relationship management.
-- =============================================

CREATE TABLE client_notes (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    content_en TEXT NOT NULL,
    content_ar TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_id UUID NOT NULL,
    created_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_client_notes_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_client_notes_created_by FOREIGN KEY (created_by_id) REFERENCES platform_users(id)
);

-- Indexes for efficient queries
CREATE INDEX idx_client_notes_org ON client_notes(organization_id);
CREATE INDEX idx_client_notes_category ON client_notes(category);
CREATE INDEX idx_client_notes_pinned ON client_notes(is_pinned DESC);
CREATE INDEX idx_client_notes_created_at ON client_notes(created_at DESC);
CREATE INDEX idx_client_notes_created_by ON client_notes(created_by_id);

-- Composite index for common query pattern (organization + sorting)
CREATE INDEX idx_client_notes_org_created ON client_notes(organization_id, created_at DESC);
