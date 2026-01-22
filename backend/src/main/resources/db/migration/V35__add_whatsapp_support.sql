-- V35: Add WhatsApp notification support for Saudi market
-- WhatsApp is a primary communication channel in Saudi Arabia

-- Add WhatsApp enabled preference to notification_preferences
ALTER TABLE notification_preferences ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT true;

-- Add WhatsApp-specific columns to notifications table
ALTER TABLE notifications ADD COLUMN whatsapp_message_id VARCHAR(100);
ALTER TABLE notifications ADD COLUMN whatsapp_status VARCHAR(50);

-- Add WhatsApp opt-in and number to members table
ALTER TABLE members ADD COLUMN whatsapp_opted_in BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN whatsapp_number VARCHAR(20);

-- Add WhatsApp configuration to clubs table
ALTER TABLE clubs ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false;
ALTER TABLE clubs ADD COLUMN whatsapp_phone_number_id VARCHAR(50);
ALTER TABLE clubs ADD COLUMN whatsapp_business_id VARCHAR(50);

-- Index for WhatsApp message lookups
CREATE INDEX idx_notifications_whatsapp_message_id ON notifications(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;

-- Index for WhatsApp opted-in members
CREATE INDEX idx_members_whatsapp_opted_in ON members(whatsapp_opted_in) WHERE whatsapp_opted_in = true;
