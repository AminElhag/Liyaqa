-- ============================================
-- V96: Add Platform Admin User
-- ============================================
-- Purpose: Add liyaqasaas@gmail.com as platform admin
-- Auth: OTP-only (empty password_hash for passwordless authentication)
-- Role: PLATFORM_ADMIN (highest available role)
-- Status: ACTIVE
-- ============================================

-- Delete existing user if exists (idempotent)
DELETE FROM platform_users WHERE email = 'liyaqasaas@gmail.com';

-- Insert platform admin user
INSERT INTO platform_users (
    id,
    email,
    password_hash,
    display_name_en,
    display_name_ar,
    role,
    status,
    phone_number,
    avatar_url,
    last_login_at,
    created_by_id,
    created_at,
    updated_at,
    version
) VALUES (
    gen_random_uuid(),
    'liyaqasaas@gmail.com',
    '',  -- Empty for OTP-only authentication (passwordless)
    'Platform Administrator',
    'مدير المنصة',
    'PLATFORM_ADMIN',
    'ACTIVE',
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW(),
    0
);

-- ============================================
-- Verification Query (for manual testing)
-- ============================================
-- SELECT id, email, display_name_en, role, status, password_hash
-- FROM platform_users
-- WHERE email = 'liyaqasaas@gmail.com';
-- Expected: role=PLATFORM_ADMIN, status=ACTIVE, password_hash=''
