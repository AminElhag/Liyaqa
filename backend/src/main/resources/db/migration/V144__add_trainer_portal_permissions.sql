-- V144: Add trainer portal permissions
-- Controllers require trainer_portal_view, trainer_portal_update, trainer_earnings_manage
-- but these were never inserted into the permissions table, causing 403 on all trainer portal endpoints.

-- 1. Insert trainer portal permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at)
VALUES
    (gen_random_uuid(), 'trainer_portal_view', 'trainer_portal', 'view', 'View Trainer Portal', 'عرض بوابة المدرب', 'View trainer portal dashboard and data', 'عرض لوحة تحكم ومعلومات بوابة المدرب', NOW()),
    (gen_random_uuid(), 'trainer_portal_update', 'trainer_portal', 'update', 'Update Trainer Portal', 'تحديث بوابة المدرب', 'Update trainer schedules, certifications, and client notes', 'تحديث جداول المدرب والشهادات وملاحظات العملاء', NOW()),
    (gen_random_uuid(), 'trainer_earnings_manage', 'trainer_portal', 'manage', 'Manage Trainer Earnings', 'إدارة أرباح المدرب', 'Manage trainer earnings and payouts', 'إدارة أرباح ومدفوعات المدرب', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Grant to SUPER_ADMIN role (all 3)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', p.id FROM permissions p
WHERE p.code IN ('trainer_portal_view', 'trainer_portal_update', 'trainer_earnings_manage')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'SUPER_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to CLUB_ADMIN role (all 3)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', p.id FROM permissions p
WHERE p.code IN ('trainer_portal_view', 'trainer_portal_update', 'trainer_earnings_manage')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'CLUB_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to TRAINER role (view and update — trainers can view their own portal and update their data)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'TRAINER', p.id FROM permissions p
WHERE p.code IN ('trainer_portal_view', 'trainer_portal_update')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'TRAINER' AND rdp.permission_id = p.id
);

-- Grant to STAFF role (view only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', p.id FROM permissions p
WHERE p.code IN ('trainer_portal_view')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'STAFF' AND rdp.permission_id = p.id
);

-- 3. Backfill existing SUPER_ADMIN and CLUB_ADMIN users (all 3 permissions)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('trainer_portal_view', 'trainer_portal_update', 'trainer_earnings_manage')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing TRAINER users (view and update)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'TRAINER'
AND p.code IN ('trainer_portal_view', 'trainer_portal_update')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing STAFF users (view only)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code IN ('trainer_portal_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);
