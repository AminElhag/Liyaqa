-- Fix NULL values in boolean columns that map to non-nullable Kotlin Boolean properties.
-- Without this, Hibernate throws an error when loading Club entities with NULL in these columns.

UPDATE clubs SET block_checkin_during_prayer = false WHERE block_checkin_during_prayer IS NULL;
UPDATE clubs SET whatsapp_enabled = false WHERE whatsapp_enabled IS NULL;
UPDATE clubs SET stcpay_enabled = false WHERE stcpay_enabled IS NULL;
UPDATE clubs SET tamara_enabled = false WHERE tamara_enabled IS NULL;

ALTER TABLE clubs ALTER COLUMN block_checkin_during_prayer SET NOT NULL;
ALTER TABLE clubs ALTER COLUMN whatsapp_enabled SET NOT NULL;
ALTER TABLE clubs ALTER COLUMN stcpay_enabled SET NOT NULL;
ALTER TABLE clubs ALTER COLUMN tamara_enabled SET NOT NULL;
