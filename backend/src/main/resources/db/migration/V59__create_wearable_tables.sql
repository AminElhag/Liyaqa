-- V59: Create wearable integration tables
-- Supports Fitbit, Garmin, Google Fit, Apple Health, WHOOP, Oura

-- Wearable platforms (seed data, non-tenant)
CREATE TABLE wearable_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    api_base_url VARCHAR(255),
    oauth_auth_url VARCHAR(500),
    oauth_token_url VARCHAR(500),
    oauth_scopes VARCHAR(500),
    auth_type VARCHAR(30) NOT NULL DEFAULT 'OAUTH2',
    documentation_url VARCHAR(500),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member connections to wearable platforms
CREATE TABLE member_wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    platform_id UUID NOT NULL REFERENCES wearable_platforms(id),
    external_user_id VARCHAR(100),
    external_username VARCHAR(100),
    oauth_access_token_encrypted TEXT,
    oauth_refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (tenant_id, member_id, platform_id)
);

-- Daily activity summaries from wearables
CREATE TABLE wearable_daily_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    connection_id UUID NOT NULL REFERENCES member_wearable_connections(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    -- Activity metrics
    steps INT,
    distance_meters INT,
    floors_climbed INT,
    -- Calories
    calories_total INT,
    calories_active INT,
    -- Time metrics
    active_minutes INT,
    sedentary_minutes INT,
    -- Sleep metrics
    sleep_minutes INT,
    sleep_quality_score INT,
    -- Heart/health metrics
    resting_heart_rate INT,
    hrv_average DECIMAL(6,2),
    stress_score INT,
    recovery_score INT,
    -- Source data
    raw_data JSONB,
    sync_source VARCHAR(20) NOT NULL DEFAULT 'API',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (connection_id, activity_date)
);

-- Individual workouts from wearables
CREATE TABLE wearable_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    connection_id UUID NOT NULL REFERENCES member_wearable_connections(id) ON DELETE CASCADE,
    external_workout_id VARCHAR(100),
    activity_type VARCHAR(50) NOT NULL,
    activity_name VARCHAR(100),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    distance_meters INT,
    calories_burned INT,
    avg_heart_rate INT,
    max_heart_rate INT,
    avg_pace_seconds_per_km INT,
    elevation_gain_meters INT,
    steps INT,
    raw_data JSONB,
    sync_source VARCHAR(20) NOT NULL DEFAULT 'API',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (connection_id, external_workout_id)
);

-- Sync job tracking
CREATE TABLE wearable_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    connection_id UUID NOT NULL REFERENCES member_wearable_connections(id) ON DELETE CASCADE,
    job_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    records_processed INT DEFAULT 0,
    records_created INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wearable_connections_member ON member_wearable_connections(tenant_id, member_id);
CREATE INDEX idx_wearable_connections_platform ON member_wearable_connections(platform_id);
CREATE INDEX idx_wearable_daily_activities_member_date ON wearable_daily_activities(tenant_id, member_id, activity_date);
CREATE INDEX idx_wearable_daily_activities_connection ON wearable_daily_activities(connection_id);
CREATE INDEX idx_wearable_workouts_member_date ON wearable_workouts(tenant_id, member_id, started_at);
CREATE INDEX idx_wearable_workouts_connection ON wearable_workouts(connection_id);
CREATE INDEX idx_wearable_sync_jobs_connection ON wearable_sync_jobs(connection_id, status);
CREATE INDEX idx_wearable_sync_jobs_status ON wearable_sync_jobs(status, created_at);

-- Seed wearable platforms
INSERT INTO wearable_platforms (name, display_name, api_base_url, oauth_auth_url, oauth_token_url, oauth_scopes, auth_type, logo_url) VALUES
('FITBIT', 'Fitbit', 'https://api.fitbit.com', 'https://www.fitbit.com/oauth2/authorize', 'https://api.fitbit.com/oauth2/token', 'activity heartrate sleep profile', 'OAUTH2', '/images/wearables/fitbit.svg'),
('GARMIN', 'Garmin Connect', 'https://apis.garmin.com', 'https://connect.garmin.com/oauthConfirm', 'https://connectapi.garmin.com/oauth-service/oauth/access_token', 'activity_export', 'OAUTH2', '/images/wearables/garmin.svg'),
('GOOGLE_FIT', 'Google Fit', 'https://www.googleapis.com/fitness/v1', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read', 'OAUTH2', '/images/wearables/google-fit.svg'),
('APPLE_HEALTH', 'Apple Health', NULL, NULL, NULL, NULL, 'DEVICE_SDK', '/images/wearables/apple-health.svg'),
('WHOOP', 'WHOOP', 'https://api.prod.whoop.com', 'https://api.prod.whoop.com/oauth/oauth2/auth', 'https://api.prod.whoop.com/oauth/oauth2/token', 'read:recovery read:cycles read:sleep read:workout read:profile', 'OAUTH2', '/images/wearables/whoop.svg'),
('OURA', 'Oura Ring', 'https://api.ouraring.com', 'https://cloud.ouraring.com/oauth/authorize', 'https://api.ouraring.com/oauth/token', 'daily readiness sleep activity personal', 'OAUTH2', '/images/wearables/oura.svg');
