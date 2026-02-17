-- V138: Fix marketing permissions (V46 used wrong column names and non-existent tables)
-- This migration inserts the 10 marketing permissions using the correct schema,
-- grants them to SUPER_ADMIN/CLUB_ADMIN via role_default_permissions (for new users),
-- and grants them to ALL existing SUPER_ADMIN/CLUB_ADMIN users via user_permissions.

-- 1) Insert marketing permissions into the permissions table
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at)
VALUES
    (gen_random_uuid(), 'marketing_campaigns_create', 'marketing', 'create', 'Create Campaigns', 'إنشاء الحملات', 'Create marketing campaigns', 'إنشاء حملات تسويقية', NOW()),
    (gen_random_uuid(), 'marketing_campaigns_read', 'marketing', 'read', 'View Campaigns', 'عرض الحملات', 'View marketing campaigns', 'عرض الحملات التسويقية', NOW()),
    (gen_random_uuid(), 'marketing_campaigns_update', 'marketing', 'update', 'Update Campaigns', 'تحديث الحملات', 'Update marketing campaigns', 'تحديث الحملات التسويقية', NOW()),
    (gen_random_uuid(), 'marketing_campaigns_delete', 'marketing', 'delete', 'Delete Campaigns', 'حذف الحملات', 'Delete marketing campaigns', 'حذف الحملات التسويقية', NOW()),
    (gen_random_uuid(), 'marketing_campaigns_activate', 'marketing', 'activate', 'Activate Campaigns', 'تفعيل الحملات', 'Activate or pause campaigns', 'تفعيل أو إيقاف الحملات', NOW()),
    (gen_random_uuid(), 'marketing_segments_create', 'marketing', 'create', 'Create Segments', 'إنشاء الشرائح', 'Create member segments', 'إنشاء شرائح الأعضاء', NOW()),
    (gen_random_uuid(), 'marketing_segments_read', 'marketing', 'read', 'View Segments', 'عرض الشرائح', 'View member segments', 'عرض شرائح الأعضاء', NOW()),
    (gen_random_uuid(), 'marketing_segments_update', 'marketing', 'update', 'Update Segments', 'تحديث الشرائح', 'Update member segments', 'تحديث شرائح الأعضاء', NOW()),
    (gen_random_uuid(), 'marketing_segments_delete', 'marketing', 'delete', 'Delete Segments', 'حذف الشرائح', 'Delete member segments', 'حذف شرائح الأعضاء', NOW()),
    (gen_random_uuid(), 'marketing_analytics_read', 'marketing', 'read', 'View Marketing Analytics', 'عرض تحليلات التسويق', 'View marketing analytics', 'عرض تحليلات التسويق', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2) Grant to role_default_permissions so future SUPER_ADMIN/CLUB_ADMIN users get them
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), r.role, p.id
FROM (VALUES ('SUPER_ADMIN'), ('CLUB_ADMIN')) AS r(role)
CROSS JOIN permissions p
WHERE p.code IN (
    'marketing_campaigns_create', 'marketing_campaigns_read', 'marketing_campaigns_update',
    'marketing_campaigns_delete', 'marketing_campaigns_activate',
    'marketing_segments_create', 'marketing_segments_read', 'marketing_segments_update',
    'marketing_segments_delete', 'marketing_analytics_read'
)
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp
    WHERE rdp.role = r.role AND rdp.permission_id = p.id
);

-- 3) Grant to ALL existing SUPER_ADMIN/CLUB_ADMIN users so they work immediately
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN (
    'marketing_campaigns_create', 'marketing_campaigns_read', 'marketing_campaigns_update',
    'marketing_campaigns_delete', 'marketing_campaigns_activate',
    'marketing_segments_create', 'marketing_segments_read', 'marketing_segments_update',
    'marketing_segments_delete', 'marketing_analytics_read'
)
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = u.id AND up.permission_id = p.id
);
