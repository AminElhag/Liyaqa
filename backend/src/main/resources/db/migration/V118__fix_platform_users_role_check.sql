-- Fix platform_users_role_check to include all 6 RBAC roles
ALTER TABLE platform_users DROP CONSTRAINT platform_users_role_check;
ALTER TABLE platform_users ADD CONSTRAINT platform_users_role_check
  CHECK (role IN ('PLATFORM_SUPER_ADMIN', 'PLATFORM_ADMIN', 'ACCOUNT_MANAGER', 'SUPPORT_LEAD', 'SUPPORT_AGENT', 'PLATFORM_VIEWER'));
