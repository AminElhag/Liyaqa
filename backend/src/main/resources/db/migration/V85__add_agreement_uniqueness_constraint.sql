-- Add unique constraint on agreements (title_en, title_ar, type) per tenant
-- Using COALESCE for title_ar since it's nullable and NULL values in unique indexes are treated as distinct
CREATE UNIQUE INDEX IF NOT EXISTS idx_agreements_unique_title_type
ON agreements (tenant_id, title_en, COALESCE(title_ar, ''), agreement_type);
