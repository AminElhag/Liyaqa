-- ============================================
-- V98: Remove all data except Platform Administrator
-- ============================================
-- Purpose: Clean the database of all demo/test data while preserving:
--   - liyaqasaas@gmail.com in platform_users (created by V96)
--   - permissions and role_default_permissions (reference data)
--   - client_plans (reference data)
--   - flyway_schema_history (managed by Flyway)
--   - shedlock (infrastructure)
-- ============================================

-- ============================================
-- 1. Marketing & Campaign data
-- ============================================
TRUNCATE TABLE marketing_message_logs CASCADE;
TRUNCATE TABLE marketing_campaign_enrollments CASCADE;
TRUNCATE TABLE marketing_campaign_steps CASCADE;
TRUNCATE TABLE marketing_campaigns CASCADE;
TRUNCATE TABLE marketing_segment_members CASCADE;
TRUNCATE TABLE marketing_segments CASCADE;
TRUNCATE TABLE marketing_tracking_pixels CASCADE;

-- ============================================
-- 2. Loyalty & Referral data
-- ============================================
TRUNCATE TABLE voucher_usages CASCADE;
TRUNCATE TABLE vouchers CASCADE;
TRUNCATE TABLE referral_rewards CASCADE;
TRUNCATE TABLE referrals CASCADE;
TRUNCATE TABLE referral_codes CASCADE;
TRUNCATE TABLE referral_configs CASCADE;
TRUNCATE TABLE points_transactions CASCADE;
TRUNCATE TABLE member_points CASCADE;
TRUNCATE TABLE loyalty_config CASCADE;

-- ============================================
-- 3. Analytics & Reporting data
-- ============================================
TRUNCATE TABLE report_history CASCADE;
TRUNCATE TABLE scheduled_reports CASCADE;
TRUNCATE TABLE member_engagement_scores CASCADE;
TRUNCATE TABLE member_feature_snapshots CASCADE;
TRUNCATE TABLE member_churn_predictions CASCADE;
TRUNCATE TABLE churn_interventions CASCADE;
TRUNCATE TABLE churn_models CASCADE;
TRUNCATE TABLE intervention_templates CASCADE;
TRUNCATE TABLE client_health_scores CASCADE;
TRUNCATE TABLE client_usage CASCADE;
TRUNCATE TABLE onboarding_completed_steps CASCADE;
TRUNCATE TABLE onboarding_progress CASCADE;
TRUNCATE TABLE forecasts CASCADE;
TRUNCATE TABLE seasonality_patterns CASCADE;
TRUNCATE TABLE forecast_models CASCADE;
TRUNCATE TABLE forecast_scenarios CASCADE;
TRUNCATE TABLE budgets CASCADE;

-- ============================================
-- 4. Compliance & Security data
-- ============================================
TRUNCATE TABLE policy_acknowledgements CASCADE;
TRUNCATE TABLE security_policies CASCADE;
TRUNCATE TABLE data_deletion_log CASCADE;
TRUNCATE TABLE data_retention_rules CASCADE;
TRUNCATE TABLE data_breaches CASCADE;
TRUNCATE TABLE data_subject_requests CASCADE;
TRUNCATE TABLE consent_records CASCADE;
TRUNCATE TABLE data_processing_activities CASCADE;
TRUNCATE TABLE identified_risks CASCADE;
TRUNCATE TABLE risk_assessments CASCADE;
TRUNCATE TABLE compliance_reports CASCADE;
TRUNCATE TABLE compliance_evidence CASCADE;
TRUNCATE TABLE control_implementations CASCADE;
TRUNCATE TABLE organization_compliance_status CASCADE;
TRUNCATE TABLE compliance_requirements CASCADE;
TRUNCATE TABLE compliance_frameworks CASCADE;
TRUNCATE TABLE security_alerts CASCADE;
TRUNCATE TABLE security_events CASCADE;
TRUNCATE TABLE encryption_keys CASCADE;
TRUNCATE TABLE login_attempts CASCADE;
TRUNCATE TABLE mfa_backup_codes CASCADE;
TRUNCATE TABLE password_history CASCADE;
TRUNCATE TABLE password_reset_tokens CASCADE;
TRUNCATE TABLE oauth_providers CASCADE;

-- ============================================
-- 5. Support & Ticketing data
-- ============================================
TRUNCATE TABLE ticket_messages CASCADE;
TRUNCATE TABLE support_tickets CASCADE;
TRUNCATE TABLE platform_alerts CASCADE;

-- ============================================
-- 6. Notification data
-- ============================================
TRUNCATE TABLE notification_preferences CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE notification_templates CASCADE;
TRUNCATE TABLE device_tokens CASCADE;
TRUNCATE TABLE webhook_deliveries CASCADE;
TRUNCATE TABLE webhooks CASCADE;

-- ============================================
-- 7. Kiosk data
-- ============================================
TRUNCATE TABLE kiosk_signatures CASCADE;
TRUNCATE TABLE kiosk_transactions CASCADE;
TRUNCATE TABLE kiosk_sessions CASCADE;
TRUNCATE TABLE kiosk_devices CASCADE;

-- ============================================
-- 8. Equipment & Wearables data
-- ============================================
TRUNCATE TABLE equipment_workouts CASCADE;
TRUNCATE TABLE equipment_sync_jobs CASCADE;
TRUNCATE TABLE member_equipment_profiles CASCADE;
TRUNCATE TABLE equipment_units CASCADE;
TRUNCATE TABLE equipment_provider_configs CASCADE;
TRUNCATE TABLE equipment_providers CASCADE;
TRUNCATE TABLE wearable_workouts CASCADE;
TRUNCATE TABLE wearable_daily_activities CASCADE;
TRUNCATE TABLE wearable_sync_jobs CASCADE;
TRUNCATE TABLE member_wearable_connections CASCADE;
TRUNCATE TABLE wearable_platforms CASCADE;

-- ============================================
-- 9. Shop & Orders data
-- ============================================
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE bundle_items CASCADE;
TRUNCATE TABLE product_zone_access CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE product_categories CASCADE;
TRUNCATE TABLE saved_payment_methods CASCADE;

-- ============================================
-- 10. Facility Booking data
-- ============================================
TRUNCATE TABLE facility_bookings CASCADE;
TRUNCATE TABLE facility_slots CASCADE;
TRUNCATE TABLE facility_operating_hours CASCADE;
TRUNCATE TABLE facilities CASCADE;

-- ============================================
-- 11. Access Control data
-- ============================================
TRUNCATE TABLE access_logs CASCADE;
TRUNCATE TABLE member_current_locations CASCADE;
TRUNCATE TABLE zone_occupancy CASCADE;
TRUNCATE TABLE biometric_enrollments CASCADE;
TRUNCATE TABLE member_access_cards CASCADE;
TRUNCATE TABLE access_time_rules CASCADE;
TRUNCATE TABLE access_devices CASCADE;
TRUNCATE TABLE access_zones CASCADE;

-- ============================================
-- 12. Attendance data
-- ============================================
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE member_check_ins CASCADE;

-- ============================================
-- 13. Scheduling & Bookings data
-- ============================================
TRUNCATE TABLE class_bookings CASCADE;
TRUNCATE TABLE class_sessions CASCADE;
TRUNCATE TABLE class_schedules CASCADE;
TRUNCATE TABLE gender_schedules CASCADE;
TRUNCATE TABLE member_class_pack_balances CASCADE;
TRUNCATE TABLE class_packs CASCADE;
TRUNCATE TABLE gym_classes CASCADE;
TRUNCATE TABLE personal_training_sessions CASCADE;

-- ============================================
-- 14. Trainer data
-- ============================================
TRUNCATE TABLE trainer_earnings CASCADE;
TRUNCATE TABLE trainer_certifications CASCADE;
TRUNCATE TABLE trainer_notifications CASCADE;
TRUNCATE TABLE trainer_clients CASCADE;
TRUNCATE TABLE trainer_club_assignments CASCADE;
TRUNCATE TABLE trainers CASCADE;

-- ============================================
-- 15. Member data (cascades handle sub-tables)
-- ============================================
TRUNCATE TABLE wallet_transactions CASCADE;
TRUNCATE TABLE member_wallets CASCADE;
TRUNCATE TABLE member_activities CASCADE;
TRUNCATE TABLE member_tasks CASCADE;
TRUNCATE TABLE member_agreements CASCADE;
TRUNCATE TABLE member_health_info CASCADE;
TRUNCATE TABLE member_freeze_balances CASCADE;
TRUNCATE TABLE member_onboardings CASCADE;
TRUNCATE TABLE family_group_members CASCADE;
TRUNCATE TABLE family_groups CASCADE;

-- ============================================
-- 16. Subscription & Billing data
-- ============================================
TRUNCATE TABLE subscription_freeze_history CASCADE;
TRUNCATE TABLE plan_change_history CASCADE;
TRUNCATE TABLE scheduled_plan_changes CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE invoice_line_items CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE invoice_sequences CASCADE;
TRUNCATE TABLE freeze_packages CASCADE;
TRUNCATE TABLE membership_plans CASCADE;

-- ============================================
-- 17. Membership Contracts & Retention
-- ============================================
TRUNCATE TABLE exit_surveys CASCADE;
TRUNCATE TABLE cancellation_requests CASCADE;
TRUNCATE TABLE retention_offers CASCADE;
TRUNCATE TABLE contract_number_sequences CASCADE;
TRUNCATE TABLE contract_pricing_tiers CASCADE;
TRUNCATE TABLE membership_contracts CASCADE;
TRUNCATE TABLE membership_categories CASCADE;

-- ============================================
-- 18. Dunning & Financial
-- ============================================
TRUNCATE TABLE dunning_steps CASCADE;
TRUNCATE TABLE dunning_sequences CASCADE;

-- ============================================
-- 19. Leads & CRM data
-- ============================================
TRUNCATE TABLE lead_activities CASCADE;
TRUNCATE TABLE lead_assignment_rules CASCADE;
TRUNCATE TABLE lead_scoring_rules CASCADE;
TRUNCATE TABLE lead_capture_forms CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE client_notes CASCADE;

-- ============================================
-- 20. Agreements data
-- ============================================
TRUNCATE TABLE agreements CASCADE;

-- ============================================
-- 21. Members (main table)
-- ============================================
TRUNCATE TABLE members CASCADE;

-- ============================================
-- 22. Corporate data
-- ============================================
TRUNCATE TABLE corporate_members CASCADE;
TRUNCATE TABLE corporate_accounts CASCADE;

-- ============================================
-- 23. Employee data
-- ============================================
TRUNCATE TABLE employee_location_assignments CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE job_titles CASCADE;
TRUNCATE TABLE departments CASCADE;

-- ============================================
-- 24. SaaS Client Billing data
-- ============================================
TRUNCATE TABLE client_invoice_line_items CASCADE;
TRUNCATE TABLE client_invoices CASCADE;
TRUNCATE TABLE client_invoice_sequences CASCADE;
TRUNCATE TABLE client_subscriptions CASCADE;
TRUNCATE TABLE deals CASCADE;

-- ============================================
-- 25. Branding & Config data
-- ============================================
TRUNCATE TABLE branding_configs CASCADE;
TRUNCATE TABLE rate_limits CASCADE;

-- ============================================
-- 26. Users, Sessions, Auth tokens
-- ============================================
TRUNCATE TABLE user_permissions CASCADE;
TRUNCATE TABLE user_sessions CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================
-- 27. File & Audit data
-- ============================================
TRUNCATE TABLE file_metadata CASCADE;
TRUNCATE TABLE audit_logs CASCADE;

-- ============================================
-- 28. Organization hierarchy
-- ============================================
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE clubs CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- ============================================
-- 29. Platform data (preserve liyaqasaas@gmail.com)
-- ============================================
TRUNCATE TABLE platform_login_tokens CASCADE;
TRUNCATE TABLE platform_user_activities CASCADE;
-- Delete all platform_users EXCEPT liyaqasaas@gmail.com
DELETE FROM platform_users WHERE email != 'liyaqasaas@gmail.com';
