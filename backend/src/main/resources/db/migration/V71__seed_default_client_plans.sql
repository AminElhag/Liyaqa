-- V71: Seed default client plans with market-researched pricing
-- Based on competitor analysis: PushPress, Gymdesk, WellnessLiving, Zen Planner
-- Pricing in SAR (Saudi Riyal) with competitive USD equivalents

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
-- Target: Small studios, boutique gyms, personal trainers
-- Monthly: 299 SAR (~$80 USD) - Competitive with Gymdesk ($75-100)
-- Annual: 2,990 SAR (17% savings)
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
    'Perfect for small fitness studios and personal trainers',
    'مثالي لاستوديوهات اللياقة الصغيرة والمدربين الشخصيين',
    299.00, 'SAR', 2990.00, 'SAR',
    'MONTHLY', 1, 1, 100, 5,
    -- Legacy: No advanced features
    FALSE, FALSE, FALSE, FALSE, FALSE,
    -- Member Engagement: Portal only, no mobile app
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
-- Target: Growing gyms, fitness centers with multiple trainers
-- Monthly: 599 SAR (~$160 USD) - Matches PushPress Pro ($159)
-- Annual: 5,990 SAR (17% savings)
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
    'For growing gyms that need more power and features',
    'للصالات الرياضية المتنامية التي تحتاج إلى المزيد من القوة والميزات',
    599.00, 'SAR', 5990.00, 'SAR',
    'MONTHLY', 3, 2, 500, 15,
    -- Legacy: Advanced reporting and priority support
    TRUE, FALSE, TRUE, FALSE, FALSE,
    -- Member Engagement: Portal and mobile app, no wearables
    TRUE, TRUE, FALSE,
    -- Marketing & Loyalty: Both enabled
    TRUE, TRUE,
    -- Operations: All enabled
    TRUE, TRUE, TRUE,
    -- Accounts & Payments: Online payments only
    FALSE, FALSE, TRUE,
    TRUE, 2,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
);

-- ============================================
-- Plan 3: Enterprise (المؤسسات)
-- Target: Large fitness chains, multi-location franchises
-- Monthly: 1,199 SAR (~$320 USD) - Below premium ($500+), value-oriented
-- Annual: 11,990 SAR (17% savings)
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
    'Full-featured solution for large fitness chains',
    'حل متكامل لسلاسل اللياقة البدنية الكبيرة',
    1199.00, 'SAR', 11990.00, 'SAR',
    'MONTHLY', 999, 999, 999999, 999,
    -- Legacy: ALL enabled
    TRUE, TRUE, TRUE, TRUE, TRUE,
    -- Member Engagement: ALL enabled
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
-- Pricing Summary (for reference)
-- ============================================
-- Plan        | Monthly SAR | Annual SAR | USD Equiv | Savings
-- ------------|-------------|------------|-----------|--------
-- Starter     | 299         | 2,990      | ~$80      | 17%
-- Professional| 599         | 5,990      | ~$160     | 17%
-- Enterprise  | 1,199       | 11,990     | ~$320     | 17%
-- ============================================
