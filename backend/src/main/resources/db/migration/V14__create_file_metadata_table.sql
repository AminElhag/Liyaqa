-- V14: Create file_metadata table for persistent file storage metadata
-- This replaces the in-memory ConcurrentHashMap storage

CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    reference_id UUID,
    storage_path VARCHAR(1000) NOT NULL,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_file_metadata_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_file_metadata_tenant_id ON file_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_reference_id ON file_metadata(reference_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_category ON file_metadata(category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_reference_category ON file_metadata(reference_id, category);

-- Comments for documentation
COMMENT ON TABLE file_metadata IS 'Stores metadata for uploaded files';
COMMENT ON COLUMN file_metadata.original_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN file_metadata.stored_name IS 'UUID-based filename used for storage';
COMMENT ON COLUMN file_metadata.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN file_metadata.file_size IS 'File size in bytes';
COMMENT ON COLUMN file_metadata.category IS 'File category: MEMBER_PROFILE, INVOICE_RECEIPT, DOCUMENT, CLUB_LOGO, CLASS_IMAGE, OTHER';
COMMENT ON COLUMN file_metadata.reference_id IS 'Optional reference to related entity (member, invoice, etc.)';
COMMENT ON COLUMN file_metadata.storage_path IS 'Full path to file on disk';
COMMENT ON COLUMN file_metadata.url IS 'Public URL for file access';
