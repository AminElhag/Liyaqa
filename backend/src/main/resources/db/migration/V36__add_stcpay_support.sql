-- V36: Add STC Pay payment support for Saudi market
-- STC Pay is a popular mobile wallet in Saudi Arabia with 8+ million users

-- Add STC Pay transaction tracking to invoices
ALTER TABLE invoices ADD COLUMN stcpay_transaction_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN stcpay_otp_reference VARCHAR(100);
ALTER TABLE invoices ADD COLUMN stcpay_payment_reference VARCHAR(100);

-- Add STC Pay configuration to clubs
ALTER TABLE clubs ADD COLUMN stcpay_enabled BOOLEAN DEFAULT false;
ALTER TABLE clubs ADD COLUMN stcpay_merchant_id VARCHAR(50);

-- Index for STC Pay transaction lookups
CREATE INDEX idx_invoices_stcpay_transaction ON invoices(stcpay_transaction_id) WHERE stcpay_transaction_id IS NOT NULL;
