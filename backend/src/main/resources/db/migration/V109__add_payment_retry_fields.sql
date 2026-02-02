-- V109: Add payment retry tracking fields to invoices
-- This enables automated payment retry and dunning management

-- Add retry tracking fields
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS last_payment_retry_at TIMESTAMP WITH TIME ZONE;

-- Create index for finding invoices eligible for retry
-- Used by PaymentRetryJob to efficiently find unpaid invoices
CREATE INDEX IF NOT EXISTS idx_invoices_status_retry
    ON invoices(status, payment_retry_count, created_at)
    WHERE status IN ('ISSUED', 'OVERDUE');

-- Add comments for documentation
COMMENT ON COLUMN invoices.payment_retry_count IS
    'Number of automatic payment retry attempts made. Used for progressive retry schedule (days 1, 3, 7, 14, 30).';

COMMENT ON COLUMN invoices.last_payment_retry_at IS
    'Timestamp of the last automatic payment retry attempt. Used to prevent duplicate retries on the same day.';
