-- V125: Add task permissions that were missing since V79 (member_tasks table)
-- MemberTaskController requires tasks_create, tasks_view, tasks_manage but they were never inserted

-- 1. Insert task permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at)
VALUES
    (gen_random_uuid(), 'tasks_create', 'tasks', 'create', 'Create Tasks', 'إنشاء المهام', 'Create new tasks', 'إنشاء مهام جديدة', NOW()),
    (gen_random_uuid(), 'tasks_view', 'tasks', 'view', 'View Tasks', 'عرض المهام', 'View task list and details', 'عرض قائمة المهام وتفاصيلها', NOW()),
    (gen_random_uuid(), 'tasks_manage', 'tasks', 'manage', 'Manage Tasks', 'إدارة المهام', 'Update, assign, complete, and cancel tasks', 'تحديث وتعيين وإكمال وإلغاء المهام', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Grant to SUPER_ADMIN role (all 3)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', p.id FROM permissions p
WHERE p.code IN ('tasks_create', 'tasks_view', 'tasks_manage')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'SUPER_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to CLUB_ADMIN role (all 3)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', p.id FROM permissions p
WHERE p.code IN ('tasks_create', 'tasks_view', 'tasks_manage')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'CLUB_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to STAFF role (create and view only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', p.id FROM permissions p
WHERE p.code IN ('tasks_create', 'tasks_view')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'STAFF' AND rdp.permission_id = p.id
);

-- 3. Backfill existing SUPER_ADMIN and CLUB_ADMIN users (all 3 permissions)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('tasks_create', 'tasks_view', 'tasks_manage')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing STAFF users (create and view only)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code IN ('tasks_create', 'tasks_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);
