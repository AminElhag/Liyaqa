-- Fix missing NOT NULL columns across tables
-- Hibernate ddl-auto:update cannot add NOT NULL columns to tables with existing rows
-- This migration adds them with defaults so Hibernate won't fail on startup

-- ============================================
-- users table: add missing boolean columns
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_binding_enabled BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- refresh_tokens table: add missing absolute_expires_at
-- ============================================
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS absolute_expires_at TIMESTAMPTZ;
UPDATE refresh_tokens SET absolute_expires_at = expires_at WHERE absolute_expires_at IS NULL;
ALTER TABLE refresh_tokens ALTER COLUMN absolute_expires_at SET NOT NULL;

-- ============================================
-- client_plans table: add missing feature flag columns
-- ============================================
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_member_portal BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_mobile_app BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_wearables_integration BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_marketing_automation BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_loyalty_program BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_access_control BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_facility_booking BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_personal_training BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_corporate_accounts BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_family_groups BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS has_online_payments BOOLEAN NOT NULL DEFAULT false;
