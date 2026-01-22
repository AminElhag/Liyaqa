-- V38: Add Tamara Buy Now Pay Later (BNPL) support for Saudi market
-- Tamara is the leading BNPL provider in Saudi Arabia and GCC

-- Add Tamara configuration to clubs
ALTER TABLE clubs ADD COLUMN tamara_enabled BOOLEAN DEFAULT false;
ALTER TABLE clubs ADD COLUMN tamara_merchant_url VARCHAR(255);
ALTER TABLE clubs ADD COLUMN tamara_notification_token VARCHAR(255);

-- Add Tamara order tracking to invoices
ALTER TABLE invoices ADD COLUMN tamara_order_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN tamara_checkout_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN tamara_status VARCHAR(30);
ALTER TABLE invoices ADD COLUMN tamara_instalments INT;

-- Index for Tamara order lookups
CREATE INDEX idx_invoices_tamara_order ON invoices(tamara_order_id) WHERE tamara_order_id IS NOT NULL;
