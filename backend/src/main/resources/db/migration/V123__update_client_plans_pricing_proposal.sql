-- V123: Update client plans to match pricing proposal
-- New pricing: Starter 349 SAR, Professional 899 SAR, Enterprise 1,699 SAR
-- Annual pricing gives 2 months free (10 months cost)

-- ============================================
-- Delete existing default plans (by well-known UUIDs)
-- ============================================
DELETE FROM client_plans WHERE id IN (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003'
);

-- ============================================
-- Plan 1: Starter (المبتدئ)
-- Target: Single-location studios & small gyms, up to 200 members
-- Monthly: 349 SAR | Annual: 3,490 SAR (2 months free)
-- ============================================
INSERT INTO client_plans (
    id, name_en, name_ar, description_en, description_ar,
    monthly_price_amount, monthly_price_currency,
    annual_price_amount, annual_price_currency,
    billing_cycle, max_clubs, max_locations_per_club, max_members, max_staff_users,
    -- Legacy features
    has_advanced_reporting, has_api_access, has_priority_support,
    has_white_labeling, has_custom_integrations,
    -- Member Engagement
    has_member_portal, has_mobile_app, has_wearables_integration,
    -- Marketing & Loyalty
    has_marketing_automation, has_loyalty_program,
    -- Operations
    has_access_control, has_facility_booking, has_personal_training,
    -- Accounts & Payments
    has_corporate_accounts, has_family_groups, has_online_payments,
    is_active, sort_order,
    created_at, updated_at, version
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Starter', 'المبتدئ',
    'Single-location studios & small gyms, up to 200 members',
    'استوديوهات الموقع الواحد والصالات الصغيرة، حتى 200 عضو',
    349.00, 'SAR', 3490.00, 'SAR',
    'MONTHLY', 1, 1, 200, 5,
    -- Legacy: No advanced features
    FALSE, FALSE, FALSE, FALSE, FALSE,
    -- Member Engagement: Portal only
    TRUE, FALSE, FALSE,
    -- Marketing & Loyalty: None
    FALSE, FALSE,
    -- Operations: Facility booking only
    FALSE, TRUE, FALSE,
    -- Accounts & Payments: Online payments only
    FALSE, FALSE, TRUE,
    TRUE, 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
);

-- ============================================
-- Plan 2: Professional (المحترف) - Most Popular
-- Target: Growing gyms, 200-1,000 members, multi-staff
-- Monthly: 899 SAR | Annual: 8,990 SAR (2 months free)
-- ============================================
INSERT INTO client_plans (
    id, name_en, name_ar, description_en, description_ar,
    monthly_price_amount, monthly_price_currency,
    annual_price_amount, annual_price_currency,
    billing_cycle, max_clubs, max_locations_per_club, max_members, max_staff_users,
    -- Legacy features
    has_advanced_reporting, has_api_access, has_priority_support,
    has_white_labeling, has_custom_integrations,
    -- Member Engagement
    has_member_portal, has_mobile_app, has_wearables_integration,
    -- Marketing & Loyalty
    has_marketing_automation, has_loyalty_program,
    -- Operations
    has_access_control, has_facility_booking, has_personal_training,
    -- Accounts & Payments
    has_corporate_accounts, has_family_groups, has_online_payments,
    is_active, sort_order,
    created_at, updated_at, version
) VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Professional', 'المحترف',
    'Growing gyms, 200-1,000 members, multi-staff',
    'الصالات المتنامية، 200-1,000 عضو، فريق عمل متعدد',
    899.00, 'SAR', 8990.00, 'SAR',
    'MONTHLY', 3, 2, 1000, 15,
    -- Legacy: Advanced reporting and priority support
    TRUE, FALSE, TRUE, FALSE, FALSE,
    -- Member Engagement: Portal only, no mobile app or wearables
    TRUE, FALSE, FALSE,
    -- Marketing & Loyalty: Marketing automation only
    TRUE, FALSE,
    -- Operations: Access control, facility booking, personal training
    TRUE, TRUE, TRUE,
    -- Accounts & Payments: Family groups and online payments
    FALSE, TRUE, TRUE,
    TRUE, 2,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
);

-- ============================================
-- Plan 3: Enterprise (المؤسسات)
-- Target: Multi-location chains, 1,000+ members per location
-- Monthly: 1,699 SAR | Annual: 16,990 SAR (2 months free)
-- ============================================
INSERT INTO client_plans (
    id, name_en, name_ar, description_en, description_ar,
    monthly_price_amount, monthly_price_currency,
    annual_price_amount, annual_price_currency,
    billing_cycle, max_clubs, max_locations_per_club, max_members, max_staff_users,
    -- Legacy features
    has_advanced_reporting, has_api_access, has_priority_support,
    has_white_labeling, has_custom_integrations,
    -- Member Engagement
    has_member_portal, has_mobile_app, has_wearables_integration,
    -- Marketing & Loyalty
    has_marketing_automation, has_loyalty_program,
    -- Operations
    has_access_control, has_facility_booking, has_personal_training,
    -- Accounts & Payments
    has_corporate_accounts, has_family_groups, has_online_payments,
    is_active, sort_order,
    created_at, updated_at, version
) VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'Enterprise', 'المؤسسات',
    'Multi-location chains, 1,000+ members per location',
    'سلاسل متعددة المواقع، أكثر من 1,000 عضو لكل موقع',
    1699.00, 'SAR', 16990.00, 'SAR',
    'MONTHLY', 999, 999, 999999, 999,
    -- Legacy: ALL enabled
    TRUE, TRUE, TRUE, TRUE, TRUE,
    -- Member Engagement: ALL enabled (white-label mobile app)
    TRUE, TRUE, TRUE,
    -- Marketing & Loyalty: ALL enabled
    TRUE, TRUE,
    -- Operations: ALL enabled
    TRUE, TRUE, TRUE,
    -- Accounts & Payments: ALL enabled
    TRUE, TRUE, TRUE,
    TRUE, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
);

-- ============================================
-- Pricing Summary
-- ============================================
-- Plan         | Monthly SAR | Annual SAR | Savings
-- -------------|-------------|------------|--------
-- Starter      | 349         | 3,490      | 2mo free
-- Professional | 899         | 8,990      | 2mo free
-- Enterprise   | 1,699       | 16,990     | 2mo free
-- ============================================
