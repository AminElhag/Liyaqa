-- V84: Fix lead permissions that were incorrectly created in V45
-- V45 used wrong column names and non-existent tables

-- First, delete any incorrectly inserted permissions from V45
DELETE FROM permissions WHERE name IN (
    'leads_create', 'leads_read', 'leads_update', 'leads_delete',
    'leads_assign', 'leads_convert', 'lead_activities_create', 'lead_activities_read'
) AND code IS NULL;

-- Insert lead permissions with correct schema (using 'code' column)
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar)
VALUES
    (gen_random_uuid(), 'leads_create', 'leads', 'create', 'Create Leads', 'إنشاء العملاء المحتملين', 'Create new leads', 'إنشاء عملاء محتملين جدد'),
    (gen_random_uuid(), 'leads_read', 'leads', 'read', 'View Leads', 'عرض العملاء المحتملين', 'View lead list and details', 'عرض قائمة العملاء المحتملين وتفاصيلهم'),
    (gen_random_uuid(), 'leads_update', 'leads', 'update', 'Update Leads', 'تحديث العملاء المحتملين', 'Edit lead information', 'تحرير معلومات العملاء المحتملين'),
    (gen_random_uuid(), 'leads_delete', 'leads', 'delete', 'Delete Leads', 'حذف العملاء المحتملين', 'Delete leads', 'حذف العملاء المحتملين'),
    (gen_random_uuid(), 'leads_assign', 'leads', 'assign', 'Assign Leads', 'تعيين العملاء المحتملين', 'Assign leads to users', 'تعيين العملاء المحتملين للمستخدمين'),
    (gen_random_uuid(), 'leads_convert', 'leads', 'convert', 'Convert Leads', 'تحويل العملاء المحتملين', 'Convert leads to members', 'تحويل العملاء المحتملين إلى أعضاء'),
    (gen_random_uuid(), 'lead_activities_create', 'leads', 'activity_create', 'Log Lead Activities', 'تسجيل أنشطة العملاء', 'Log activities for leads', 'تسجيل الأنشطة للعملاء المحتملين'),
    (gen_random_uuid(), 'lead_activities_read', 'leads', 'activity_read', 'View Lead Activities', 'عرض أنشطة العملاء', 'View lead activity history', 'عرض سجل أنشطة العملاء المحتملين')
ON CONFLICT (code) DO NOTHING;

-- Grant lead permissions to SUPER_ADMIN role
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', id FROM permissions
WHERE code IN ('leads_create', 'leads_read', 'leads_update', 'leads_delete', 'leads_assign', 'leads_convert', 'lead_activities_create', 'lead_activities_read')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant lead permissions to CLUB_ADMIN role
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', id FROM permissions
WHERE code IN ('leads_create', 'leads_read', 'leads_update', 'leads_delete', 'leads_assign', 'leads_convert', 'lead_activities_create', 'lead_activities_read')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant lead permissions to STAFF role (view and create only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', id FROM permissions
WHERE code IN ('leads_read', 'leads_create', 'leads_update', 'lead_activities_create', 'lead_activities_read')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant permissions to existing SUPER_ADMIN and CLUB_ADMIN users
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN ('leads_create', 'leads_read', 'leads_update', 'leads_delete', 'leads_assign', 'leads_convert', 'lead_activities_create', 'lead_activities_read')
ON CONFLICT (user_id, permission_id) DO NOTHING;
