-- Add wallet permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar) VALUES
(gen_random_uuid(), 'wallets_view', 'wallets', 'view', 'View Wallets', 'عرض المحافظ', 'View member wallet balances and transactions', 'عرض أرصدة ومعاملات محافظ الأعضاء'),
(gen_random_uuid(), 'wallets_update', 'wallets', 'update', 'Update Wallets', 'تحديث المحافظ', 'Add credit, debit, and adjust wallet balances', 'إضافة رصيد وخصم وتعديل أرصدة المحافظ');

-- Grant wallet permissions to SUPER_ADMIN and CLUB_ADMIN
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', id FROM permissions WHERE code IN ('wallets_view', 'wallets_update');

INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', id FROM permissions WHERE code IN ('wallets_view', 'wallets_update');

-- Grant wallets_view to STAFF (they can view but not modify)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', id FROM permissions WHERE code = 'wallets_view';

-- Grant permissions to existing users with SUPER_ADMIN and CLUB_ADMIN roles
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('wallets_view', 'wallets_update')
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- Grant wallets_view to existing STAFF users
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code = 'wallets_view'
ON CONFLICT (user_id, permission_id) DO NOTHING;
