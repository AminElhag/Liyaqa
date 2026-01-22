-- ==========================================
-- V21: AGREEMENTS SYSTEM + MEMBER HEALTH INFO
-- ==========================================

-- ==========================================
-- 1. AGREEMENTS SYSTEM
-- ==========================================

-- Agreement templates (club-configurable)
CREATE TABLE agreements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    content_en TEXT NOT NULL,
    content_ar TEXT,
    agreement_type VARCHAR(30) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    agreement_version INTEGER DEFAULT 1,
    effective_date DATE DEFAULT CURRENT_DATE,
    sort_order INTEGER DEFAULT 0,
    has_health_questions BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agreement_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_agreements_tenant ON agreements(tenant_id);
CREATE INDEX idx_agreements_type ON agreements(agreement_type);
CREATE INDEX idx_agreements_active ON agreements(is_active);

-- Member signed agreements
CREATE TABLE member_agreements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    agreement_id UUID NOT NULL REFERENCES agreements(id),
    agreement_version INTEGER NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    signature_data TEXT,
    health_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_member_agreement_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_member_agreements_member ON member_agreements(member_id);
CREATE INDEX idx_member_agreements_agreement ON member_agreements(agreement_id);
CREATE UNIQUE INDEX idx_member_agreements_unique ON member_agreements(member_id, agreement_id);

-- ==========================================
-- 2. MEMBER HEALTH INFO
-- ==========================================

CREATE TABLE member_health_info (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

    -- PAR-Q Questions (7 core questions)
    has_heart_condition BOOLEAN DEFAULT FALSE,
    has_chest_pain_activity BOOLEAN DEFAULT FALSE,
    has_chest_pain_rest BOOLEAN DEFAULT FALSE,
    has_dizziness BOOLEAN DEFAULT FALSE,
    has_bone_joint_problem BOOLEAN DEFAULT FALSE,
    takes_blood_pressure_meds BOOLEAN DEFAULT FALSE,
    has_other_reason BOOLEAN DEFAULT FALSE,

    -- Health Details
    medical_conditions TEXT,
    allergies TEXT,
    current_medications TEXT,
    injuries_limitations TEXT,
    blood_type VARCHAR(20),
    emergency_medical_notes TEXT,

    -- Medical Clearance
    requires_medical_clearance BOOLEAN DEFAULT FALSE,
    medical_clearance_date DATE,
    doctor_name VARCHAR(255),
    doctor_phone VARCHAR(50),

    health_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_health_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_member_health_member ON member_health_info(member_id);
CREATE UNIQUE INDEX idx_member_health_unique ON member_health_info(member_id);

-- ==========================================
-- 3. MEMBER ENHANCEMENTS
-- ==========================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE members ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS registration_notes TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'EN';
