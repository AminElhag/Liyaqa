-- V132: Add user_account_types join table for multi-account-type support
-- A user can hold multiple account types (EMPLOYEE, TRAINER, MEMBER) within a tenant.

CREATE TABLE user_account_types (
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_type  VARCHAR(20)  NOT NULL,
    PRIMARY KEY (user_id, account_type),
    CONSTRAINT chk_account_type CHECK (account_type IN ('EMPLOYEE', 'TRAINER', 'MEMBER'))
);

CREATE INDEX idx_user_account_types_user_id ON user_account_types(user_id);

-- Migrate existing data from role column:
-- SUPER_ADMIN, CLUB_ADMIN, STAFF → EMPLOYEE
INSERT INTO user_account_types (user_id, account_type)
SELECT id, 'EMPLOYEE'
FROM users
WHERE role IN ('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')
  AND is_platform_user = false
ON CONFLICT DO NOTHING;

-- TRAINER → TRAINER
INSERT INTO user_account_types (user_id, account_type)
SELECT id, 'TRAINER'
FROM users
WHERE role = 'TRAINER'
  AND is_platform_user = false
ON CONFLICT DO NOTHING;

-- MEMBER → MEMBER
INSERT INTO user_account_types (user_id, account_type)
SELECT id, 'MEMBER'
FROM users
WHERE role = 'MEMBER'
  AND is_platform_user = false
ON CONFLICT DO NOTHING;

-- Cross-reference: any user linked to a member record should also have MEMBER type
INSERT INTO user_account_types (user_id, account_type)
SELECT u.id, 'MEMBER'
FROM users u
WHERE u.member_id IS NOT NULL
  AND u.is_platform_user = false
ON CONFLICT DO NOTHING;

-- Cross-reference: any user referenced by trainers table should also have TRAINER type
INSERT INTO user_account_types (user_id, account_type)
SELECT t.user_id, 'TRAINER'
FROM trainers t
WHERE t.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Cross-reference: any user referenced by employees table should also have EMPLOYEE type
INSERT INTO user_account_types (user_id, account_type)
SELECT e.user_id, 'EMPLOYEE'
FROM employees e
WHERE e.user_id IS NOT NULL
ON CONFLICT DO NOTHING;
