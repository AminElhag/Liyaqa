-- V58: Equipment Integration Tables
-- Connected fitness equipment providers (TechnoGym, Precor, Life Fitness, etc.)

-- ========== Equipment Providers ==========

CREATE TABLE equipment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    api_base_url VARCHAR(255),
    auth_type VARCHAR(30) NOT NULL, -- API_KEY, OAUTH2, BASIC
    documentation_url VARCHAR(500),
    logo_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider configurations per tenant
CREATE TABLE equipment_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL REFERENCES equipment_providers(id),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    oauth_client_id VARCHAR(255),
    oauth_client_secret_encrypted TEXT,
    oauth_access_token_encrypted TEXT,
    oauth_refresh_token_encrypted TEXT,
    oauth_token_expires_at TIMESTAMPTZ,
    webhook_secret_encrypted TEXT,
    custom_config JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    sync_interval_minutes INT NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, provider_id)
);

CREATE INDEX idx_equipment_provider_configs_tenant ON equipment_provider_configs(tenant_id);

-- ========== Equipment Units ==========

CREATE TABLE equipment_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL,
    provider_id UUID NOT NULL REFERENCES equipment_providers(id),
    external_id VARCHAR(100),
    equipment_type VARCHAR(50) NOT NULL, -- TREADMILL, ELLIPTICAL, BIKE, ROWER, STRENGTH, etc.
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    is_connected BOOLEAN NOT NULL DEFAULT false,
    last_connected_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, OFFLINE, RETIRED
    zone VARCHAR(100),
    floor_number INT,
    position_x INT,
    position_y INT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_equipment_units_tenant ON equipment_units(tenant_id);
CREATE INDEX idx_equipment_units_location ON equipment_units(location_id);
CREATE INDEX idx_equipment_units_provider ON equipment_units(provider_id);
CREATE INDEX idx_equipment_units_type ON equipment_units(equipment_type);
CREATE INDEX idx_equipment_units_external ON equipment_units(tenant_id, provider_id, external_id);

-- ========== Member Equipment Profiles ==========

CREATE TABLE member_equipment_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    provider_id UUID NOT NULL REFERENCES equipment_providers(id),
    external_member_id VARCHAR(100),
    external_username VARCHAR(100),
    oauth_access_token_encrypted TEXT,
    oauth_refresh_token_encrypted TEXT,
    oauth_token_expires_at TIMESTAMPTZ,
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE (member_id, provider_id)
);

CREATE INDEX idx_member_equipment_profiles_tenant ON member_equipment_profiles(tenant_id);
CREATE INDEX idx_member_equipment_profiles_member ON member_equipment_profiles(member_id);
CREATE INDEX idx_member_equipment_profiles_external ON member_equipment_profiles(provider_id, external_member_id);

-- ========== Equipment Workouts ==========

CREATE TABLE equipment_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    equipment_unit_id UUID REFERENCES equipment_units(id),
    provider_id UUID NOT NULL REFERENCES equipment_providers(id),
    external_workout_id VARCHAR(100),
    workout_type VARCHAR(50) NOT NULL, -- CARDIO, STRENGTH, FLEXIBILITY, HIIT, etc.
    equipment_type VARCHAR(50), -- TREADMILL, BIKE, ROWER, etc.
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    -- Cardio metrics
    distance_meters INT,
    steps INT,
    floors_climbed INT,
    -- Calories
    calories_total INT,
    calories_active INT,
    -- Heart rate
    avg_heart_rate INT,
    max_heart_rate INT,
    heart_rate_zones JSONB, -- {zone1: 300, zone2: 600, zone3: 900, ...} seconds per zone
    -- Intensity
    avg_pace_seconds_per_km INT,
    avg_speed_kmh DECIMAL(5,2),
    max_speed_kmh DECIMAL(5,2),
    avg_power_watts INT,
    max_power_watts INT,
    avg_cadence INT,
    -- Strength specific
    total_reps INT,
    total_sets INT,
    total_weight_kg DECIMAL(10,2),
    exercises JSONB, -- [{name, sets, reps, weight}, ...]
    -- Source data
    raw_data JSONB,
    sync_source VARCHAR(30) NOT NULL DEFAULT 'API', -- API, WEBHOOK, MANUAL
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_workouts_tenant ON equipment_workouts(tenant_id);
CREATE INDEX idx_equipment_workouts_member ON equipment_workouts(member_id);
CREATE INDEX idx_equipment_workouts_equipment ON equipment_workouts(equipment_unit_id);
CREATE INDEX idx_equipment_workouts_started ON equipment_workouts(started_at);
CREATE INDEX idx_equipment_workouts_type ON equipment_workouts(workout_type);
CREATE INDEX idx_equipment_workouts_external ON equipment_workouts(provider_id, external_workout_id);

-- ========== Workout Sync Jobs ==========

CREATE TABLE equipment_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_config_id UUID NOT NULL REFERENCES equipment_provider_configs(id),
    job_type VARCHAR(30) NOT NULL, -- FULL_SYNC, INCREMENTAL, MEMBER_SYNC
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    records_processed INT DEFAULT 0,
    records_created INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_sync_jobs_tenant ON equipment_sync_jobs(tenant_id);
CREATE INDEX idx_equipment_sync_jobs_config ON equipment_sync_jobs(provider_config_id);
CREATE INDEX idx_equipment_sync_jobs_status ON equipment_sync_jobs(status);

-- ========== Equipment Usage Analytics ==========

CREATE TABLE equipment_usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    equipment_unit_id UUID NOT NULL REFERENCES equipment_units(id),
    usage_date DATE NOT NULL,
    total_sessions INT NOT NULL DEFAULT 0,
    total_duration_minutes INT NOT NULL DEFAULT 0,
    unique_users INT NOT NULL DEFAULT 0,
    peak_hour INT,
    avg_session_duration_minutes INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (equipment_unit_id, usage_date)
);

CREATE INDEX idx_equipment_usage_daily_tenant ON equipment_usage_daily(tenant_id);
CREATE INDEX idx_equipment_usage_daily_date ON equipment_usage_daily(usage_date);

-- ========== Seed Equipment Providers ==========

INSERT INTO equipment_providers (name, display_name, auth_type, documentation_url) VALUES
    ('TECHNOGYM', 'Technogym', 'OAUTH2', 'https://developer.technogym.com/docs'),
    ('PRECOR', 'Precor', 'API_KEY', 'https://developer.precor.com'),
    ('LIFE_FITNESS', 'Life Fitness', 'OAUTH2', 'https://lifefitness.com/api'),
    ('MATRIX', 'Matrix Fitness', 'API_KEY', 'https://matrixfitness.com/developer'),
    ('PELOTON', 'Peloton', 'OAUTH2', 'https://developer.onepeloton.com'),
    ('CONCEPT2', 'Concept2', 'API_KEY', 'https://log.concept2.com/developers');

-- ========== Add Permissions ==========

INSERT INTO permissions (name, description, module) VALUES
    ('equipment_view', 'View equipment and workouts', 'EQUIPMENT'),
    ('equipment_manage', 'Manage equipment units', 'EQUIPMENT'),
    ('equipment_config', 'Configure equipment providers', 'EQUIPMENT'),
    ('equipment_sync', 'Trigger equipment data sync', 'EQUIPMENT')
ON CONFLICT (name) DO NOTHING;
