-- V135: Add PT session permissions missing from PersonalTrainingController
-- Controller requires pt_sessions_view, pt_sessions_create, pt_sessions_update, pt_sessions_delete
-- but these were never inserted into the permissions table

-- 1. Insert PT session permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at)
VALUES
    (gen_random_uuid(), 'pt_sessions_view', 'pt_sessions', 'view', 'View PT Sessions', 'عرض جلسات التدريب الشخصي', 'View personal training sessions', 'عرض جلسات التدريب الشخصي', NOW()),
    (gen_random_uuid(), 'pt_sessions_create', 'pt_sessions', 'create', 'Create PT Sessions', 'إنشاء جلسات التدريب الشخصي', 'Book new personal training sessions', 'حجز جلسات تدريب شخصي جديدة', NOW()),
    (gen_random_uuid(), 'pt_sessions_update', 'pt_sessions', 'update', 'Update PT Sessions', 'تحديث جلسات التدريب الشخصي', 'Confirm, complete, cancel, and reschedule sessions', 'تأكيد وإكمال وإلغاء وإعادة جدولة الجلسات', NOW()),
    (gen_random_uuid(), 'pt_sessions_delete', 'pt_sessions', 'delete', 'Delete PT Sessions', 'حذف جلسات التدريب الشخصي', 'Permanently delete PT sessions', 'حذف جلسات التدريب الشخصي نهائياً', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Grant to SUPER_ADMIN role (all 4)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', p.id FROM permissions p
WHERE p.code IN ('pt_sessions_view', 'pt_sessions_create', 'pt_sessions_update', 'pt_sessions_delete')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'SUPER_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to CLUB_ADMIN role (all 4)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', p.id FROM permissions p
WHERE p.code IN ('pt_sessions_view', 'pt_sessions_create', 'pt_sessions_update', 'pt_sessions_delete')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'CLUB_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to STAFF role (view and create only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', p.id FROM permissions p
WHERE p.code IN ('pt_sessions_view', 'pt_sessions_create')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'STAFF' AND rdp.permission_id = p.id
);

-- Grant to TRAINER role (view and update only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'TRAINER', p.id FROM permissions p
WHERE p.code IN ('pt_sessions_view', 'pt_sessions_update')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'TRAINER' AND rdp.permission_id = p.id
);

-- 3. Backfill existing SUPER_ADMIN and CLUB_ADMIN users (all 4 permissions)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('pt_sessions_view', 'pt_sessions_create', 'pt_sessions_update', 'pt_sessions_delete')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing STAFF users (view and create only)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code IN ('pt_sessions_view', 'pt_sessions_create')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing TRAINER users (view and update only)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'TRAINER'
AND p.code IN ('pt_sessions_view', 'pt_sessions_update')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);
