-- ============================================
-- V93: Reset Platform Users - OTP-Only Admin
-- ============================================
-- WARNING: This migration deletes ALL existing platform users
-- and creates a single OTP-only admin user
-- ============================================

-- ============================================
-- 1. Delete Dependent Records
-- ============================================
-- Delete ticket messages that reference platform users
DELETE FROM ticket_messages WHERE author_id IN (SELECT id FROM platform_users);

-- Delete support tickets (both created_by and assigned_to)
DELETE FROM support_tickets WHERE assigned_to_id IN (SELECT id FROM platform_users);
DELETE FROM support_tickets WHERE created_by_id IN (SELECT id FROM platform_users);

-- Delete client notes created by platform users
DELETE FROM client_notes WHERE created_by_id IN (SELECT id FROM platform_users);

-- Note: platform_user_activities will auto-delete due to ON DELETE CASCADE

-- ============================================
-- 2. Break Self-Referencing Foreign Key
-- ============================================
-- Set created_by_id to NULL to avoid FK constraint violation
UPDATE platform_users SET created_by_id = NULL WHERE created_by_id IS NOT NULL;

-- ============================================
-- 3. Delete All Platform Users
-- ============================================
DELETE FROM platform_users;

-- ============================================
-- 4. Create OTP-Only Admin User
-- ============================================
-- Email: liyaqasaas@gmail.com
-- Auth: OTP-only (empty password_hash)
-- Role: PLATFORM_ADMIN
-- Status: ACTIVE
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
    'a0000000-0000-0000-0000-000000000001',
    'liyaqasaas@gmail.com',
    '',
    'Platform Administrator',
    'مدير المنصة',
    'PLATFORM_ADMIN',
    'ACTIVE',
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
);

-- ============================================
-- Verification Queries (for manual testing)
-- ============================================
-- SELECT COUNT(*) FROM platform_users;  -- Should return 1
-- SELECT id, email, display_name_en, role, status, password_hash FROM platform_users;
-- Expected: email=liyaqasaas@gmail.com, role=PLATFORM_ADMIN, status=ACTIVE, password_hash=''
