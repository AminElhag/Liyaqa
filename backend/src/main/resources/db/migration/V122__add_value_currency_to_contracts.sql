ALTER TABLE tenant_contracts ADD COLUMN value NUMERIC(15,2);
ALTER TABLE tenant_contracts ADD COLUMN currency VARCHAR(3) DEFAULT 'SAR';
