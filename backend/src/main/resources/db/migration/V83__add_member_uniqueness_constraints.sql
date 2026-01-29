-- Member uniqueness constraints (per tenant)
-- These constraints prevent duplicate email, phone, and national ID within a tenant

-- Email: case-insensitive unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_email_tenant
ON members(tenant_id, lower(email));

-- Phone: unique per tenant (partial - only when not null/empty)
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_phone_tenant
ON members(tenant_id, phone)
WHERE phone IS NOT NULL AND phone != '';

-- National ID: unique per tenant (partial - only when not null/empty)
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_national_id_tenant
ON members(tenant_id, national_id)
WHERE national_id IS NOT NULL AND national_id != '';
