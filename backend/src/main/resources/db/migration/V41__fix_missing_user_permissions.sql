-- Fix missing user permissions for existing users
-- This migration grants default role permissions to users who have no permissions
-- (users created through flows that didn't call permissionService.grantDefaultPermissionsForRole)

-- Insert default role permissions for users who have no permissions
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, rdp.permission_id, NOW()
FROM users u
JOIN role_default_permissions rdp ON rdp.role = u.role
WHERE NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id
)
-- Avoid duplicates (in case of partial inserts)
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up2
    WHERE up2.user_id = u.id AND up2.permission_id = rdp.permission_id
);
