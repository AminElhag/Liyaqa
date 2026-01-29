-- V63: Add granular feature flags to client_plans table
-- Following industry-standard SaaS pricing practices with feature categories

-- ============================================
-- Category 1: Member Engagement
-- ============================================

-- Self-service web portal (booking, profile, payments)
ALTER TABLE client_plans ADD COLUMN has_member_portal BOOLEAN NOT NULL DEFAULT FALSE;

-- White-label mobile app for members (depends on member portal)
ALTER TABLE client_plans ADD COLUMN has_mobile_app BOOLEAN NOT NULL DEFAULT FALSE;

-- Fitbit, Apple Watch sync (depends on mobile app)
ALTER TABLE client_plans ADD COLUMN has_wearables_integration BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- Category 2: Marketing & Loyalty
-- ============================================

-- Email/WhatsApp campaigns, segmentation (depends on member portal)
ALTER TABLE client_plans ADD COLUMN has_marketing_automation BOOLEAN NOT NULL DEFAULT FALSE;

-- Points, badges, gamification (depends on member portal)
ALTER TABLE client_plans ADD COLUMN has_loyalty_program BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- Category 3: Operations
-- ============================================

-- Check-in kiosks, access devices
ALTER TABLE client_plans ADD COLUMN has_access_control BOOLEAN NOT NULL DEFAULT FALSE;

-- Pool, sauna, courts booking
ALTER TABLE client_plans ADD COLUMN has_facility_booking BOOLEAN NOT NULL DEFAULT FALSE;

-- PT session scheduling/packages
ALTER TABLE client_plans ADD COLUMN has_personal_training BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- Category 4: Accounts & Payments
-- ============================================

-- B2B corporate memberships
ALTER TABLE client_plans ADD COLUMN has_corporate_accounts BOOLEAN NOT NULL DEFAULT FALSE;

-- Family membership plans
ALTER TABLE client_plans ADD COLUMN has_family_groups BOOLEAN NOT NULL DEFAULT FALSE;

-- STC Pay, SADAD, Tamara, Stripe
ALTER TABLE client_plans ADD COLUMN has_online_payments BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON COLUMN client_plans.has_member_portal IS 'Self-service web portal (booking, profile, payments)';
COMMENT ON COLUMN client_plans.has_mobile_app IS 'White-label mobile app for members - depends on has_member_portal';
COMMENT ON COLUMN client_plans.has_wearables_integration IS 'Fitbit, Apple Watch sync - depends on has_mobile_app';
COMMENT ON COLUMN client_plans.has_marketing_automation IS 'Email/WhatsApp campaigns, segmentation - depends on has_member_portal';
COMMENT ON COLUMN client_plans.has_loyalty_program IS 'Points, badges, gamification - depends on has_member_portal';
COMMENT ON COLUMN client_plans.has_access_control IS 'Check-in kiosks, access devices';
COMMENT ON COLUMN client_plans.has_facility_booking IS 'Pool, sauna, courts booking';
COMMENT ON COLUMN client_plans.has_personal_training IS 'PT session scheduling/packages';
COMMENT ON COLUMN client_plans.has_corporate_accounts IS 'B2B corporate memberships';
COMMENT ON COLUMN client_plans.has_family_groups IS 'Family membership plans';
COMMENT ON COLUMN client_plans.has_online_payments IS 'STC Pay, SADAD, Tamara, Stripe integration';
