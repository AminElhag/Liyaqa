-- V37: Add SADAD bill payment support for Saudi market
-- SADAD is Saudi Arabia's official bill payment system

-- Add SADAD configuration to clubs
ALTER TABLE clubs ADD COLUMN sadad_enabled BOOLEAN DEFAULT false;
ALTER TABLE clubs ADD COLUMN sadad_biller_code VARCHAR(50);
ALTER TABLE clubs ADD COLUMN sadad_bank_code VARCHAR(10);

-- Add SADAD bill tracking to invoices
ALTER TABLE invoices ADD COLUMN sadad_bill_number VARCHAR(50);
ALTER TABLE invoices ADD COLUMN sadad_bill_account VARCHAR(50);
ALTER TABLE invoices ADD COLUMN sadad_due_date DATE;
ALTER TABLE invoices ADD COLUMN sadad_status VARCHAR(30);

-- Index for SADAD bill lookups
CREATE INDEX idx_invoices_sadad_bill ON invoices(sadad_bill_number) WHERE sadad_bill_number IS NOT NULL;
