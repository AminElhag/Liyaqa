-- V56: Access Control Hardware Integration
-- Supports turnstiles, speed gates, biometric terminals, RFID/NFC readers

-- Access Zones (areas within a facility)
CREATE TABLE access_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    zone_type VARCHAR(30) NOT NULL, -- GYM_FLOOR, LOCKER_ROOM, POOL, STUDIO, SPA, RESTRICTED
    max_occupancy INT,
    current_occupancy INT DEFAULT 0,
    gender_restriction VARCHAR(10), -- MALE, FEMALE, null for mixed
    require_specific_plans JSONB, -- ["plan_id_1", "plan_id_2"] or null for all plans
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_access_zones_tenant ON access_zones(tenant_id);
CREATE INDEX idx_access_zones_location ON access_zones(location_id);

-- Access Devices (turnstiles, readers, terminals)
CREATE TABLE access_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    device_type VARCHAR(30) NOT NULL, -- TURNSTILE, SPEED_GATE, BIOMETRIC_TERMINAL, RFID_READER, QR_SCANNER
    device_name VARCHAR(100) NOT NULL,
    device_name_ar VARCHAR(100),
    manufacturer VARCHAR(50), -- GUNNEBO, SUPREMA, HID, ZKTECO, BOON_EDAM
    model VARCHAR(50),
    serial_number VARCHAR(100),
    ip_address VARCHAR(45),
    api_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    zone_id UUID REFERENCES access_zones(id),
    direction VARCHAR(15) NOT NULL, -- ENTRY, EXIT, BIDIRECTIONAL
    is_online BOOLEAN DEFAULT false,
    last_heartbeat TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, MAINTENANCE, OFFLINE
    config JSONB, -- Device-specific configuration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_access_devices_tenant ON access_devices(tenant_id);
CREATE INDEX idx_access_devices_location ON access_devices(location_id);
CREATE INDEX idx_access_devices_zone ON access_devices(zone_id);
CREATE INDEX idx_access_devices_status ON access_devices(status);

-- Access Time Rules (when access is allowed/denied)
CREATE TABLE access_time_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    zone_id UUID REFERENCES access_zones(id), -- null means all zones
    plan_id UUID REFERENCES membership_plans(id), -- null means all plans
    member_id UUID REFERENCES members(id), -- null means rule applies to all members
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    day_of_week INT, -- 0=Sunday, 1=Monday, ..., 6=Saturday; null means all days
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    access_type VARCHAR(20) NOT NULL, -- ALLOW, DENY
    priority INT DEFAULT 0, -- Higher priority rules override lower
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_access_time_rules_tenant ON access_time_rules(tenant_id);
CREATE INDEX idx_access_time_rules_zone ON access_time_rules(zone_id);
CREATE INDEX idx_access_time_rules_plan ON access_time_rules(plan_id);
CREATE INDEX idx_access_time_rules_member ON access_time_rules(member_id);

-- Member Access Cards (RFID, NFC, Mifare)
CREATE TABLE member_access_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    card_type VARCHAR(20) NOT NULL, -- RFID, NFC, MIFARE, HID_PROX, HID_ICLASS
    card_number VARCHAR(100) NOT NULL,
    facility_code VARCHAR(20),
    card_data_encrypted TEXT, -- For storing card-specific encrypted data
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, LOST, EXPIRED, REVOKED
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (tenant_id, card_number)
);

CREATE INDEX idx_member_access_cards_tenant ON member_access_cards(tenant_id);
CREATE INDEX idx_member_access_cards_member ON member_access_cards(member_id);
CREATE INDEX idx_member_access_cards_status ON member_access_cards(status);
CREATE INDEX idx_member_access_cards_card_number ON member_access_cards(card_number);

-- Biometric Enrollments (fingerprint, face recognition)
CREATE TABLE biometric_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    biometric_type VARCHAR(20) NOT NULL, -- FINGERPRINT, FACE, PALM, IRIS
    finger_position VARCHAR(20), -- LEFT_THUMB, RIGHT_INDEX, etc. (for fingerprint)
    template_data_encrypted TEXT NOT NULL, -- Encrypted biometric template
    template_quality INT, -- Quality score 0-100
    device_id UUID REFERENCES access_devices(id), -- Device used for enrollment
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, NEEDS_RE_ENROLLMENT
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_biometric_enrollments_tenant ON biometric_enrollments(tenant_id);
CREATE INDEX idx_biometric_enrollments_member ON biometric_enrollments(member_id);
CREATE INDEX idx_biometric_enrollments_type ON biometric_enrollments(biometric_type);

-- Access Logs (entry/exit events)
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    device_id UUID NOT NULL REFERENCES access_devices(id),
    zone_id UUID REFERENCES access_zones(id),
    member_id UUID REFERENCES members(id), -- null for denied unknown attempts
    access_method VARCHAR(20) NOT NULL, -- RFID, BIOMETRIC, QR_CODE, PIN, MANUAL
    card_id UUID REFERENCES member_access_cards(id),
    biometric_id UUID REFERENCES biometric_enrollments(id),
    direction VARCHAR(10) NOT NULL, -- ENTRY, EXIT
    result VARCHAR(20) NOT NULL, -- GRANTED, DENIED
    denial_reason VARCHAR(50), -- EXPIRED_MEMBERSHIP, INVALID_CARD, TIME_RESTRICTED, ZONE_RESTRICTED, CAPACITY_FULL, UNKNOWN_CREDENTIAL
    confidence_score DECIMAL(5,4), -- For biometric matches
    raw_credential VARCHAR(255), -- For logging unknown credentials
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_tenant ON access_logs(tenant_id);
CREATE INDEX idx_access_logs_device ON access_logs(device_id);
CREATE INDEX idx_access_logs_zone ON access_logs(zone_id);
CREATE INDEX idx_access_logs_member ON access_logs(member_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_result ON access_logs(result);

-- Zone Occupancy (real-time tracking)
CREATE TABLE zone_occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    zone_id UUID NOT NULL REFERENCES access_zones(id) UNIQUE,
    current_count INT DEFAULT 0,
    peak_count_today INT DEFAULT 0,
    peak_time_today TIMESTAMPTZ,
    last_entry_at TIMESTAMPTZ,
    last_exit_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zone_occupancy_tenant ON zone_occupancy(tenant_id);
CREATE INDEX idx_zone_occupancy_zone ON zone_occupancy(zone_id);

-- Zone Occupancy History (for analytics)
CREATE TABLE zone_occupancy_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    zone_id UUID NOT NULL REFERENCES access_zones(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    occupancy_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zone_occupancy_history_tenant ON zone_occupancy_history(tenant_id);
CREATE INDEX idx_zone_occupancy_history_zone ON zone_occupancy_history(zone_id);
CREATE INDEX idx_zone_occupancy_history_recorded ON zone_occupancy_history(recorded_at);

-- Member Current Location (which zone they're in)
CREATE TABLE member_current_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id) UNIQUE,
    zone_id UUID NOT NULL REFERENCES access_zones(id),
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_member_current_locations_tenant ON member_current_locations(tenant_id);
CREATE INDEX idx_member_current_locations_member ON member_current_locations(member_id);
CREATE INDEX idx_member_current_locations_zone ON member_current_locations(zone_id);

-- Add new permissions for access control
INSERT INTO permissions (name, description, category) VALUES
    ('access_control_view', 'View access control settings', 'ACCESS_CONTROL'),
    ('access_control_manage', 'Manage access control devices and zones', 'ACCESS_CONTROL'),
    ('access_cards_view', 'View member access cards', 'ACCESS_CONTROL'),
    ('access_cards_manage', 'Manage member access cards', 'ACCESS_CONTROL'),
    ('biometrics_view', 'View biometric enrollments', 'ACCESS_CONTROL'),
    ('biometrics_manage', 'Manage biometric enrollments', 'ACCESS_CONTROL'),
    ('access_logs_view', 'View access logs', 'ACCESS_CONTROL'),
    ('occupancy_view', 'View zone occupancy', 'ACCESS_CONTROL')
ON CONFLICT (name) DO NOTHING;
