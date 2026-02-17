-- Backfill employee records for existing staff users (SUPER_ADMIN, CLUB_ADMIN, STAFF).
-- These roles map to AccountType.EMPLOYEE but no Employee record was created at registration time.

INSERT INTO employees (id, tenant_id, organization_id, user_id, first_name_en, first_name_ar,
                       last_name_en, last_name_ar, email, hire_date, employment_type, status,
                       created_at, updated_at, version)
SELECT
    gen_random_uuid(),
    u.tenant_id,
    c.organization_id,
    u.id,
    COALESCE(u.display_name_en, split_part(u.email, '@', 1)),
    u.display_name_ar,
    '',
    NULL,
    u.email,
    u.created_at::date,
    'FULL_TIME',
    'ACTIVE',
    NOW(),
    NOW(),
    0
FROM users u
JOIN clubs c ON c.id = u.tenant_id
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id);

-- Ensure these users have EMPLOYEE account type
INSERT INTO user_account_types (user_id, account_type)
SELECT u.id, 'EMPLOYEE'
FROM users u
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')
  AND NOT EXISTS (
      SELECT 1 FROM user_account_types uat
      WHERE uat.user_id = u.id AND uat.account_type = 'EMPLOYEE'
  );
