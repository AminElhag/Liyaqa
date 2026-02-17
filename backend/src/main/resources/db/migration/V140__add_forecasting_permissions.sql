-- Add forecasting and budget permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at) VALUES
(gen_random_uuid(), 'forecasting_view', 'forecasting', 'view', 'View Forecasts', 'عرض التوقعات', 'View revenue and membership forecasts', 'عرض توقعات الإيرادات والعضويات', NOW()),
(gen_random_uuid(), 'forecasting_manage', 'forecasting', 'manage', 'Manage Forecasts', 'إدارة التوقعات', 'Create, update, and manage forecast models and scenarios', 'إنشاء وتحديث وإدارة نماذج وسيناريوهات التوقعات', NOW()),
(gen_random_uuid(), 'budgets_view', 'forecasting', 'view', 'View Budgets', 'عرض الميزانيات', 'View budget plans and actuals', 'عرض خطط الميزانية والفعلية', NOW()),
(gen_random_uuid(), 'budgets_manage', 'forecasting', 'manage', 'Manage Budgets', 'إدارة الميزانيات', 'Create, update, and delete budgets', 'إنشاء وتحديث وحذف الميزانيات', NOW());

-- Grant all forecasting permissions to SUPER_ADMIN and CLUB_ADMIN
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', id FROM permissions WHERE code IN ('forecasting_view', 'forecasting_manage', 'budgets_view', 'budgets_manage');

INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', id FROM permissions WHERE code IN ('forecasting_view', 'forecasting_manage', 'budgets_view', 'budgets_manage');

-- Grant read-only forecasting permissions to STAFF
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', id FROM permissions WHERE code IN ('forecasting_view', 'budgets_view');

-- Grant permissions to existing users with SUPER_ADMIN and CLUB_ADMIN roles
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('forecasting_view', 'forecasting_manage', 'budgets_view', 'budgets_manage')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Grant read-only forecasting permissions to existing STAFF users
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code IN ('forecasting_view', 'budgets_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);
