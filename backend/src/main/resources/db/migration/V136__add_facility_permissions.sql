-- V136: Add facility permissions missing from FacilityController and FacilityBookingController
-- FacilityController requires: facilities_view, facilities_create, facilities_update, facilities_delete
-- FacilityBookingController requires: facility_bookings_view, facility_bookings_create, facility_bookings_manage
-- These were never inserted into the permissions table (facility tables created in V52 but permissions forgotten)

-- 1. Insert facility permissions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at)
VALUES
    (gen_random_uuid(), 'facilities_view', 'facilities', 'view', 'View Facilities', 'عرض المرافق', 'View facility list and details', 'عرض قائمة المرافق وتفاصيلها', NOW()),
    (gen_random_uuid(), 'facilities_create', 'facilities', 'create', 'Create Facilities', 'إنشاء المرافق', 'Create new facilities', 'إنشاء مرافق جديدة', NOW()),
    (gen_random_uuid(), 'facilities_update', 'facilities', 'update', 'Update Facilities', 'تحديث المرافق', 'Update facility details, activate, deactivate, and generate slots', 'تحديث تفاصيل المرافق وتفعيلها وتعطيلها وإنشاء الفترات', NOW()),
    (gen_random_uuid(), 'facilities_delete', 'facilities', 'delete', 'Delete Facilities', 'حذف المرافق', 'Delete facilities', 'حذف المرافق', NOW()),
    (gen_random_uuid(), 'facility_bookings_view', 'facility_bookings', 'view', 'View Facility Bookings', 'عرض حجوزات المرافق', 'View facility bookings list and details', 'عرض قائمة حجوزات المرافق وتفاصيلها', NOW()),
    (gen_random_uuid(), 'facility_bookings_create', 'facility_bookings', 'create', 'Create Facility Bookings', 'إنشاء حجوزات المرافق', 'Book facility time slots', 'حجز فترات المرافق', NOW()),
    (gen_random_uuid(), 'facility_bookings_manage', 'facility_bookings', 'manage', 'Manage Facility Bookings', 'إدارة حجوزات المرافق', 'Check in, complete, cancel, and mark no-show for bookings', 'تسجيل الحضور وإكمال وإلغاء وتسجيل عدم الحضور للحجوزات', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Grant to SUPER_ADMIN role (all 7)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', p.id FROM permissions p
WHERE p.code IN ('facilities_view', 'facilities_create', 'facilities_update', 'facilities_delete',
                 'facility_bookings_view', 'facility_bookings_create', 'facility_bookings_manage')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'SUPER_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to CLUB_ADMIN role (all 7)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', p.id FROM permissions p
WHERE p.code IN ('facilities_view', 'facilities_create', 'facilities_update', 'facilities_delete',
                 'facility_bookings_view', 'facility_bookings_create', 'facility_bookings_manage')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'CLUB_ADMIN' AND rdp.permission_id = p.id
);

-- Grant to STAFF role (view facilities, view + create bookings)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', p.id FROM permissions p
WHERE p.code IN ('facilities_view', 'facility_bookings_view', 'facility_bookings_create')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'STAFF' AND rdp.permission_id = p.id
);

-- Grant to TRAINER role (view bookings only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'TRAINER', p.id FROM permissions p
WHERE p.code IN ('facility_bookings_view')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'TRAINER' AND rdp.permission_id = p.id
);

-- Grant to MEMBER role (view + create bookings)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'MEMBER', p.id FROM permissions p
WHERE p.code IN ('facility_bookings_view', 'facility_bookings_create')
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp WHERE rdp.role = 'MEMBER' AND rdp.permission_id = p.id
);

-- 3. Backfill existing SUPER_ADMIN and CLUB_ADMIN users (all 7 permissions)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('facilities_view', 'facilities_create', 'facilities_update', 'facilities_delete',
               'facility_bookings_view', 'facility_bookings_create', 'facility_bookings_manage')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing STAFF users (view facilities, view + create bookings)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'STAFF'
AND p.code IN ('facilities_view', 'facility_bookings_view', 'facility_bookings_create')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing TRAINER users (view bookings only)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'TRAINER'
AND p.code IN ('facility_bookings_view')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);

-- Backfill existing MEMBER users (view + create bookings)
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'MEMBER'
AND p.code IN ('facility_bookings_view', 'facility_bookings_create')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_id = p.id
);
