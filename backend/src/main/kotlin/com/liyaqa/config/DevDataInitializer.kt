package com.liyaqa.config

import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate

/**
 * Development data initializer that seeds essential reference data.
 *
 * Only runs in the "dev" profile with H2 in-memory database.
 * Demo/test data seeding has been removed — all data is managed via Flyway migrations.
 */
@Configuration
@Profile("dev")
class DevDataInitializer {

    private val logger = LoggerFactory.getLogger(DevDataInitializer::class.java)

    /**
     * Seeds permission data into the database.
     * In dev mode with ddl-auto: create-drop, Hibernate recreates tables and drops V32 migration data.
     * This bean runs FIRST to ensure permission data exists for other initializers.
     */
    @Bean
    @Order(0)
    fun initPermissionData(jdbcTemplate: JdbcTemplate): CommandLineRunner = CommandLineRunner {
        logger.info("=== Checking Permission Data ===")

        // Check if permissions already exist
        val count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM permissions", Int::class.java) ?: 0
        if (count > 0) {
            logger.info("Permission data already exists ($count permissions), skipping")
            return@CommandLineRunner
        }

        logger.info("Seeding permission data (required for dev mode with create-drop)...")

        // Insert all permission definitions (from V32 migration)
        jdbcTemplate.execute("""
            INSERT INTO permissions (id, code, module, action, name_en, name_ar, description_en, description_ar, created_at) VALUES
            -- Members module
            (gen_random_uuid(), 'members_view', 'members', 'view', 'View Members', 'عرض الأعضاء', 'View member list and details', 'عرض قائمة الأعضاء وتفاصيلهم', NOW()),
            (gen_random_uuid(), 'members_create', 'members', 'create', 'Create Members', 'إنشاء الأعضاء', 'Create new members', 'إنشاء أعضاء جدد', NOW()),
            (gen_random_uuid(), 'members_update', 'members', 'update', 'Update Members', 'تحديث الأعضاء', 'Edit member information', 'تحرير معلومات الأعضاء', NOW()),
            (gen_random_uuid(), 'members_delete', 'members', 'delete', 'Delete Members', 'حذف الأعضاء', 'Delete members from system', 'حذف الأعضاء من النظام', NOW()),
            (gen_random_uuid(), 'members_export', 'members', 'export', 'Export Members', 'تصدير الأعضاء', 'Export member data to CSV', 'تصدير بيانات الأعضاء إلى CSV', NOW()),
            -- Subscriptions module
            (gen_random_uuid(), 'subscriptions_view', 'subscriptions', 'view', 'View Subscriptions', 'عرض الاشتراكات', 'View subscription list and details', 'عرض قائمة الاشتراكات وتفاصيلها', NOW()),
            (gen_random_uuid(), 'subscriptions_create', 'subscriptions', 'create', 'Create Subscriptions', 'إنشاء الاشتراكات', 'Create new subscriptions', 'إنشاء اشتراكات جديدة', NOW()),
            (gen_random_uuid(), 'subscriptions_update', 'subscriptions', 'update', 'Update Subscriptions', 'تحديث الاشتراكات', 'Edit subscription details', 'تحرير تفاصيل الاشتراكات', NOW()),
            (gen_random_uuid(), 'subscriptions_cancel', 'subscriptions', 'cancel', 'Cancel Subscriptions', 'إلغاء الاشتراكات', 'Cancel active subscriptions', 'إلغاء الاشتراكات النشطة', NOW()),
            (gen_random_uuid(), 'subscriptions_freeze', 'subscriptions', 'freeze', 'Freeze Subscriptions', 'تجميد الاشتراكات', 'Freeze and unfreeze subscriptions', 'تجميد وإلغاء تجميد الاشتراكات', NOW()),
            -- Invoices module
            (gen_random_uuid(), 'invoices_view', 'invoices', 'view', 'View Invoices', 'عرض الفواتير', 'View invoice list and details', 'عرض قائمة الفواتير وتفاصيلها', NOW()),
            (gen_random_uuid(), 'invoices_create', 'invoices', 'create', 'Create Invoices', 'إنشاء الفواتير', 'Create new invoices', 'إنشاء فواتير جديدة', NOW()),
            (gen_random_uuid(), 'invoices_update', 'invoices', 'update', 'Update Invoices', 'تحديث الفواتير', 'Edit invoice details', 'تحرير تفاصيل الفواتير', NOW()),
            (gen_random_uuid(), 'invoices_delete', 'invoices', 'delete', 'Delete Invoices', 'حذف الفواتير', 'Delete draft invoices', 'حذف الفواتير المسودة', NOW()),
            (gen_random_uuid(), 'invoices_issue', 'invoices', 'issue', 'Issue Invoices', 'إصدار الفواتير', 'Issue invoices to members', 'إصدار الفواتير للأعضاء', NOW()),
            (gen_random_uuid(), 'invoices_pay', 'invoices', 'pay', 'Record Payments', 'تسجيل المدفوعات', 'Record invoice payments', 'تسجيل مدفوعات الفواتير', NOW()),
            (gen_random_uuid(), 'invoices_export', 'invoices', 'export', 'Export Invoices', 'تصدير الفواتير', 'Export invoice data to CSV', 'تصدير بيانات الفواتير إلى CSV', NOW()),
            -- Attendance module
            (gen_random_uuid(), 'attendance_view', 'attendance', 'view', 'View Attendance', 'عرض الحضور', 'View attendance records', 'عرض سجلات الحضور', NOW()),
            (gen_random_uuid(), 'attendance_checkin', 'attendance', 'checkin', 'Check In Members', 'تسجيل دخول الأعضاء', 'Check members into the facility', 'تسجيل دخول الأعضاء إلى المنشأة', NOW()),
            (gen_random_uuid(), 'attendance_checkout', 'attendance', 'checkout', 'Check Out Members', 'تسجيل خروج الأعضاء', 'Check members out of the facility', 'تسجيل خروج الأعضاء من المنشأة', NOW()),
            (gen_random_uuid(), 'attendance_export', 'attendance', 'export', 'Export Attendance', 'تصدير الحضور', 'Export attendance data to CSV', 'تصدير بيانات الحضور إلى CSV', NOW()),
            -- Classes module
            (gen_random_uuid(), 'classes_view', 'classes', 'view', 'View Classes', 'عرض الفصول', 'View class list and details', 'عرض قائمة الفصول وتفاصيلها', NOW()),
            (gen_random_uuid(), 'classes_create', 'classes', 'create', 'Create Classes', 'إنشاء الفصول', 'Create new classes', 'إنشاء فصول جديدة', NOW()),
            (gen_random_uuid(), 'classes_update', 'classes', 'update', 'Update Classes', 'تحديث الفصول', 'Edit class details', 'تحرير تفاصيل الفصول', NOW()),
            (gen_random_uuid(), 'classes_delete', 'classes', 'delete', 'Delete Classes', 'حذف الفصول', 'Delete classes from system', 'حذف الفصول من النظام', NOW()),
            -- Sessions module
            (gen_random_uuid(), 'sessions_view', 'sessions', 'view', 'View Sessions', 'عرض الجلسات', 'View session list and details', 'عرض قائمة الجلسات وتفاصيلها', NOW()),
            (gen_random_uuid(), 'sessions_create', 'sessions', 'create', 'Create Sessions', 'إنشاء الجلسات', 'Create new sessions', 'إنشاء جلسات جديدة', NOW()),
            (gen_random_uuid(), 'sessions_update', 'sessions', 'update', 'Update Sessions', 'تحديث الجلسات', 'Edit session details', 'تحرير تفاصيل الجلسات', NOW()),
            (gen_random_uuid(), 'sessions_cancel', 'sessions', 'cancel', 'Cancel Sessions', 'إلغاء الجلسات', 'Cancel scheduled sessions', 'إلغاء الجلسات المجدولة', NOW()),
            -- Bookings module
            (gen_random_uuid(), 'bookings_view', 'bookings', 'view', 'View Bookings', 'عرض الحجوزات', 'View booking list and details', 'عرض قائمة الحجوزات وتفاصيلها', NOW()),
            (gen_random_uuid(), 'bookings_create', 'bookings', 'create', 'Create Bookings', 'إنشاء الحجوزات', 'Create new bookings', 'إنشاء حجوزات جديدة', NOW()),
            (gen_random_uuid(), 'bookings_cancel', 'bookings', 'cancel', 'Cancel Bookings', 'إلغاء الحجوزات', 'Cancel existing bookings', 'إلغاء الحجوزات الحالية', NOW()),
            (gen_random_uuid(), 'bookings_checkin', 'bookings', 'checkin', 'Check In Bookings', 'تسجيل حضور الحجوزات', 'Check in booking attendees', 'تسجيل حضور المحجوزين', NOW()),
            -- Users module
            (gen_random_uuid(), 'users_view', 'users', 'view', 'View Users', 'عرض المستخدمين', 'View user list and details', 'عرض قائمة المستخدمين وتفاصيلهم', NOW()),
            (gen_random_uuid(), 'users_create', 'users', 'create', 'Create Users', 'إنشاء المستخدمين', 'Create new user accounts', 'إنشاء حسابات مستخدمين جديدة', NOW()),
            (gen_random_uuid(), 'users_update', 'users', 'update', 'Update Users', 'تحديث المستخدمين', 'Edit user information', 'تحرير معلومات المستخدمين', NOW()),
            (gen_random_uuid(), 'users_delete', 'users', 'delete', 'Delete Users', 'حذف المستخدمين', 'Delete user accounts', 'حذف حسابات المستخدمين', NOW()),
            (gen_random_uuid(), 'users_permissions', 'users', 'permissions', 'Manage User Permissions', 'إدارة صلاحيات المستخدمين', 'Grant and revoke user permissions', 'منح وسحب صلاحيات المستخدمين', NOW()),
            -- Employees module
            (gen_random_uuid(), 'employees_view', 'employees', 'view', 'View Employees', 'عرض الموظفين', 'View employee list and details', 'عرض قائمة الموظفين وتفاصيلهم', NOW()),
            (gen_random_uuid(), 'employees_create', 'employees', 'create', 'Create Employees', 'إنشاء الموظفين', 'Create new employee records', 'إنشاء سجلات موظفين جديدة', NOW()),
            (gen_random_uuid(), 'employees_update', 'employees', 'update', 'Update Employees', 'تحديث الموظفين', 'Edit employee information', 'تحرير معلومات الموظفين', NOW()),
            (gen_random_uuid(), 'employees_delete', 'employees', 'delete', 'Delete Employees', 'حذف الموظفين', 'Delete employee records', 'حذف سجلات الموظفين', NOW()),
            -- Departments module
            (gen_random_uuid(), 'departments_view', 'departments', 'view', 'View Departments', 'عرض الأقسام', 'View department list and details', 'عرض قائمة الأقسام وتفاصيلها', NOW()),
            (gen_random_uuid(), 'departments_create', 'departments', 'create', 'Create Departments', 'إنشاء الأقسام', 'Create new departments', 'إنشاء أقسام جديدة', NOW()),
            (gen_random_uuid(), 'departments_update', 'departments', 'update', 'Update Departments', 'تحديث الأقسام', 'Edit department information', 'تحرير معلومات الأقسام', NOW()),
            (gen_random_uuid(), 'departments_delete', 'departments', 'delete', 'Delete Departments', 'حذف الأقسام', 'Delete departments', 'حذف الأقسام', NOW()),
            -- Job Titles module
            (gen_random_uuid(), 'job_titles_view', 'job_titles', 'view', 'View Job Titles', 'عرض المسميات الوظيفية', 'View job title list and details', 'عرض قائمة المسميات الوظيفية وتفاصيلها', NOW()),
            (gen_random_uuid(), 'job_titles_create', 'job_titles', 'create', 'Create Job Titles', 'إنشاء المسميات الوظيفية', 'Create new job titles', 'إنشاء مسميات وظيفية جديدة', NOW()),
            (gen_random_uuid(), 'job_titles_update', 'job_titles', 'update', 'Update Job Titles', 'تحديث المسميات الوظيفية', 'Edit job title information', 'تحرير معلومات المسميات الوظيفية', NOW()),
            (gen_random_uuid(), 'job_titles_delete', 'job_titles', 'delete', 'Delete Job Titles', 'حذف المسميات الوظيفية', 'Delete job titles', 'حذف المسميات الوظيفية', NOW()),
            -- Organizations module
            (gen_random_uuid(), 'organizations_view', 'organizations', 'view', 'View Organizations', 'عرض المنظمات', 'View organization details', 'عرض تفاصيل المنظمات', NOW()),
            (gen_random_uuid(), 'organizations_update', 'organizations', 'update', 'Update Organizations', 'تحديث المنظمات', 'Edit organization information', 'تحرير معلومات المنظمات', NOW()),
            -- Clubs module
            (gen_random_uuid(), 'clubs_view', 'clubs', 'view', 'View Clubs', 'عرض الأندية', 'View club list and details', 'عرض قائمة الأندية وتفاصيلها', NOW()),
            (gen_random_uuid(), 'clubs_create', 'clubs', 'create', 'Create Clubs', 'إنشاء الأندية', 'Create new clubs', 'إنشاء أندية جديدة', NOW()),
            (gen_random_uuid(), 'clubs_update', 'clubs', 'update', 'Update Clubs', 'تحديث الأندية', 'Edit club information', 'تحرير معلومات الأندية', NOW()),
            (gen_random_uuid(), 'clubs_delete', 'clubs', 'delete', 'Delete Clubs', 'حذف الأندية', 'Delete clubs', 'حذف الأندية', NOW()),
            -- Locations module
            (gen_random_uuid(), 'locations_view', 'locations', 'view', 'View Locations', 'عرض المواقع', 'View location list and details', 'عرض قائمة المواقع وتفاصيلها', NOW()),
            (gen_random_uuid(), 'locations_create', 'locations', 'create', 'Create Locations', 'إنشاء المواقع', 'Create new locations', 'إنشاء مواقع جديدة', NOW()),
            (gen_random_uuid(), 'locations_update', 'locations', 'update', 'Update Locations', 'تحديث المواقع', 'Edit location information', 'تحرير معلومات المواقع', NOW()),
            (gen_random_uuid(), 'locations_delete', 'locations', 'delete', 'Delete Locations', 'حذف المواقع', 'Delete locations', 'حذف المواقع', NOW()),
            -- Plans module
            (gen_random_uuid(), 'plans_view', 'plans', 'view', 'View Membership Plans', 'عرض خطط العضوية', 'View membership plan list and details', 'عرض قائمة خطط العضوية وتفاصيلها', NOW()),
            (gen_random_uuid(), 'plans_create', 'plans', 'create', 'Create Membership Plans', 'إنشاء خطط العضوية', 'Create new membership plans', 'إنشاء خطط عضوية جديدة', NOW()),
            (gen_random_uuid(), 'plans_update', 'plans', 'update', 'Update Membership Plans', 'تحديث خطط العضوية', 'Edit membership plan details', 'تحرير تفاصيل خطط العضوية', NOW()),
            (gen_random_uuid(), 'plans_delete', 'plans', 'delete', 'Delete Membership Plans', 'حذف خطط العضوية', 'Delete membership plans', 'حذف خطط العضوية', NOW()),
            -- Reports module
            (gen_random_uuid(), 'reports_view', 'reports', 'view', 'View Reports', 'عرض التقارير', 'View system reports and analytics', 'عرض تقارير النظام والتحليلات', NOW()),
            (gen_random_uuid(), 'reports_export', 'reports', 'export', 'Export Reports', 'تصدير التقارير', 'Export reports to file', 'تصدير التقارير إلى ملف', NOW()),
            -- Dashboard module
            (gen_random_uuid(), 'dashboard_view', 'dashboard', 'view', 'View Dashboard', 'عرض لوحة القيادة', 'View dashboard and statistics', 'عرض لوحة القيادة والإحصائيات', NOW()),
            -- Settings module
            (gen_random_uuid(), 'settings_view', 'settings', 'view', 'View Settings', 'عرض الإعدادات', 'View system settings', 'عرض إعدادات النظام', NOW()),
            (gen_random_uuid(), 'settings_update', 'settings', 'update', 'Update Settings', 'تحديث الإعدادات', 'Modify system settings', 'تعديل إعدادات النظام', NOW()),
            -- Trainers module
            (gen_random_uuid(), 'trainers_view', 'trainers', 'view', 'View Trainers', 'عرض المدربين', 'View trainer list and details', 'عرض قائمة المدربين وتفاصيلهم', NOW()),
            (gen_random_uuid(), 'trainers_create', 'trainers', 'create', 'Create Trainers', 'إنشاء المدربين', 'Create new trainer profiles', 'إنشاء ملفات مدربين جديدة', NOW()),
            (gen_random_uuid(), 'trainers_update', 'trainers', 'update', 'Update Trainers', 'تحديث المدربين', 'Edit trainer information', 'تحرير معلومات المدربين', NOW()),
            (gen_random_uuid(), 'trainers_delete', 'trainers', 'delete', 'Delete Trainers', 'حذف المدربين', 'Delete trainer profiles', 'حذف ملفات المدربين', NOW()),
            -- Shop module
            (gen_random_uuid(), 'shop_view', 'shop', 'view', 'View Shop Products', 'عرض منتجات المتجر', 'View product list and details', 'عرض قائمة المنتجات وتفاصيلها', NOW()),
            (gen_random_uuid(), 'shop_create', 'shop', 'create', 'Create Products', 'إنشاء المنتجات', 'Create new products', 'إنشاء منتجات جديدة', NOW()),
            (gen_random_uuid(), 'shop_update', 'shop', 'update', 'Update Products', 'تحديث المنتجات', 'Edit product information', 'تحرير معلومات المنتجات', NOW()),
            (gen_random_uuid(), 'shop_delete', 'shop', 'delete', 'Delete Products', 'حذف المنتجات', 'Delete products', 'حذف المنتجات', NOW()),
            -- Orders module
            (gen_random_uuid(), 'orders_view', 'orders', 'view', 'View Orders', 'عرض الطلبات', 'View order list and details', 'عرض قائمة الطلبات وتفاصيلها', NOW()),
            (gen_random_uuid(), 'orders_create', 'orders', 'create', 'Create Orders', 'إنشاء الطلبات', 'Create new orders', 'إنشاء طلبات جديدة', NOW()),
            (gen_random_uuid(), 'orders_update', 'orders', 'update', 'Update Orders', 'تحديث الطلبات', 'Edit order details', 'تحرير تفاصيل الطلبات', NOW()),
            (gen_random_uuid(), 'orders_cancel', 'orders', 'cancel', 'Cancel Orders', 'إلغاء الطلبات', 'Cancel orders', 'إلغاء الطلبات', NOW()),
            -- Wallets module
            (gen_random_uuid(), 'wallets_view', 'wallets', 'view', 'View Wallets', 'عرض المحافظ', 'View member wallet balances', 'عرض أرصدة محافظ الأعضاء', NOW()),
            (gen_random_uuid(), 'wallets_update', 'wallets', 'update', 'Update Wallets', 'تحديث المحافظ', 'Credit, debit, and adjust wallet balances', 'إيداع وسحب وتعديل أرصدة المحافظ', NOW()),
            -- Leads module
            (gen_random_uuid(), 'leads_create', 'leads', 'create', 'Create Leads', 'إنشاء العملاء المحتملين', 'Create new leads', 'إنشاء عملاء محتملين جدد', NOW()),
            (gen_random_uuid(), 'leads_read', 'leads', 'read', 'View Leads', 'عرض العملاء المحتملين', 'View lead list and details', 'عرض قائمة العملاء المحتملين وتفاصيلهم', NOW()),
            (gen_random_uuid(), 'leads_update', 'leads', 'update', 'Update Leads', 'تحديث العملاء المحتملين', 'Edit lead information', 'تحرير معلومات العملاء المحتملين', NOW()),
            (gen_random_uuid(), 'leads_delete', 'leads', 'delete', 'Delete Leads', 'حذف العملاء المحتملين', 'Delete leads', 'حذف العملاء المحتملين', NOW()),
            (gen_random_uuid(), 'leads_assign', 'leads', 'assign', 'Assign Leads', 'تعيين العملاء المحتملين', 'Assign leads to users', 'تعيين العملاء المحتملين للمستخدمين', NOW()),
            (gen_random_uuid(), 'leads_convert', 'leads', 'convert', 'Convert Leads', 'تحويل العملاء المحتملين', 'Convert leads to members', 'تحويل العملاء المحتملين إلى أعضاء', NOW()),
            (gen_random_uuid(), 'lead_activities_create', 'leads', 'activity_create', 'Log Lead Activities', 'تسجيل أنشطة العملاء', 'Log activities for leads', 'تسجيل الأنشطة للعملاء المحتملين', NOW()),
            (gen_random_uuid(), 'lead_activities_read', 'leads', 'activity_read', 'View Lead Activities', 'عرض أنشطة العملاء', 'View lead activity history', 'عرض سجل أنشطة العملاء المحتملين', NOW()),
            -- Agreements module
            (gen_random_uuid(), 'agreements_view', 'agreements', 'view', 'View Agreements', 'عرض الاتفاقيات', 'View agreement list and details', 'عرض قائمة الاتفاقيات وتفاصيلها', NOW()),
            (gen_random_uuid(), 'agreements_create', 'agreements', 'create', 'Create Agreements', 'إنشاء الاتفاقيات', 'Create new agreements', 'إنشاء اتفاقيات جديدة', NOW()),
            (gen_random_uuid(), 'agreements_update', 'agreements', 'update', 'Update Agreements', 'تحديث الاتفاقيات', 'Edit agreement details', 'تحرير تفاصيل الاتفاقيات', NOW()),
            (gen_random_uuid(), 'agreements_delete', 'agreements', 'delete', 'Delete Agreements', 'حذف الاتفاقيات', 'Delete agreements', 'حذف الاتفاقيات', NOW())
        """)

        // Set up default permissions for each role
        // SUPER_ADMIN and CLUB_ADMIN get all permissions by default
        jdbcTemplate.execute("""
            INSERT INTO role_default_permissions (id, role, permission_id)
            SELECT gen_random_uuid(), 'SUPER_ADMIN', id FROM permissions
        """)

        jdbcTemplate.execute("""
            INSERT INTO role_default_permissions (id, role, permission_id)
            SELECT gen_random_uuid(), 'CLUB_ADMIN', id FROM permissions
        """)

        // STAFF gets view and limited action permissions
        jdbcTemplate.execute("""
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
                'orders_view', 'orders_create',
                'leads_read', 'leads_create', 'leads_update', 'lead_activities_create', 'lead_activities_read',
                'agreements_view'
            )
        """)

        // TRAINER gets limited permissions
        jdbcTemplate.execute("""
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
            )
        """)

        // MEMBER gets minimal permissions (self-service only)
        jdbcTemplate.execute("""
            INSERT INTO role_default_permissions (id, role, permission_id)
            SELECT gen_random_uuid(), 'MEMBER', id FROM permissions
            WHERE code IN (
                'dashboard_view',
                'bookings_view', 'bookings_create', 'bookings_cancel',
                'classes_view',
                'sessions_view'
            )
        """)

        val permissionCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM permissions", Int::class.java)
        val defaultCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM role_default_permissions", Int::class.java)
        logger.info("=== Permission Data Seeding Complete ===")
        logger.info("  Permissions: $permissionCount")
        logger.info("  Role defaults: $defaultCount")
    }
}
