-- Create trainers table (OrganizationAwareEntity pattern)
-- Trainers are service providers who can teach classes and provide personal training
CREATE TABLE trainers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,           -- Primary club
    organization_id UUID NOT NULL,     -- For cross-club visibility
    user_id UUID NOT NULL,

    -- Profile
    bio_en TEXT,
    bio_ar TEXT,
    profile_image_url VARCHAR(500),
    experience_years INT,

    -- Classification
    employment_type VARCHAR(50) NOT NULL DEFAULT 'INDEPENDENT_CONTRACTOR',
    trainer_type VARCHAR(50) NOT NULL DEFAULT 'GROUP_FITNESS',

    -- Qualifications (JSON)
    specializations TEXT,
    certifications TEXT,

    -- Availability for PT (JSON)
    availability TEXT,

    -- Compensation
    hourly_rate DECIMAL(10, 2),
    pt_session_rate DECIMAL(10, 2),
    compensation_model VARCHAR(50),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    -- Contact
    phone VARCHAR(50),

    -- Notes
    notes_en TEXT,
    notes_ar TEXT,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_trainers_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_trainers_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_trainers_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT uq_trainers_user_org UNIQUE (user_id, organization_id)
);

-- Create trainer-club assignments (many-to-many)
-- A trainer can be assigned to multiple clubs within the same organization
CREATE TABLE trainer_club_assignments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    club_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_tca_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
    CONSTRAINT fk_tca_club FOREIGN KEY (club_id) REFERENCES clubs(id),
    CONSTRAINT fk_tca_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT uq_trainer_club UNIQUE (trainer_id, club_id)
);

-- Indexes for trainers
CREATE INDEX idx_trainers_tenant_id ON trainers(tenant_id);
CREATE INDEX idx_trainers_organization_id ON trainers(organization_id);
CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_status ON trainers(status);
CREATE INDEX idx_trainers_trainer_type ON trainers(trainer_type);
CREATE INDEX idx_trainers_employment_type ON trainers(employment_type);

-- Indexes for trainer-club assignments
CREATE INDEX idx_tca_trainer_id ON trainer_club_assignments(trainer_id);
CREATE INDEX idx_tca_club_id ON trainer_club_assignments(club_id);
CREATE INDEX idx_tca_status ON trainer_club_assignments(status);
CREATE INDEX idx_tca_is_primary ON trainer_club_assignments(is_primary);

-- Create personal training sessions table
-- Direct booking between trainers and members for 1-on-1 sessions
CREATE TABLE personal_training_sessions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    member_id UUID NOT NULL,
    location_id UUID,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    price DECIMAL(10, 2),
    notes TEXT,
    cancelled_by UUID,
    cancellation_reason TEXT,
    trainer_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_pts_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id),
    CONSTRAINT fk_pts_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_pts_location FOREIGN KEY (location_id) REFERENCES locations(id),
    CONSTRAINT fk_pts_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

-- Indexes for personal training sessions
CREATE INDEX idx_pts_trainer_id ON personal_training_sessions(trainer_id);
CREATE INDEX idx_pts_member_id ON personal_training_sessions(member_id);
CREATE INDEX idx_pts_session_date ON personal_training_sessions(session_date);
CREATE INDEX idx_pts_status ON personal_training_sessions(status);
CREATE INDEX idx_pts_tenant_id ON personal_training_sessions(tenant_id);
CREATE INDEX idx_pts_trainer_date ON personal_training_sessions(trainer_id, session_date);
CREATE INDEX idx_pts_member_date ON personal_training_sessions(member_id, session_date);

-- Add comment for documentation
COMMENT ON TABLE trainers IS 'Service providers who teach classes and/or provide personal training';
COMMENT ON TABLE trainer_club_assignments IS 'Many-to-many association between trainers and clubs';
COMMENT ON COLUMN trainers.employment_type IS 'EMPLOYEE, INDEPENDENT_CONTRACTOR, or FREELANCE';
COMMENT ON COLUMN trainers.trainer_type IS 'PERSONAL_TRAINER, GROUP_FITNESS, SPECIALIST, or HYBRID';
COMMENT ON COLUMN trainers.status IS 'ACTIVE, INACTIVE, ON_LEAVE, or TERMINATED';
COMMENT ON COLUMN trainers.compensation_model IS 'HOURLY, PER_SESSION, REVENUE_SHARE, or SALARY_PLUS_COMMISSION';
COMMENT ON COLUMN trainers.specializations IS 'JSON array of specialization strings, e.g., ["Yoga", "Pilates"]';
COMMENT ON COLUMN trainers.certifications IS 'JSON array of certification objects with name, issuedBy, issuedAt, expiresAt';
COMMENT ON COLUMN trainers.availability IS 'JSON object with weekly availability slots per day';
COMMENT ON TABLE personal_training_sessions IS 'Direct booking between trainers and members for 1-on-1 personal training';
COMMENT ON COLUMN personal_training_sessions.status IS 'REQUESTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, or NO_SHOW';
