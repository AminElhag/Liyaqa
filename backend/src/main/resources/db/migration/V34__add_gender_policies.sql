-- V34: Add gender separation policies for Saudi Arabia market
-- Saudi Arabia requires gender separation in many fitness facilities

-- Add gender policy to locations
ALTER TABLE locations ADD COLUMN gender_policy VARCHAR(20) DEFAULT 'MIXED';

-- Add gender restriction to gym classes
ALTER TABLE gym_classes ADD COLUMN gender_restriction VARCHAR(20);

-- Add preferred client gender to trainers
ALTER TABLE trainers ADD COLUMN preferred_client_gender VARCHAR(20);

-- Add gender to members (may already exist, using IF NOT EXISTS equivalent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'members' AND column_name = 'gender') THEN
        ALTER TABLE members ADD COLUMN gender VARCHAR(20);
    END IF;
END $$;

-- Create gender schedules table for time-based gender switching
CREATE TABLE gender_schedules (
    id UUID PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    gender VARCHAR(10) NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_gender_schedule_gender CHECK (gender IN ('MALE', 'FEMALE')),
    CONSTRAINT chk_gender_schedule_day CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'))
);

-- Add indexes
CREATE INDEX idx_gender_schedules_location ON gender_schedules(location_id);
CREATE INDEX idx_gender_schedules_tenant ON gender_schedules(tenant_id);
CREATE INDEX idx_locations_gender_policy ON locations(gender_policy);

-- Add comments
COMMENT ON COLUMN locations.gender_policy IS 'Gender policy: MIXED, MALE_ONLY, FEMALE_ONLY, TIME_BASED';
COMMENT ON COLUMN gym_classes.gender_restriction IS 'Class gender restriction: MALE_ONLY, FEMALE_ONLY, null for mixed';
COMMENT ON COLUMN trainers.preferred_client_gender IS 'Trainer preferred client gender for PT sessions';
COMMENT ON TABLE gender_schedules IS 'Time-based gender schedules for locations with TIME_BASED policy';
