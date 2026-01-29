-- Migration V80: Add enhanced profile fields to members table
-- Part of Club Member Management System Redesign - Phase 5

-- Add fitness goals
ALTER TABLE members ADD COLUMN fitness_goals JSONB;

-- Add preferences
ALTER TABLE members ADD COLUMN preferred_trainer_gender VARCHAR(20);
ALTER TABLE members ADD COLUMN preferred_class_types JSONB;
ALTER TABLE members ADD COLUMN communication_preferences JSONB;

-- Add profile completeness tracking
ALTER TABLE members ADD COLUMN profile_photo_url TEXT;
ALTER TABLE members ADD COLUMN profile_completeness INT DEFAULT 0;

-- Add loyalty tracking
ALTER TABLE members ADD COLUMN loyalty_tier VARCHAR(20);
ALTER TABLE members ADD COLUMN loyalty_points INT DEFAULT 0;
ALTER TABLE members ADD COLUMN referral_count INT DEFAULT 0;

-- Add family membership fields
ALTER TABLE members ADD COLUMN primary_member_id UUID REFERENCES members(id);
ALTER TABLE members ADD COLUMN relationship_to_primary VARCHAR(50);

-- Add corporate membership fields
ALTER TABLE members ADD COLUMN company_name VARCHAR(255);
ALTER TABLE members ADD COLUMN company_id UUID;
ALTER TABLE members ADD COLUMN corporate_billing_type VARCHAR(50);

-- Index for family membership lookups
CREATE INDEX idx_members_primary_member ON members(primary_member_id) WHERE primary_member_id IS NOT NULL;

-- Index for corporate membership lookups
CREATE INDEX idx_members_company ON members(company_id) WHERE company_id IS NOT NULL;

-- Index for loyalty tier
CREATE INDEX idx_members_loyalty ON members(tenant_id, loyalty_tier) WHERE loyalty_tier IS NOT NULL;

COMMENT ON COLUMN members.fitness_goals IS 'JSON array of fitness goals: WEIGHT_LOSS, MUSCLE_GAIN, ENDURANCE, FLEXIBILITY, STRESS_RELIEF, etc.';
COMMENT ON COLUMN members.preferred_trainer_gender IS 'Preferred gender of personal trainer: MALE, FEMALE, NO_PREFERENCE';
COMMENT ON COLUMN members.preferred_class_types IS 'JSON array of preferred class types';
COMMENT ON COLUMN members.communication_preferences IS 'JSON object with preferences: {email: true, sms: true, whatsapp: true, push: true, marketingEmail: false}';
COMMENT ON COLUMN members.profile_completeness IS 'Percentage of profile completion (0-100)';
COMMENT ON COLUMN members.loyalty_tier IS 'Loyalty tier: BRONZE, SILVER, GOLD, PLATINUM';
COMMENT ON COLUMN members.primary_member_id IS 'For family members, references the primary account holder';
COMMENT ON COLUMN members.relationship_to_primary IS 'Relationship to primary member: SPOUSE, CHILD, PARENT, SIBLING';
COMMENT ON COLUMN members.corporate_billing_type IS 'Corporate billing: COMPANY_PAYS, EMPLOYEE_PAYS, SHARED';
