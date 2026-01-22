-- Permission definitions (static reference data)
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en VARCHAR(500),
    description_ar VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User permissions (many-to-many)
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- Role default permissions (for auto-granting on user creation)
CREATE TABLE role_default_permissions (
    id UUID PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role, permission_id)
);

-- Indexes
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_role_default_permissions_role ON role_default_permissions(role);

-- Insert all permission definitions
INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar) VALUES
-- Members module
(gen_random_uuid(), 'members_view', 'members', 'view', 'View Members', 'عرض الأعضاء', 'View member list and details', 'عرض قائمة الأعضاء وتفاصيلهم'),
(gen_random_uuid(), 'members_create', 'members', 'create', 'Create Members', 'إنشاء الأعضاء', 'Create new members', 'إنشاء أعضاء جدد'),
(gen_random_uuid(), 'members_update', 'members', 'update', 'Update Members', 'تحديث الأعضاء', 'Edit member information', 'تحرير معلومات الأعضاء'),
(gen_random_uuid(), 'members_delete', 'members', 'delete', 'Delete Members', 'حذف الأعضاء', 'Delete members from system', 'حذف الأعضاء من النظام'),
(gen_random_uuid(), 'members_export', 'members', 'export', 'Export Members', 'تصدير الأعضاء', 'Export member data to CSV', 'تصدير بيانات الأعضاء إلى CSV'),

-- Subscriptions module
(gen_random_uuid(), 'subscriptions_view', 'subscriptions', 'view', 'View Subscriptions', 'عرض الاشتراكات', 'View subscription list and details', 'عرض قائمة الاشتراكات وتفاصيلها'),
(gen_random_uuid(), 'subscriptions_create', 'subscriptions', 'create', 'Create Subscriptions', 'إنشاء الاشتراكات', 'Create new subscriptions', 'إنشاء اشتراكات جديدة'),
(gen_random_uuid(), 'subscriptions_update', 'subscriptions', 'update', 'Update Subscriptions', 'تحديث الاشتراكات', 'Edit subscription details', 'تحرير تفاصيل الاشتراكات'),
(gen_random_uuid(), 'subscriptions_cancel', 'subscriptions', 'cancel', 'Cancel Subscriptions', 'إلغاء الاشتراكات', 'Cancel active subscriptions', 'إلغاء الاشتراكات النشطة'),
(gen_random_uuid(), 'subscriptions_freeze', 'subscriptions', 'freeze', 'Freeze Subscriptions', 'تجميد الاشتراكات', 'Freeze and unfreeze subscriptions', 'تجميد وإلغاء تجميد الاشتراكات'),

-- Invoices module
(gen_random_uuid(), 'invoices_view', 'invoices', 'view', 'View Invoices', 'عرض الفواتير', 'View invoice list and details', 'عرض قائمة الفواتير وتفاصيلها'),
(gen_random_uuid(), 'invoices_create', 'invoices', 'create', 'Create Invoices', 'إنشاء الفواتير', 'Create new invoices', 'إنشاء فواتير جديدة'),
(gen_random_uuid(), 'invoices_update', 'invoices', 'update', 'Update Invoices', 'تحديث الفواتير', 'Edit invoice details', 'تحرير تفاصيل الفواتير'),
(gen_random_uuid(), 'invoices_delete', 'invoices', 'delete', 'Delete Invoices', 'حذف الفواتير', 'Delete draft invoices', 'حذف الفواتير المسودة'),
(gen_random_uuid(), 'invoices_issue', 'invoices', 'issue', 'Issue Invoices', 'إصدار الفواتير', 'Issue invoices to members', 'إصدار الفواتير للأعضاء'),
(gen_random_uuid(), 'invoices_pay', 'invoices', 'pay', 'Record Payments', 'تسجيل المدفوعات', 'Record invoice payments', 'تسجيل مدفوعات الفواتير'),
(gen_random_uuid(), 'invoices_export', 'invoices', 'export', 'Export Invoices', 'تصدير الفواتير', 'Export invoice data to CSV', 'تصدير بيانات الفواتير إلى CSV'),

-- Attendance module
(gen_random_uuid(), 'attendance_view', 'attendance', 'view', 'View Attendance', 'عرض الحضور', 'View attendance records', 'عرض سجلات الحضور'),
(gen_random_uuid(), 'attendance_checkin', 'attendance', 'checkin', 'Check In Members', 'تسجيل دخول الأعضاء', 'Check members into the facility', 'تسجيل دخول الأعضاء إلى المنشأة'),
(gen_random_uuid(), 'attendance_checkout', 'attendance', 'checkout', 'Check Out Members', 'تسجيل خروج الأعضاء', 'Check members out of the facility', 'تسجيل خروج الأعضاء من المنشأة'),
(gen_random_uuid(), 'attendance_export', 'attendance', 'export', 'Export Attendance', 'تصدير الحضور', 'Export attendance data to CSV', 'تصدير بيانات الحضور إلى CSV'),

-- Classes module
(gen_random_uuid(), 'classes_view', 'classes', 'view', 'View Classes', 'عرض الفصول', 'View class list and details', 'عرض قائمة الفصول وتفاصيلها'),
(gen_random_uuid(), 'classes_create', 'classes', 'create', 'Create Classes', 'إنشاء الفصول', 'Create new classes', 'إنشاء فصول جديدة'),
(gen_random_uuid(), 'classes_update', 'classes', 'update', 'Update Classes', 'تحديث الفصول', 'Edit class details', 'تحرير تفاصيل الفصول'),
(gen_random_uuid(), 'classes_delete', 'classes', 'delete', 'Delete Classes', 'حذف الفصول', 'Delete classes from system', 'حذف الفصول من النظام'),

-- Sessions module
(gen_random_uuid(), 'sessions_view', 'sessions', 'view', 'View Sessions', 'عرض الجلسات', 'View session list and details', 'عرض قائمة الجلسات وتفاصيلها'),
(gen_random_uuid(), 'sessions_create', 'sessions', 'create', 'Create Sessions', 'إنشاء الجلسات', 'Create new sessions', 'إنشاء جلسات جديدة'),
(gen_random_uuid(), 'sessions_update', 'sessions', 'update', 'Update Sessions', 'تحديث الجلسات', 'Edit session details', 'تحرير تفاصيل الجلسات'),
(gen_random_uuid(), 'sessions_cancel', 'sessions', 'cancel', 'Cancel Sessions', 'إلغاء الجلسات', 'Cancel scheduled sessions', 'إلغاء الجلسات المجدولة'),

-- Bookings module
(gen_random_uuid(), 'bookings_view', 'bookings', 'view', 'View Bookings', 'عرض الحجوزات', 'View booking list and details', 'عرض قائمة الحجوزات وتفاصيلها'),
(gen_random_uuid(), 'bookings_create', 'bookings', 'create', 'Create Bookings', 'إنشاء الحجوزات', 'Create new bookings', 'إنشاء حجوزات جديدة'),
(gen_random_uuid(), 'bookings_cancel', 'bookings', 'cancel', 'Cancel Bookings', 'إلغاء الحجوزات', 'Cancel existing bookings', 'إلغاء الحجوزات الحالية'),
(gen_random_uuid(), 'bookings_checkin', 'bookings', 'checkin', 'Check In Bookings', 'تسجيل حضور الحجوزات', 'Check in booking attendees', 'تسجيل حضور المحجوزين'),

-- Users module
(gen_random_uuid(), 'users_view', 'users', 'view', 'View Users', 'عرض المستخدمين', 'View user list and details', 'عرض قائمة المستخدمين وتفاصيلهم'),
(gen_random_uuid(), 'users_create', 'users', 'create', 'Create Users', 'إنشاء المستخدمين', 'Create new user accounts', 'إنشاء حسابات مستخدمين جديدة'),
(gen_random_uuid(), 'users_update', 'users', 'update', 'Update Users', 'تحديث المستخدمين', 'Edit user information', 'تحرير معلومات المستخدمين'),
(gen_random_uuid(), 'users_delete', 'users', 'delete', 'Delete Users', 'حذف المستخدمين', 'Delete user accounts', 'حذف حسابات المستخدمين'),
(gen_random_uuid(), 'users_permissions', 'users', 'permissions', 'Manage User Permissions', 'إدارة صلاحيات المستخدمين', 'Grant and revoke user permissions', 'منح وسحب صلاحيات المستخدمين'),

-- Employees module
(gen_random_uuid(), 'employees_view', 'employees', 'view', 'View Employees', 'عرض الموظفين', 'View employee list and details', 'عرض قائمة الموظفين وتفاصيلهم'),
(gen_random_uuid(), 'employees_create', 'employees', 'create', 'Create Employees', 'إنشاء الموظفين', 'Create new employee records', 'إنشاء سجلات موظفين جديدة'),
(gen_random_uuid(), 'employees_update', 'employees', 'update', 'Update Employees', 'تحديث الموظفين', 'Edit employee information', 'تحرير معلومات الموظفين'),
(gen_random_uuid(), 'employees_delete', 'employees', 'delete', 'Delete Employees', 'حذف الموظفين', 'Delete employee records', 'حذف سجلات الموظفين'),

-- Departments module
(gen_random_uuid(), 'departments_view', 'departments', 'view', 'View Departments', 'عرض الأقسام', 'View department list and details', 'عرض قائمة الأقسام وتفاصيلها'),
(gen_random_uuid(), 'departments_create', 'departments', 'create', 'Create Departments', 'إنشاء الأقسام', 'Create new departments', 'إنشاء أقسام جديدة'),
(gen_random_uuid(), 'departments_update', 'departments', 'update', 'Update Departments', 'تحديث الأقسام', 'Edit department information', 'تحرير معلومات الأقسام'),
(gen_random_uuid(), 'departments_delete', 'departments', 'delete', 'Delete Departments', 'حذف الأقسام', 'Delete departments', 'حذف الأقسام'),

-- Job Titles module
(gen_random_uuid(), 'job_titles_view', 'job_titles', 'view', 'View Job Titles', 'عرض المسميات الوظيفية', 'View job title list and details', 'عرض قائمة المسميات الوظيفية وتفاصيلها'),
(gen_random_uuid(), 'job_titles_create', 'job_titles', 'create', 'Create Job Titles', 'إنشاء المسميات الوظيفية', 'Create new job titles', 'إنشاء مسميات وظيفية جديدة'),
(gen_random_uuid(), 'job_titles_update', 'job_titles', 'update', 'Update Job Titles', 'تحديث المسميات الوظيفية', 'Edit job title information', 'تحرير معلومات المسميات الوظيفية'),
(gen_random_uuid(), 'job_titles_delete', 'job_titles', 'delete', 'Delete Job Titles', 'حذف المسميات الوظيفية', 'Delete job titles', 'حذف المسميات الوظيفية'),

-- Organizations module
(gen_random_uuid(), 'organizations_view', 'organizations', 'view', 'View Organizations', 'عرض المنظمات', 'View organization details', 'عرض تفاصيل المنظمات'),
(gen_random_uuid(), 'organizations_update', 'organizations', 'update', 'Update Organizations', 'تحديث المنظمات', 'Edit organization information', 'تحرير معلومات المنظمات'),

-- Clubs module
(gen_random_uuid(), 'clubs_view', 'clubs', 'view', 'View Clubs', 'عرض الأندية', 'View club list and details', 'عرض قائمة الأندية وتفاصيلها'),
(gen_random_uuid(), 'clubs_create', 'clubs', 'create', 'Create Clubs', 'إنشاء الأندية', 'Create new clubs', 'إنشاء أندية جديدة'),
(gen_random_uuid(), 'clubs_update', 'clubs', 'update', 'Update Clubs', 'تحديث الأندية', 'Edit club information', 'تحرير معلومات الأندية'),
(gen_random_uuid(), 'clubs_delete', 'clubs', 'delete', 'Delete Clubs', 'حذف الأندية', 'Delete clubs', 'حذف الأندية'),

-- Locations module
(gen_random_uuid(), 'locations_view', 'locations', 'view', 'View Locations', 'عرض المواقع', 'View location list and details', 'عرض قائمة المواقع وتفاصيلها'),
(gen_random_uuid(), 'locations_create', 'locations', 'create', 'Create Locations', 'إنشاء المواقع', 'Create new locations', 'إنشاء مواقع جديدة'),
(gen_random_uuid(), 'locations_update', 'locations', 'update', 'Update Locations', 'تحديث المواقع', 'Edit location information', 'تحرير معلومات المواقع'),
(gen_random_uuid(), 'locations_delete', 'locations', 'delete', 'Delete Locations', 'حذف المواقع', 'Delete locations', 'حذف المواقع'),

-- Plans module
(gen_random_uuid(), 'plans_view', 'plans', 'view', 'View Membership Plans', 'عرض خطط العضوية', 'View membership plan list and details', 'عرض قائمة خطط العضوية وتفاصيلها'),
(gen_random_uuid(), 'plans_create', 'plans', 'create', 'Create Membership Plans', 'إنشاء خطط العضوية', 'Create new membership plans', 'إنشاء خطط عضوية جديدة'),
(gen_random_uuid(), 'plans_update', 'plans', 'update', 'Update Membership Plans', 'تحديث خطط العضوية', 'Edit membership plan details', 'تحرير تفاصيل خطط العضوية'),
(gen_random_uuid(), 'plans_delete', 'plans', 'delete', 'Delete Membership Plans', 'حذف خطط العضوية', 'Delete membership plans', 'حذف خطط العضوية'),

-- Reports module
(gen_random_uuid(), 'reports_view', 'reports', 'view', 'View Reports', 'عرض التقارير', 'View system reports and analytics', 'عرض تقارير النظام والتحليلات'),
(gen_random_uuid(), 'reports_export', 'reports', 'export', 'Export Reports', 'تصدير التقارير', 'Export reports to file', 'تصدير التقارير إلى ملف'),

-- Dashboard module
(gen_random_uuid(), 'dashboard_view', 'dashboard', 'view', 'View Dashboard', 'عرض لوحة القيادة', 'View dashboard and statistics', 'عرض لوحة القيادة والإحصائيات'),

-- Settings module
(gen_random_uuid(), 'settings_view', 'settings', 'view', 'View Settings', 'عرض الإعدادات', 'View system settings', 'عرض إعدادات النظام'),
(gen_random_uuid(), 'settings_update', 'settings', 'update', 'Update Settings', 'تحديث الإعدادات', 'Modify system settings', 'تعديل إعدادات النظام'),

-- Trainers module
(gen_random_uuid(), 'trainers_view', 'trainers', 'view', 'View Trainers', 'عرض المدربين', 'View trainer list and details', 'عرض قائمة المدربين وتفاصيلهم'),
(gen_random_uuid(), 'trainers_create', 'trainers', 'create', 'Create Trainers', 'إنشاء المدربين', 'Create new trainer profiles', 'إنشاء ملفات مدربين جديدة'),
(gen_random_uuid(), 'trainers_update', 'trainers', 'update', 'Update Trainers', 'تحديث المدربين', 'Edit trainer information', 'تحرير معلومات المدربين'),
(gen_random_uuid(), 'trainers_delete', 'trainers', 'delete', 'Delete Trainers', 'حذف المدربين', 'Delete trainer profiles', 'حذف ملفات المدربين'),

-- Shop module
(gen_random_uuid(), 'shop_view', 'shop', 'view', 'View Shop Products', 'عرض منتجات المتجر', 'View product list and details', 'عرض قائمة المنتجات وتفاصيلها'),
(gen_random_uuid(), 'shop_create', 'shop', 'create', 'Create Products', 'إنشاء المنتجات', 'Create new products', 'إنشاء منتجات جديدة'),
(gen_random_uuid(), 'shop_update', 'shop', 'update', 'Update Products', 'تحديث المنتجات', 'Edit product information', 'تحرير معلومات المنتجات'),
(gen_random_uuid(), 'shop_delete', 'shop', 'delete', 'Delete Products', 'حذف المنتجات', 'Delete products', 'حذف المنتجات'),

-- Orders module
(gen_random_uuid(), 'orders_view', 'orders', 'view', 'View Orders', 'عرض الطلبات', 'View order list and details', 'عرض قائمة الطلبات وتفاصيلها'),
(gen_random_uuid(), 'orders_create', 'orders', 'create', 'Create Orders', 'إنشاء الطلبات', 'Create new orders', 'إنشاء طلبات جديدة'),
(gen_random_uuid(), 'orders_update', 'orders', 'update', 'Update Orders', 'تحديث الطلبات', 'Edit order details', 'تحرير تفاصيل الطلبات'),
(gen_random_uuid(), 'orders_cancel', 'orders', 'cancel', 'Cancel Orders', 'إلغاء الطلبات', 'Cancel orders', 'إلغاء الطلبات');

-- Grant all permissions to SUPER_ADMIN and CLUB_ADMIN users
INSERT INTO user_permissions (id, user_id, permission_id, granted_at)
SELECT gen_random_uuid(), u.id, p.id, NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role IN ('SUPER_ADMIN', 'CLUB_ADMIN');

-- Set up default permissions for each role
-- SUPER_ADMIN and CLUB_ADMIN get all permissions by default
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'SUPER_ADMIN', id FROM permissions;

INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'CLUB_ADMIN', id FROM permissions;

-- STAFF gets view and limited action permissions
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'STAFF', id FROM permissions
WHERE code IN (
    'members_view', 'members_create', 'members_update',
    'subscriptions_view', 'subscriptions_create',
    'invoices_view', 'invoices_create', 'invoices_pay',
    'attendance_view', 'attendance_checkin', 'attendance_checkout',
    'classes_view',
    'sessions_view',
    'bookings_view', 'bookings_create', 'bookings_cancel', 'bookings_checkin',
    'dashboard_view',
    'trainers_view',
    'shop_view',
    'orders_view', 'orders_create'
);

-- TRAINER gets limited permissions
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'TRAINER', id FROM permissions
WHERE code IN (
    'members_view',
    'attendance_view', 'attendance_checkin', 'attendance_checkout',
    'classes_view',
    'sessions_view', 'sessions_update',
    'bookings_view', 'bookings_checkin',
    'dashboard_view',
    'trainers_view'
);

-- MEMBER gets minimal permissions (self-service only)
INSERT INTO role_default_permissions (id, role, permission_id)
SELECT gen_random_uuid(), 'MEMBER', id FROM permissions
WHERE code IN (
    'dashboard_view',
    'bookings_view', 'bookings_create', 'bookings_cancel',
    'classes_view',
    'sessions_view'
);
