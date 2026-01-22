-- V17: Create initial platform admin user
-- Password: PlatformAdmin123! (BCrypt hashed)

INSERT INTO users (
    id,
    email,
    password_hash,
    display_name_en,
    display_name_ar,
    role,
    status,
    is_platform_user,
    platform_organization_id,
    created_at,
    updated_at,
    version
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'platform@liyaqa.com',
    -- BCrypt hash for: PlatformAdmin123!
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5GStS5PjC6f.g5NWsq',
    'Platform Admin',
    'مدير المنصة',
    'PLATFORM_ADMIN',
    'ACTIVE',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
) ON CONFLICT (email) DO NOTHING;

-- Create a sales rep user for testing
INSERT INTO users (
    id,
    email,
    password_hash,
    display_name_en,
    display_name_ar,
    role,
    status,
    is_platform_user,
    platform_organization_id,
    created_at,
    updated_at,
    version
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'sales@liyaqa.com',
    -- BCrypt hash for: SalesRep123!
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5GStS5PjC6f.g5NWsq',
    'Sales Representative',
    'مندوب المبيعات',
    'SALES_REP',
    'ACTIVE',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
) ON CONFLICT (email) DO NOTHING;

-- Create a support rep user for testing
INSERT INTO users (
    id,
    email,
    password_hash,
    display_name_en,
    display_name_ar,
    role,
    status,
    is_platform_user,
    platform_organization_id,
    created_at,
    updated_at,
    version
) VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'support@liyaqa.com',
    -- BCrypt hash for: Support123!
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5GStS5PjC6f.g5NWsq',
    'Support Representative',
    'ممثل الدعم',
    'SUPPORT',
    'ACTIVE',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
) ON CONFLICT (email) DO NOTHING;
