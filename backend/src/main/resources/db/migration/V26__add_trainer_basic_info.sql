-- Add basic info columns to trainers table
-- Supports bilingual display name, date of birth, and gender

ALTER TABLE trainers ADD COLUMN display_name_en VARCHAR(255);
ALTER TABLE trainers ADD COLUMN display_name_ar VARCHAR(255);
ALTER TABLE trainers ADD COLUMN date_of_birth DATE;
ALTER TABLE trainers ADD COLUMN gender VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN trainers.display_name_en IS 'Display name of the trainer in English';
COMMENT ON COLUMN trainers.display_name_ar IS 'Display name of the trainer in Arabic';
COMMENT ON COLUMN trainers.date_of_birth IS 'Date of birth for age calculation';
COMMENT ON COLUMN trainers.gender IS 'MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY';
