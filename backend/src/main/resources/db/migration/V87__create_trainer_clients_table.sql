-- Create trainer_clients table for PT client relationship tracking
-- This table manages the ongoing relationship between trainers and their PT clients

CREATE TABLE trainer_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    member_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    goals_en TEXT,
    goals_ar TEXT,
    notes_en TEXT,
    notes_ar TEXT,
    total_sessions INT NOT NULL DEFAULT 0,
    completed_sessions INT NOT NULL DEFAULT 0,
    cancelled_sessions INT NOT NULL DEFAULT 0,
    no_show_sessions INT NOT NULL DEFAULT 0,
    last_session_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_trainer_client_trainer_member UNIQUE (trainer_id, member_id),
    CONSTRAINT chk_trainer_client_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_HOLD', 'COMPLETED')),
    CONSTRAINT chk_trainer_client_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_trainer_client_sessions_positive CHECK (
        total_sessions >= 0 AND
        completed_sessions >= 0 AND
        cancelled_sessions >= 0 AND
        no_show_sessions >= 0
    ),
    CONSTRAINT chk_trainer_client_sessions_valid CHECK (
        total_sessions >= (completed_sessions + cancelled_sessions + no_show_sessions)
    )
);

-- Add foreign key constraints
ALTER TABLE trainer_clients
    ADD CONSTRAINT fk_trainer_client_trainer
    FOREIGN KEY (trainer_id)
    REFERENCES trainers(id)
    ON DELETE CASCADE;

ALTER TABLE trainer_clients
    ADD CONSTRAINT fk_trainer_client_member
    FOREIGN KEY (member_id)
    REFERENCES members(id)
    ON DELETE CASCADE;

ALTER TABLE trainer_clients
    ADD CONSTRAINT fk_trainer_client_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

-- Create indexes for efficient queries
CREATE INDEX idx_trainer_clients_trainer_status ON trainer_clients(trainer_id, status);
CREATE INDEX idx_trainer_clients_member ON trainer_clients(member_id);
CREATE INDEX idx_trainer_clients_tenant ON trainer_clients(tenant_id);
CREATE INDEX idx_trainer_clients_org ON trainer_clients(organization_id);
CREATE INDEX idx_trainer_clients_status ON trainer_clients(status);
CREATE INDEX idx_trainer_clients_last_session ON trainer_clients(last_session_date DESC NULLS LAST);

-- Add comments for documentation
COMMENT ON TABLE trainer_clients IS 'Tracks ongoing PT client relationships between trainers and members';
COMMENT ON COLUMN trainer_clients.status IS 'ACTIVE: Currently training, INACTIVE: No longer training, ON_HOLD: Temporarily paused, COMPLETED: Goals achieved';
COMMENT ON COLUMN trainer_clients.goals_en IS 'Client fitness goals in English';
COMMENT ON COLUMN trainer_clients.goals_ar IS 'Client fitness goals in Arabic';
COMMENT ON COLUMN trainer_clients.notes_en IS 'Trainer notes about client in English';
COMMENT ON COLUMN trainer_clients.notes_ar IS 'Trainer notes about client in Arabic';
COMMENT ON COLUMN trainer_clients.total_sessions IS 'Total PT sessions (all statuses)';
COMMENT ON COLUMN trainer_clients.completed_sessions IS 'Number of completed sessions';
COMMENT ON COLUMN trainer_clients.cancelled_sessions IS 'Number of cancelled sessions';
COMMENT ON COLUMN trainer_clients.no_show_sessions IS 'Number of no-show sessions';
