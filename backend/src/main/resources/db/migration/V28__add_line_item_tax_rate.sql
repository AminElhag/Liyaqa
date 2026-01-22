-- V28: Add per-line-item tax rate to invoice line items
-- This allows each line item to have its own tax rate instead of using a single invoice-level rate

-- Add tax rate to invoice line items
ALTER TABLE invoice_line_items ADD COLUMN line_tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00;

-- Migrate existing line items to use invoice-level VAT rate
UPDATE invoice_line_items ili
SET line_tax_rate = (
    SELECT i.vat_rate FROM invoices i WHERE i.id = ili.invoice_id
);
