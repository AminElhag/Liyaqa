-- Create trainer_certifications table to replace JSON storage
-- This table manages trainer certifications with expiry tracking and verification

CREATE TABLE trainer_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issued_date DATE,
    expiry_date DATE,
    certificate_number VARCHAR(100),
    certificate_file_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_trainer_cert_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    CONSTRAINT chk_trainer_cert_dates CHECK (
        expiry_date IS NULL OR
        issued_date IS NULL OR
        expiry_date >= issued_date
    ),
    CONSTRAINT chk_trainer_cert_verification CHECK (
        (NOT is_verified AND verified_by IS NULL AND verified_at IS NULL) OR
        (is_verified AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    )
);

-- Add foreign key constraints
ALTER TABLE trainer_certifications
    ADD CONSTRAINT fk_trainer_cert_trainer
    FOREIGN KEY (trainer_id)
    REFERENCES trainers(id)
    ON DELETE CASCADE;

ALTER TABLE trainer_certifications
    ADD CONSTRAINT fk_trainer_cert_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

ALTER TABLE trainer_certifications
    ADD CONSTRAINT fk_trainer_cert_verifier
    FOREIGN KEY (verified_by)
    REFERENCES users(id)
    ON DELETE SET NULL;

-- Create indexes for efficient queries
CREATE INDEX idx_trainer_cert_trainer_status ON trainer_certifications(trainer_id, status);
CREATE INDEX idx_trainer_cert_trainer ON trainer_certifications(trainer_id);
CREATE INDEX idx_trainer_cert_expiry ON trainer_certifications(expiry_date ASC NULLS LAST);
CREATE INDEX idx_trainer_cert_expiring_soon ON trainer_certifications(trainer_id, expiry_date)
    WHERE status = 'ACTIVE' AND expiry_date IS NOT NULL;
CREATE INDEX idx_trainer_cert_tenant ON trainer_certifications(tenant_id);
CREATE INDEX idx_trainer_cert_org ON trainer_certifications(organization_id);
CREATE INDEX idx_trainer_cert_status ON trainer_certifications(status);
CREATE INDEX idx_trainer_cert_unverified ON trainer_certifications(trainer_id)
    WHERE is_verified = false AND status = 'ACTIVE';
CREATE INDEX idx_trainer_cert_org_expiring ON trainer_certifications(organization_id, expiry_date)
    WHERE status = 'ACTIVE' AND expiry_date IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE trainer_certifications IS 'Manages trainer certifications with expiry tracking and verification';
COMMENT ON COLUMN trainer_certifications.status IS 'ACTIVE: Valid certification, EXPIRED: Past expiry date, REVOKED: Invalidated';
COMMENT ON COLUMN trainer_certifications.certificate_file_url IS 'S3 URL to uploaded certificate document (PDF, JPG, PNG)';
COMMENT ON COLUMN trainer_certifications.is_verified IS 'Whether admin has verified the certification authenticity';
COMMENT ON COLUMN trainer_certifications.verified_by IS 'User ID of admin who verified the certification';
