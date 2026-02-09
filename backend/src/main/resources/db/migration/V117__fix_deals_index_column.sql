-- Evolve deals table to match the 9-stage pipeline entity model
-- (Replaces Liquibase changelog 001-deal-pipeline-evolution that failed to apply)

-- 1. Drop CHECK constraints that restrict old values
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_source_check;

-- 2. Rename columns to match entity field mappings
ALTER TABLE deals RENAME COLUMN status TO stage;
ALTER TABLE deals RENAME COLUMN company_name TO facility_name;
ALTER TABLE deals RENAME COLUMN actual_close_date TO closed_at;

-- 3. Add currency column, migrate from estimated_value_currency, then drop old column
ALTER TABLE deals ADD COLUMN IF NOT EXISTS currency VARCHAR(255) NOT NULL DEFAULT 'SAR';
UPDATE deals SET currency = estimated_value_currency WHERE estimated_value_currency IS NOT NULL;
ALTER TABLE deals DROP COLUMN IF EXISTS estimated_value_currency;

-- 4. Add simple notes column, migrate from notes_en, then drop localized columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT;
UPDATE deals SET notes = notes_en WHERE notes_en IS NOT NULL;
ALTER TABLE deals DROP COLUMN IF EXISTS notes_en;
ALTER TABLE deals DROP COLUMN IF EXISTS notes_ar;

-- 5. Add simple lost_reason column, migrate from lost_reason_en, then drop localized columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_reason TEXT;
UPDATE deals SET lost_reason = lost_reason_en WHERE lost_reason_en IS NOT NULL;
ALTER TABLE deals DROP COLUMN IF EXISTS lost_reason_en;
ALTER TABLE deals DROP COLUMN IF EXISTS lost_reason_ar;

-- 6. Drop columns no longer needed in the simplified deal model
ALTER TABLE deals DROP COLUMN IF EXISTS probability;
ALTER TABLE deals DROP COLUMN IF EXISTS interested_plan_id;
ALTER TABLE deals DROP COLUMN IF EXISTS converted_organization_id;
ALTER TABLE deals DROP COLUMN IF EXISTS converted_subscription_id;
ALTER TABLE deals DROP COLUMN IF EXISTS title_en;
ALTER TABLE deals DROP COLUMN IF EXISTS title_ar;

-- 7. Migrate stage values to new pipeline (QUALIFIED -> CONTACTED, PROPOSAL -> PROPOSAL_SENT)
UPDATE deals SET stage = 'CONTACTED' WHERE stage = 'QUALIFIED';
UPDATE deals SET stage = 'PROPOSAL_SENT' WHERE stage = 'PROPOSAL';

-- 8. Migrate source values to new enum
UPDATE deals SET source = 'COLD_OUTREACH' WHERE source = 'COLD_CALL';
UPDATE deals SET source = 'SOCIAL_MEDIA' WHERE source = 'MARKETING_CAMPAIGN';
UPDATE deals SET source = 'PARTNERSHIP' WHERE source IN ('EVENT', 'PARTNER');

-- 9. Fix performance index
DROP INDEX IF EXISTS idx_deals_assigned_to_stage;
CREATE INDEX IF NOT EXISTS idx_deals_sales_rep_stage ON deals(sales_rep_id, stage);

-- 10. Create deal_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id),
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON deal_activities(created_at);
