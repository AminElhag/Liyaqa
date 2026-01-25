-- CRM & Lead Management Module
-- V45: Create leads and lead_activities tables

-- Leads table (tenant-scoped)
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    source VARCHAR(50) NOT NULL,
    assigned_to_user_id UUID,
    notes TEXT,
    priority VARCHAR(20),
    score INT DEFAULT 0,
    contacted_at DATE,
    tour_scheduled_at DATE,
    trial_started_at DATE,
    negotiation_started_at DATE,
    won_at DATE,
    lost_at DATE,
    loss_reason TEXT,
    expected_conversion_date DATE,
    converted_member_id UUID,
    campaign_source VARCHAR(255),
    campaign_medium VARCHAR(255),
    campaign_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_leads_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_leads_assigned_user FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_leads_converted_member FOREIGN KEY (converted_member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Indexes for leads
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_email ON leads(tenant_id, email);
CREATE INDEX idx_leads_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_source ON leads(tenant_id, source);
CREATE INDEX idx_leads_assigned_to ON leads(tenant_id, assigned_to_user_id);
CREATE INDEX idx_leads_created_at ON leads(tenant_id, created_at DESC);
CREATE INDEX idx_leads_priority ON leads(tenant_id, priority);
CREATE INDEX idx_leads_score ON leads(tenant_id, score DESC);

-- Lead Activities table for tracking interactions
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    notes TEXT,
    performed_by_user_id UUID,
    contact_method VARCHAR(50),
    outcome VARCHAR(100),
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    duration_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_lead_activities_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_lead_activities_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    CONSTRAINT fk_lead_activities_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for lead_activities
CREATE INDEX idx_lead_activities_tenant_id ON lead_activities(tenant_id);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(tenant_id, activity_type);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(tenant_id, created_at DESC);
CREATE INDEX idx_lead_activities_follow_up ON lead_activities(tenant_id, follow_up_date, follow_up_completed)
    WHERE follow_up_date IS NOT NULL AND follow_up_completed = FALSE;

-- Lead Assignment Rules table for round-robin and location-based assignment
CREATE TABLE lead_assignment_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- ROUND_ROBIN, LOCATION_BASED, SOURCE_BASED
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_lead_assignment_rules_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_lead_assignment_rules_tenant ON lead_assignment_rules(tenant_id);
CREATE INDEX idx_lead_assignment_rules_active ON lead_assignment_rules(tenant_id, is_active, priority);

-- Lead Scoring Rules table for configurable scoring
CREATE TABLE lead_scoring_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- SOURCE, ACTIVITY, ENGAGEMENT, ATTRIBUTE
    trigger_value VARCHAR(255),
    score_change INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_lead_scoring_rules_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_lead_scoring_rules_tenant ON lead_scoring_rules(tenant_id);
CREATE INDEX idx_lead_scoring_rules_active ON lead_scoring_rules(tenant_id, is_active, trigger_type);

-- Add lead permissions to the permission system
INSERT INTO permissions (id, name, description, category, created_at, updated_at, version)
VALUES
    (gen_random_uuid(), 'leads_create', 'Create new leads', 'CRM', NOW(), NOW(), 0),
    (gen_random_uuid(), 'leads_read', 'View leads', 'CRM', NOW(), NOW(), 0),
    (gen_random_uuid(), 'leads_update', 'Update leads', 'CRM', NOW(), NOW(), 0),
    (gen_random_uuid(), 'leads_delete', 'Delete leads', 'CRM', NOW(), NOW(), 0),
    (gen_random_uuid(), 'leads_assign', 'Assign leads to users', 'CRM', NOW(), NOW(), 0),
    (gen_random_uuid(), 'leads_convert', 'Convert leads to members', 'CRM', NOW(), NOW(), 0),
    (gen_random_uuid(), 'lead_activities_create', 'Log lead activities', 'CRM', NOW(), NOW(), 0),
    (gen_random_uuid(), 'lead_activities_read', 'View lead activities', 'CRM', NOW(), NOW(), 0)
ON CONFLICT (name) DO NOTHING;

-- Grant lead permissions to CLUB_ADMIN and SUPER_ADMIN roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('CLUB_ADMIN', 'SUPER_ADMIN')
AND p.name IN ('leads_create', 'leads_read', 'leads_update', 'leads_delete', 'leads_assign', 'leads_convert', 'lead_activities_create', 'lead_activities_read')
ON CONFLICT DO NOTHING;
