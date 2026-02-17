-- V142: Add access control permissions missing from AccessControlController
-- AccessControlController requires: access_control_view, access_control_manage, access_cards_view,
-- access_cards_manage, biometrics_view, biometrics_manage, access_logs_view, occupancy_view
-- V56 tried to insert these using the old schema (name, description, category) but the table
-- was recreated with the new schema in V32, so the permissions were never created.

-- 1. Insert access control permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at)
VALUES
    (gen_random_uuid(), 'access_control_view', 'access_control', 'view', 'View Access Control', 'عرض التحكم بالوصول', 'View access control devices and zones', 'عرض أجهزة ومناطق التحكم بالوصول', NOW()),
    (gen_random_uuid(), 'access_control_manage', 'access_control', 'manage', 'Manage Access Control', 'إدارة التحكم بالوصول', 'Manage access control devices and zones', 'إدارة أجهزة ومناطق التحكم بالوصول', NOW()),
    (gen_random_uuid(), 'access_cards_view', 'access_cards', 'view', 'View Access Cards', 'عرض بطاقات الوصول', 'View access cards list and details', 'عرض قائمة بطاقات الوصول وتفاصيلها', NOW()),
    (gen_random_uuid(), 'access_cards_manage', 'access_cards', 'manage', 'Manage Access Cards', 'إدارة بطاقات الوصول', 'Issue, revoke, and manage access cards', 'إصدار وإلغاء وإدارة بطاقات الوصول', NOW()),
    (gen_random_uuid(), 'biometrics_view', 'biometrics', 'view', 'View Biometrics', 'عرض البيانات الحيوية', 'View biometric registrations', 'عرض تسجيلات البيانات الحيوية', NOW()),
    (gen_random_uuid(), 'biometrics_manage', 'biometrics', 'manage', 'Manage Biometrics', 'إدارة البيانات الحيوية', 'Manage biometric registrations and devices', 'إدارة تسجيلات البيانات الحيوية والأجهزة', NOW()),
    (gen_random_uuid(), 'access_logs_view', 'access_logs', 'view', 'View Access Logs', 'عرض سجلات الوصول', 'View access event logs', 'عرض سجلات أحداث الوصول', NOW()),
    (gen_random_uuid(), 'occupancy_view', 'occupancy', 'view', 'View Occupancy', 'عرض الإشغال', 'View real-time occupancy data', 'عرض بيانات الإشغال الفوري', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Grant to SUPER_ADMIN role (all 8)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', p.id FROM permissions p
WHERE p.code IN ('access_control_view', 'access_control_manage', 'access_cards_view', 'access_cards_manage',
                 'biometrics_view', 'biometrics_manage', 'access_logs_view', 'occupancy_view')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'SUPER_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to CLUB_ADMIN role (all 8)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', p.id FROM permissions p
WHERE p.code IN ('access_control_view', 'access_control_manage', 'access_cards_view', 'access_cards_manage',
                 'biometrics_view', 'biometrics_manage', 'access_logs_view', 'occupancy_view')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'CLUB_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to STAFF role (view-only: access_control_view, access_cards_view, access_logs_view, occupancy_view)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', p.id FROM permissions p
WHERE p.code IN ('access_control_view', 'access_cards_view', 'access_logs_view', 'occupancy_view')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'STAFF' AND rdp.permission_id = p.id
);

-- Grant to TRAINER role (occupancy_view only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'TRAINER', p.id FROM permissions p
WHERE p.code IN ('occupancy_view')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'TRAINER' AND rdp.permission_id = p.id
);

-- 3. Backfill existing SUPER_ADMIN and CLUB_ADMIN users (all 8 permissions)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('access_control_view', 'access_control_manage', 'access_cards_view', 'access_cards_manage',
               'biometrics_view', 'biometrics_manage', 'access_logs_view', 'occupancy_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing STAFF users (view-only)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code IN ('access_control_view', 'access_cards_view', 'access_logs_view', 'occupancy_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing TRAINER users (occupancy_view only)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'TRAINER'
AND p.code IN ('occupancy_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);
