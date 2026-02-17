-- Add loyalty permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at) VALUES
(gen_random_uuid(), 'loyalty_config_view', 'loyalty', 'view', 'View Loyalty Config', 'عرض إعدادات الولاء', 'View loyalty program configuration', 'عرض إعدادات برنامج الولاء', NOW()),
(gen_random_uuid(), 'loyalty_config_update', 'loyalty', 'update', 'Update Loyalty Config', 'تحديث إعدادات الولاء', 'Update loyalty program configuration', 'تحديث إعدادات برنامج الولاء', NOW()),
(gen_random_uuid(), 'loyalty_leaderboard_view', 'loyalty', 'view', 'View Leaderboard', 'عرض لوحة المتصدرين', 'View loyalty points leaderboard', 'عرض لوحة متصدري نقاط الولاء', NOW()),
(gen_random_uuid(), 'loyalty_points_manage', 'loyalty', 'manage', 'Manage Points', 'إدارة النقاط', 'Earn, redeem, and adjust member loyalty points', 'كسب واستبدال وتعديل نقاط ولاء الأعضاء', NOW());

-- Grant all loyalty permissions to SUPER_ADMIN and CLUB_ADMIN
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', id FROM permissions WHERE code IN ('loyalty_config_view', 'loyalty_config_update', 'loyalty_leaderboard_view', 'loyalty_points_manage');

INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', id FROM permissions WHERE code IN ('loyalty_config_view', 'loyalty_config_update', 'loyalty_leaderboard_view', 'loyalty_points_manage');

-- Grant read-only loyalty permissions to STAFF
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', id FROM permissions WHERE code IN ('loyalty_config_view', 'loyalty_leaderboard_view');

-- Grant permissions to existing users with SUPER_ADMIN and CLUB_ADMIN roles
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('loyalty_config_view', 'loyalty_config_update', 'loyalty_leaderboard_view', 'loyalty_points_manage')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Grant read-only loyalty permissions to existing STAFF users
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code IN ('loyalty_config_view', 'loyalty_leaderboard_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);
