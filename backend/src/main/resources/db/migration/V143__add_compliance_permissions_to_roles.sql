-- V143: Add compliance/security/data-protection permissions
-- V61 tried to insert these using the old schema (name, description, category) but the table
-- uses (code, module, action, name_en, name_ar, description_en, description_ar).
-- The inserts failed silently due to ON CONFLICT DO NOTHING, and V61 never granted
-- them to roles or users anyway. This migration fixes both issues.

-- 1. Insert compliance permissions into the permissions table
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at)
VALUES
    (gen_random_uuid(), 'compliance_view', 'compliance', 'view', 'View Compliance', 'عرض الامتثال', 'View compliance frameworks and status', 'عرض أطر ووضع الامتثال', NOW()),
    (gen_random_uuid(), 'compliance_manage', 'compliance', 'manage', 'Manage Compliance', 'إدارة الامتثال', 'Manage compliance frameworks and controls', 'إدارة أطر وضوابط الامتثال', NOW()),
    (gen_random_uuid(), 'compliance_reports', 'compliance', 'generate', 'Generate Compliance Reports', 'إنشاء تقارير الامتثال', 'Generate compliance reports', 'إنشاء تقارير الامتثال', NOW()),
    (gen_random_uuid(), 'security_events_view', 'security', 'view', 'View Security Events', 'عرض أحداث الأمان', 'View security events and alerts', 'عرض أحداث وتنبيهات الأمان', NOW()),
    (gen_random_uuid(), 'security_events_investigate', 'security', 'investigate', 'Investigate Security Events', 'التحقيق في أحداث الأمان', 'Investigate and resolve security events', 'التحقيق في أحداث الأمان وحلها', NOW()),
    (gen_random_uuid(), 'data_protection_view', 'data_protection', 'view', 'View Data Protection', 'عرض حماية البيانات', 'View data protection settings', 'عرض إعدادات حماية البيانات', NOW()),
    (gen_random_uuid(), 'data_protection_manage', 'data_protection', 'manage', 'Manage Data Protection', 'إدارة حماية البيانات', 'Manage data protection settings', 'إدارة إعدادات حماية البيانات', NOW()),
    (gen_random_uuid(), 'consent_view', 'data_protection', 'view', 'View Consent Records', 'عرض سجلات الموافقة', 'View consent records', 'عرض سجلات الموافقة', NOW()),
    (gen_random_uuid(), 'consent_manage', 'data_protection', 'manage', 'Manage Consent', 'إدارة الموافقة', 'Manage consent settings and records', 'إدارة إعدادات وسجلات الموافقة', NOW()),
    (gen_random_uuid(), 'dsr_view', 'data_protection', 'view', 'View Data Subject Requests', 'عرض طلبات أصحاب البيانات', 'View data subject requests', 'عرض طلبات أصحاب البيانات', NOW()),
    (gen_random_uuid(), 'dsr_process', 'data_protection', 'process', 'Process Data Subject Requests', 'معالجة طلبات أصحاب البيانات', 'Process and respond to data subject requests', 'معالجة والرد على طلبات أصحاب البيانات', NOW()),
    (gen_random_uuid(), 'breach_view', 'data_protection', 'view', 'View Breach Reports', 'عرض تقارير الاختراق', 'View data breach reports', 'عرض تقارير اختراق البيانات', NOW()),
    (gen_random_uuid(), 'breach_manage', 'data_protection', 'manage', 'Manage Breaches', 'إدارة الاختراقات', 'Manage and report data breaches', 'إدارة والإبلاغ عن اختراقات البيانات', NOW()),
    (gen_random_uuid(), 'risk_view', 'risk', 'view', 'View Risk Assessments', 'عرض تقييمات المخاطر', 'View risk assessments', 'عرض تقييمات المخاطر', NOW()),
    (gen_random_uuid(), 'risk_manage', 'risk', 'manage', 'Manage Risk Assessments', 'إدارة تقييمات المخاطر', 'Manage risk assessments and mitigations', 'إدارة تقييمات المخاطر والتخفيف', NOW()),
    (gen_random_uuid(), 'policy_view', 'policy', 'view', 'View Policies', 'عرض السياسات', 'View security and compliance policies', 'عرض سياسات الأمان والامتثال', NOW()),
    (gen_random_uuid(), 'policy_manage', 'policy', 'manage', 'Manage Policies', 'إدارة السياسات', 'Manage security and compliance policies', 'إدارة سياسات الأمان والامتثال', NOW()),
    (gen_random_uuid(), 'policy_approve', 'policy', 'approve', 'Approve Policies', 'اعتماد السياسات', 'Approve policy changes', 'اعتماد تغييرات السياسات', NOW()),
    (gen_random_uuid(), 'retention_view', 'data_retention', 'view', 'View Retention Policies', 'عرض سياسات الاحتفاظ', 'View data retention policies', 'عرض سياسات الاحتفاظ بالبيانات', NOW()),
    (gen_random_uuid(), 'retention_manage', 'data_retention', 'manage', 'Manage Retention Policies', 'إدارة سياسات الاحتفاظ', 'Manage data retention policies', 'إدارة سياسات الاحتفاظ بالبيانات', NOW()),
    (gen_random_uuid(), 'encryption_view', 'encryption', 'view', 'View Encryption Settings', 'عرض إعدادات التشفير', 'View encryption configuration', 'عرض إعدادات التشفير', NOW()),
    (gen_random_uuid(), 'encryption_manage', 'encryption', 'manage', 'Manage Encryption', 'إدارة التشفير', 'Manage encryption configuration and keys', 'إدارة إعدادات التشفير والمفاتيح', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Grant to role_default_permissions for SUPER_ADMIN and CLUB_ADMIN
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), r.role, p.id
FROM (VALUES ('SUPER_ADMIN'), ('CLUB_ADMIN')) AS r(role)
CROSS JOIN permissions p
WHERE p.code IN (
    'compliance_view', 'compliance_manage', 'compliance_reports',
    'security_events_view', 'security_events_investigate',
    'data_protection_view', 'data_protection_manage',
    'consent_view', 'consent_manage',
    'dsr_view', 'dsr_process',
    'breach_view', 'breach_manage',
    'risk_view', 'risk_manage',
    'policy_view', 'policy_manage', 'policy_approve',
    'retention_view', 'retention_manage',
    'encryption_view', 'encryption_manage'
)
AND NOT EXISTS (
    SELECT 1 FROM role_default_permissions rdp
    WHERE rdp.role = r.role AND rdp.permission_id = p.id
);

-- 3. Backfill existing SUPER_ADMIN and CLUB_ADMIN users
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN')
AND p.code IN (
    'compliance_view', 'compliance_manage', 'compliance_reports',
    'security_events_view', 'security_events_investigate',
    'data_protection_view', 'data_protection_manage',
    'consent_view', 'consent_manage',
    'dsr_view', 'dsr_process',
    'breach_view', 'breach_manage',
    'risk_view', 'risk_manage',
    'policy_view', 'policy_manage', 'policy_approve',
    'retention_view', 'retention_manage',
    'encryption_view', 'encryption_manage'
)
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = u.id AND up.permission_id = p.id
);
