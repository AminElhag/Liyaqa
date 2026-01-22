-- V33: Add prayer time settings to clubs for Saudi Arabia market
-- Prayer times are calculated using the Umm Al-Qura method (official Saudi method)

-- Add prayer time settings columns to clubs table
ALTER TABLE clubs ADD COLUMN city VARCHAR(100);
ALTER TABLE clubs ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE clubs ADD COLUMN longitude DECIMAL(11, 8);
ALTER TABLE clubs ADD COLUMN prayer_calculation_method VARCHAR(50) DEFAULT 'UMM_AL_QURA';
ALTER TABLE clubs ADD COLUMN prayer_buffer_minutes INT DEFAULT 30;
ALTER TABLE clubs ADD COLUMN block_checkin_during_prayer BOOLEAN DEFAULT false;

-- Add indexes for location-based queries
CREATE INDEX idx_clubs_city ON clubs(city);

-- Add comments for documentation
COMMENT ON COLUMN clubs.city IS 'City name for prayer time calculation (e.g., Riyadh, Jeddah)';
COMMENT ON COLUMN clubs.latitude IS 'Latitude coordinate for accurate prayer time calculation';
COMMENT ON COLUMN clubs.longitude IS 'Longitude coordinate for accurate prayer time calculation';
COMMENT ON COLUMN clubs.prayer_calculation_method IS 'Prayer calculation method: UMM_AL_QURA (Saudi), MUSLIM_WORLD_LEAGUE, EGYPTIAN, etc.';
COMMENT ON COLUMN clubs.prayer_buffer_minutes IS 'Minutes to add before/after prayer for closing time (default 30)';
COMMENT ON COLUMN clubs.block_checkin_during_prayer IS 'If true, block member check-in during prayer times';
