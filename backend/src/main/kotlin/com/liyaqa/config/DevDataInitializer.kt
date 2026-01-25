package com.liyaqa.config

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.domain.LocalizedAddress
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.annotation.Order
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.UUID

/**
 * Development data initializer that seeds the database with platform users
 * for testing the Platform Admin (B2B internal app).
 *
 * Only runs in the "dev" profile with H2 in-memory database.
 */
@Configuration
@Profile("dev")
class DevDataInitializer {

    private val logger = LoggerFactory.getLogger(DevDataInitializer::class.java)

    companion object {
        // Platform organization ID for internal users
        val PLATFORM_ORG_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000001")

        // Predefined user IDs for consistency (users table - legacy)
        val PLATFORM_ADMIN_ID: UUID = UUID.fromString("b0000000-0000-0000-0000-000000000001")
        val SALES_REP_ID: UUID = UUID.fromString("b0000000-0000-0000-0000-000000000002")
        val SUPPORT_ID: UUID = UUID.fromString("b0000000-0000-0000-0000-000000000003")

        // Platform users table IDs
        val PLATFORM_USER_ADMIN_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000002")
        val PLATFORM_USER_SALES_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000003")
        val PLATFORM_USER_SUPPORT_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000004")

        // Demo organization and club IDs (for subdomain testing)
        val DEMO_ORG_ID: UUID = UUID.fromString("d0000000-0000-0000-0000-000000000001")
        val DEMO_CLUB_ID: UUID = UUID.fromString("22222222-2222-2222-2222-222222222222")
        val DEMO_LOCATION_ID: UUID = UUID.fromString("11111111-1111-1111-1111-111111111111")
        val DEMO_ADMIN_ID: UUID = UUID.fromString("a0000000-0000-0000-0000-000000000001")
    }

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
            (RANDOM_UUID(), 'members_view', 'members', 'view', 'View Members', 'عرض الأعضاء', 'View member list and details', 'عرض قائمة الأعضاء وتفاصيلهم', NOW()),
            (RANDOM_UUID(), 'members_create', 'members', 'create', 'Create Members', 'إنشاء الأعضاء', 'Create new members', 'إنشاء أعضاء جدد', NOW()),
            (RANDOM_UUID(), 'members_update', 'members', 'update', 'Update Members', 'تحديث الأعضاء', 'Edit member information', 'تحرير معلومات الأعضاء', NOW()),
            (RANDOM_UUID(), 'members_delete', 'members', 'delete', 'Delete Members', 'حذف الأعضاء', 'Delete members from system', 'حذف الأعضاء من النظام', NOW()),
            (RANDOM_UUID(), 'members_export', 'members', 'export', 'Export Members', 'تصدير الأعضاء', 'Export member data to CSV', 'تصدير بيانات الأعضاء إلى CSV', NOW()),
            -- Subscriptions module
            (RANDOM_UUID(), 'subscriptions_view', 'subscriptions', 'view', 'View Subscriptions', 'عرض الاشتراكات', 'View subscription list and details', 'عرض قائمة الاشتراكات وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'subscriptions_create', 'subscriptions', 'create', 'Create Subscriptions', 'إنشاء الاشتراكات', 'Create new subscriptions', 'إنشاء اشتراكات جديدة', NOW()),
            (RANDOM_UUID(), 'subscriptions_update', 'subscriptions', 'update', 'Update Subscriptions', 'تحديث الاشتراكات', 'Edit subscription details', 'تحرير تفاصيل الاشتراكات', NOW()),
            (RANDOM_UUID(), 'subscriptions_cancel', 'subscriptions', 'cancel', 'Cancel Subscriptions', 'إلغاء الاشتراكات', 'Cancel active subscriptions', 'إلغاء الاشتراكات النشطة', NOW()),
            (RANDOM_UUID(), 'subscriptions_freeze', 'subscriptions', 'freeze', 'Freeze Subscriptions', 'تجميد الاشتراكات', 'Freeze and unfreeze subscriptions', 'تجميد وإلغاء تجميد الاشتراكات', NOW()),
            -- Invoices module
            (RANDOM_UUID(), 'invoices_view', 'invoices', 'view', 'View Invoices', 'عرض الفواتير', 'View invoice list and details', 'عرض قائمة الفواتير وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'invoices_create', 'invoices', 'create', 'Create Invoices', 'إنشاء الفواتير', 'Create new invoices', 'إنشاء فواتير جديدة', NOW()),
            (RANDOM_UUID(), 'invoices_update', 'invoices', 'update', 'Update Invoices', 'تحديث الفواتير', 'Edit invoice details', 'تحرير تفاصيل الفواتير', NOW()),
            (RANDOM_UUID(), 'invoices_delete', 'invoices', 'delete', 'Delete Invoices', 'حذف الفواتير', 'Delete draft invoices', 'حذف الفواتير المسودة', NOW()),
            (RANDOM_UUID(), 'invoices_issue', 'invoices', 'issue', 'Issue Invoices', 'إصدار الفواتير', 'Issue invoices to members', 'إصدار الفواتير للأعضاء', NOW()),
            (RANDOM_UUID(), 'invoices_pay', 'invoices', 'pay', 'Record Payments', 'تسجيل المدفوعات', 'Record invoice payments', 'تسجيل مدفوعات الفواتير', NOW()),
            (RANDOM_UUID(), 'invoices_export', 'invoices', 'export', 'Export Invoices', 'تصدير الفواتير', 'Export invoice data to CSV', 'تصدير بيانات الفواتير إلى CSV', NOW()),
            -- Attendance module
            (RANDOM_UUID(), 'attendance_view', 'attendance', 'view', 'View Attendance', 'عرض الحضور', 'View attendance records', 'عرض سجلات الحضور', NOW()),
            (RANDOM_UUID(), 'attendance_checkin', 'attendance', 'checkin', 'Check In Members', 'تسجيل دخول الأعضاء', 'Check members into the facility', 'تسجيل دخول الأعضاء إلى المنشأة', NOW()),
            (RANDOM_UUID(), 'attendance_checkout', 'attendance', 'checkout', 'Check Out Members', 'تسجيل خروج الأعضاء', 'Check members out of the facility', 'تسجيل خروج الأعضاء من المنشأة', NOW()),
            (RANDOM_UUID(), 'attendance_export', 'attendance', 'export', 'Export Attendance', 'تصدير الحضور', 'Export attendance data to CSV', 'تصدير بيانات الحضور إلى CSV', NOW()),
            -- Classes module
            (RANDOM_UUID(), 'classes_view', 'classes', 'view', 'View Classes', 'عرض الفصول', 'View class list and details', 'عرض قائمة الفصول وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'classes_create', 'classes', 'create', 'Create Classes', 'إنشاء الفصول', 'Create new classes', 'إنشاء فصول جديدة', NOW()),
            (RANDOM_UUID(), 'classes_update', 'classes', 'update', 'Update Classes', 'تحديث الفصول', 'Edit class details', 'تحرير تفاصيل الفصول', NOW()),
            (RANDOM_UUID(), 'classes_delete', 'classes', 'delete', 'Delete Classes', 'حذف الفصول', 'Delete classes from system', 'حذف الفصول من النظام', NOW()),
            -- Sessions module
            (RANDOM_UUID(), 'sessions_view', 'sessions', 'view', 'View Sessions', 'عرض الجلسات', 'View session list and details', 'عرض قائمة الجلسات وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'sessions_create', 'sessions', 'create', 'Create Sessions', 'إنشاء الجلسات', 'Create new sessions', 'إنشاء جلسات جديدة', NOW()),
            (RANDOM_UUID(), 'sessions_update', 'sessions', 'update', 'Update Sessions', 'تحديث الجلسات', 'Edit session details', 'تحرير تفاصيل الجلسات', NOW()),
            (RANDOM_UUID(), 'sessions_cancel', 'sessions', 'cancel', 'Cancel Sessions', 'إلغاء الجلسات', 'Cancel scheduled sessions', 'إلغاء الجلسات المجدولة', NOW()),
            -- Bookings module
            (RANDOM_UUID(), 'bookings_view', 'bookings', 'view', 'View Bookings', 'عرض الحجوزات', 'View booking list and details', 'عرض قائمة الحجوزات وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'bookings_create', 'bookings', 'create', 'Create Bookings', 'إنشاء الحجوزات', 'Create new bookings', 'إنشاء حجوزات جديدة', NOW()),
            (RANDOM_UUID(), 'bookings_cancel', 'bookings', 'cancel', 'Cancel Bookings', 'إلغاء الحجوزات', 'Cancel existing bookings', 'إلغاء الحجوزات الحالية', NOW()),
            (RANDOM_UUID(), 'bookings_checkin', 'bookings', 'checkin', 'Check In Bookings', 'تسجيل حضور الحجوزات', 'Check in booking attendees', 'تسجيل حضور المحجوزين', NOW()),
            -- Users module
            (RANDOM_UUID(), 'users_view', 'users', 'view', 'View Users', 'عرض المستخدمين', 'View user list and details', 'عرض قائمة المستخدمين وتفاصيلهم', NOW()),
            (RANDOM_UUID(), 'users_create', 'users', 'create', 'Create Users', 'إنشاء المستخدمين', 'Create new user accounts', 'إنشاء حسابات مستخدمين جديدة', NOW()),
            (RANDOM_UUID(), 'users_update', 'users', 'update', 'Update Users', 'تحديث المستخدمين', 'Edit user information', 'تحرير معلومات المستخدمين', NOW()),
            (RANDOM_UUID(), 'users_delete', 'users', 'delete', 'Delete Users', 'حذف المستخدمين', 'Delete user accounts', 'حذف حسابات المستخدمين', NOW()),
            (RANDOM_UUID(), 'users_permissions', 'users', 'permissions', 'Manage User Permissions', 'إدارة صلاحيات المستخدمين', 'Grant and revoke user permissions', 'منح وسحب صلاحيات المستخدمين', NOW()),
            -- Employees module
            (RANDOM_UUID(), 'employees_view', 'employees', 'view', 'View Employees', 'عرض الموظفين', 'View employee list and details', 'عرض قائمة الموظفين وتفاصيلهم', NOW()),
            (RANDOM_UUID(), 'employees_create', 'employees', 'create', 'Create Employees', 'إنشاء الموظفين', 'Create new employee records', 'إنشاء سجلات موظفين جديدة', NOW()),
            (RANDOM_UUID(), 'employees_update', 'employees', 'update', 'Update Employees', 'تحديث الموظفين', 'Edit employee information', 'تحرير معلومات الموظفين', NOW()),
            (RANDOM_UUID(), 'employees_delete', 'employees', 'delete', 'Delete Employees', 'حذف الموظفين', 'Delete employee records', 'حذف سجلات الموظفين', NOW()),
            -- Departments module
            (RANDOM_UUID(), 'departments_view', 'departments', 'view', 'View Departments', 'عرض الأقسام', 'View department list and details', 'عرض قائمة الأقسام وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'departments_create', 'departments', 'create', 'Create Departments', 'إنشاء الأقسام', 'Create new departments', 'إنشاء أقسام جديدة', NOW()),
            (RANDOM_UUID(), 'departments_update', 'departments', 'update', 'Update Departments', 'تحديث الأقسام', 'Edit department information', 'تحرير معلومات الأقسام', NOW()),
            (RANDOM_UUID(), 'departments_delete', 'departments', 'delete', 'Delete Departments', 'حذف الأقسام', 'Delete departments', 'حذف الأقسام', NOW()),
            -- Job Titles module
            (RANDOM_UUID(), 'job_titles_view', 'job_titles', 'view', 'View Job Titles', 'عرض المسميات الوظيفية', 'View job title list and details', 'عرض قائمة المسميات الوظيفية وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'job_titles_create', 'job_titles', 'create', 'Create Job Titles', 'إنشاء المسميات الوظيفية', 'Create new job titles', 'إنشاء مسميات وظيفية جديدة', NOW()),
            (RANDOM_UUID(), 'job_titles_update', 'job_titles', 'update', 'Update Job Titles', 'تحديث المسميات الوظيفية', 'Edit job title information', 'تحرير معلومات المسميات الوظيفية', NOW()),
            (RANDOM_UUID(), 'job_titles_delete', 'job_titles', 'delete', 'Delete Job Titles', 'حذف المسميات الوظيفية', 'Delete job titles', 'حذف المسميات الوظيفية', NOW()),
            -- Organizations module
            (RANDOM_UUID(), 'organizations_view', 'organizations', 'view', 'View Organizations', 'عرض المنظمات', 'View organization details', 'عرض تفاصيل المنظمات', NOW()),
            (RANDOM_UUID(), 'organizations_update', 'organizations', 'update', 'Update Organizations', 'تحديث المنظمات', 'Edit organization information', 'تحرير معلومات المنظمات', NOW()),
            -- Clubs module
            (RANDOM_UUID(), 'clubs_view', 'clubs', 'view', 'View Clubs', 'عرض الأندية', 'View club list and details', 'عرض قائمة الأندية وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'clubs_create', 'clubs', 'create', 'Create Clubs', 'إنشاء الأندية', 'Create new clubs', 'إنشاء أندية جديدة', NOW()),
            (RANDOM_UUID(), 'clubs_update', 'clubs', 'update', 'Update Clubs', 'تحديث الأندية', 'Edit club information', 'تحرير معلومات الأندية', NOW()),
            (RANDOM_UUID(), 'clubs_delete', 'clubs', 'delete', 'Delete Clubs', 'حذف الأندية', 'Delete clubs', 'حذف الأندية', NOW()),
            -- Locations module
            (RANDOM_UUID(), 'locations_view', 'locations', 'view', 'View Locations', 'عرض المواقع', 'View location list and details', 'عرض قائمة المواقع وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'locations_create', 'locations', 'create', 'Create Locations', 'إنشاء المواقع', 'Create new locations', 'إنشاء مواقع جديدة', NOW()),
            (RANDOM_UUID(), 'locations_update', 'locations', 'update', 'Update Locations', 'تحديث المواقع', 'Edit location information', 'تحرير معلومات المواقع', NOW()),
            (RANDOM_UUID(), 'locations_delete', 'locations', 'delete', 'Delete Locations', 'حذف المواقع', 'Delete locations', 'حذف المواقع', NOW()),
            -- Plans module
            (RANDOM_UUID(), 'plans_view', 'plans', 'view', 'View Membership Plans', 'عرض خطط العضوية', 'View membership plan list and details', 'عرض قائمة خطط العضوية وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'plans_create', 'plans', 'create', 'Create Membership Plans', 'إنشاء خطط العضوية', 'Create new membership plans', 'إنشاء خطط عضوية جديدة', NOW()),
            (RANDOM_UUID(), 'plans_update', 'plans', 'update', 'Update Membership Plans', 'تحديث خطط العضوية', 'Edit membership plan details', 'تحرير تفاصيل خطط العضوية', NOW()),
            (RANDOM_UUID(), 'plans_delete', 'plans', 'delete', 'Delete Membership Plans', 'حذف خطط العضوية', 'Delete membership plans', 'حذف خطط العضوية', NOW()),
            -- Reports module
            (RANDOM_UUID(), 'reports_view', 'reports', 'view', 'View Reports', 'عرض التقارير', 'View system reports and analytics', 'عرض تقارير النظام والتحليلات', NOW()),
            (RANDOM_UUID(), 'reports_export', 'reports', 'export', 'Export Reports', 'تصدير التقارير', 'Export reports to file', 'تصدير التقارير إلى ملف', NOW()),
            -- Dashboard module
            (RANDOM_UUID(), 'dashboard_view', 'dashboard', 'view', 'View Dashboard', 'عرض لوحة القيادة', 'View dashboard and statistics', 'عرض لوحة القيادة والإحصائيات', NOW()),
            -- Settings module
            (RANDOM_UUID(), 'settings_view', 'settings', 'view', 'View Settings', 'عرض الإعدادات', 'View system settings', 'عرض إعدادات النظام', NOW()),
            (RANDOM_UUID(), 'settings_update', 'settings', 'update', 'Update Settings', 'تحديث الإعدادات', 'Modify system settings', 'تعديل إعدادات النظام', NOW()),
            -- Trainers module
            (RANDOM_UUID(), 'trainers_view', 'trainers', 'view', 'View Trainers', 'عرض المدربين', 'View trainer list and details', 'عرض قائمة المدربين وتفاصيلهم', NOW()),
            (RANDOM_UUID(), 'trainers_create', 'trainers', 'create', 'Create Trainers', 'إنشاء المدربين', 'Create new trainer profiles', 'إنشاء ملفات مدربين جديدة', NOW()),
            (RANDOM_UUID(), 'trainers_update', 'trainers', 'update', 'Update Trainers', 'تحديث المدربين', 'Edit trainer information', 'تحرير معلومات المدربين', NOW()),
            (RANDOM_UUID(), 'trainers_delete', 'trainers', 'delete', 'Delete Trainers', 'حذف المدربين', 'Delete trainer profiles', 'حذف ملفات المدربين', NOW()),
            -- Shop module
            (RANDOM_UUID(), 'shop_view', 'shop', 'view', 'View Shop Products', 'عرض منتجات المتجر', 'View product list and details', 'عرض قائمة المنتجات وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'shop_create', 'shop', 'create', 'Create Products', 'إنشاء المنتجات', 'Create new products', 'إنشاء منتجات جديدة', NOW()),
            (RANDOM_UUID(), 'shop_update', 'shop', 'update', 'Update Products', 'تحديث المنتجات', 'Edit product information', 'تحرير معلومات المنتجات', NOW()),
            (RANDOM_UUID(), 'shop_delete', 'shop', 'delete', 'Delete Products', 'حذف المنتجات', 'Delete products', 'حذف المنتجات', NOW()),
            -- Orders module
            (RANDOM_UUID(), 'orders_view', 'orders', 'view', 'View Orders', 'عرض الطلبات', 'View order list and details', 'عرض قائمة الطلبات وتفاصيلها', NOW()),
            (RANDOM_UUID(), 'orders_create', 'orders', 'create', 'Create Orders', 'إنشاء الطلبات', 'Create new orders', 'إنشاء طلبات جديدة', NOW()),
            (RANDOM_UUID(), 'orders_update', 'orders', 'update', 'Update Orders', 'تحديث الطلبات', 'Edit order details', 'تحرير تفاصيل الطلبات', NOW()),
            (RANDOM_UUID(), 'orders_cancel', 'orders', 'cancel', 'Cancel Orders', 'إلغاء الطلبات', 'Cancel orders', 'إلغاء الطلبات', NOW())
        """)

        // Set up default permissions for each role
        // SUPER_ADMIN and CLUB_ADMIN get all permissions by default
        jdbcTemplate.execute("""
            INSERT INTO role_default_permissions (id, role, permission_id)
            SELECT RANDOM_UUID(), 'SUPER_ADMIN', id FROM permissions
        """)

        jdbcTemplate.execute("""
            INSERT INTO role_default_permissions (id, role, permission_id)
            SELECT RANDOM_UUID(), 'CLUB_ADMIN', id FROM permissions
        """)

        // STAFF gets view and limited action permissions
        jdbcTemplate.execute("""
            INSERT INTO role_default_permissions (id, role, permission_id)
            SELECT RANDOM_UUID(), 'STAFF', id FROM permissions
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
            )
        """)

        // TRAINER gets limited permissions
        jdbcTemplate.execute("""
            INSERT INTO role_default_permissions (id, role, permission_id)
            SELECT RANDOM_UUID(), 'TRAINER', id FROM permissions
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
            SELECT RANDOM_UUID(), 'MEMBER', id FROM permissions
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

    @Bean
    @Order(1)
    fun initPlatformUsers(
        userRepository: UserRepository,
        passwordEncoder: PasswordEncoder
    ): CommandLineRunner = CommandLineRunner {
        logger.info("=== Initializing Platform Users for Development ===")

        // Check if platform admin already exists
        if (userRepository.findByEmail("platform@liyaqa.com").isPresent) {
            logger.info("Platform users already exist, skipping initialization")
            return@CommandLineRunner
        }

        // Create Platform Admin
        val platformAdmin = User(
            id = PLATFORM_ADMIN_ID,
            email = "platform@liyaqa.com",
            passwordHash = passwordEncoder.encode("PlatformAdmin123!")!!,
            displayName = LocalizedText(en = "Platform Admin", ar = "مدير المنصة"),
            role = Role.PLATFORM_ADMIN,
            status = UserStatus.ACTIVE,
            isPlatformUser = true,
            platformOrganizationId = PLATFORM_ORG_ID
        )
        userRepository.save(platformAdmin)
        logger.info("Created platform admin: platform@liyaqa.com / PlatformAdmin123!")

        // Create Sales Rep
        val salesRep = User(
            id = SALES_REP_ID,
            email = "sales@liyaqa.com",
            passwordHash = passwordEncoder.encode("SalesRep123!")!!,
            displayName = LocalizedText(en = "Sales Representative", ar = "مندوب المبيعات"),
            role = Role.SALES_REP,
            status = UserStatus.ACTIVE,
            isPlatformUser = true,
            platformOrganizationId = PLATFORM_ORG_ID
        )
        userRepository.save(salesRep)
        logger.info("Created sales rep: sales@liyaqa.com / SalesRep123!")

        // Create Support Rep
        val supportRep = User(
            id = SUPPORT_ID,
            email = "support@liyaqa.com",
            passwordHash = passwordEncoder.encode("Support123!")!!,
            displayName = LocalizedText(en = "Support Representative", ar = "ممثل الدعم"),
            role = Role.SUPPORT,
            status = UserStatus.ACTIVE,
            isPlatformUser = true,
            platformOrganizationId = PLATFORM_ORG_ID
        )
        userRepository.save(supportRep)
        logger.info("Created support rep: support@liyaqa.com / Support123!")

        logger.info("=== Platform Users Initialization Complete ===")
        logger.info("")
        logger.info("Platform Admin Login:")
        logger.info("  URL: http://localhost:3004/en/platform-login")
        logger.info("  Email: platform@liyaqa.com")
        logger.info("  Password: PlatformAdmin123!")
        logger.info("")
    }

    /**
     * Initializes platform users in the platform_users table for Platform Dashboard login.
     * This is the primary login method for platform admin users.
     */
    @Bean
    @Order(2)
    fun initPlatformUserTable(
        platformUserRepository: PlatformUserRepository,
        passwordEncoder: PasswordEncoder
    ): CommandLineRunner = CommandLineRunner {
        logger.info("=== Initializing Platform Users Table ===")

        // Check if platform admin already exists
        if (platformUserRepository.findByEmail("admin@liyaqa.com").isPresent) {
            logger.info("Platform users already exist in platform_users table, skipping")
            return@CommandLineRunner
        }

        // Create Platform Admin
        val platformAdmin = PlatformUser.create(
            email = "admin@liyaqa.com",
            passwordHash = passwordEncoder.encode("admin123")!!,
            displayName = LocalizedText(en = "Platform Admin", ar = "مدير المنصة"),
            role = PlatformUserRole.PLATFORM_ADMIN
        )
        platformUserRepository.save(platformAdmin)
        logger.info("Created platform admin: admin@liyaqa.com / admin123")

        // Create Sales Rep
        val salesRep = PlatformUser.create(
            email = "sales@liyaqa.com",
            passwordHash = passwordEncoder.encode("password123")!!,
            displayName = LocalizedText(en = "Sales Representative", ar = "مندوب المبيعات"),
            role = PlatformUserRole.SALES_REP,
            createdBy = platformAdmin
        )
        platformUserRepository.save(salesRep)
        logger.info("Created sales rep: sales@liyaqa.com / password123")

        // Create Support Rep
        val supportRep = PlatformUser.create(
            email = "support@liyaqa.com",
            passwordHash = passwordEncoder.encode("password123")!!,
            displayName = LocalizedText(en = "Support Representative", ar = "ممثل الدعم"),
            role = PlatformUserRole.SUPPORT_REP,
            createdBy = platformAdmin
        )
        platformUserRepository.save(supportRep)
        logger.info("Created support rep: support@liyaqa.com / password123")

        logger.info("=== Platform Users Table Initialization Complete ===")
        logger.info("")
        logger.info("Platform Dashboard Login:")
        logger.info("  URL: http://localhost:3004/en/platform-login")
        logger.info("  Email: admin@liyaqa.com")
        logger.info("  Password: admin123")
        logger.info("")
    }

    /**
     * Initializes demo organization and club with subdomain slug for testing.
     */
    @Bean
    @Order(3)
    fun initDemoClientData(
        organizationRepository: OrganizationRepository,
        clubRepository: ClubRepository,
        locationRepository: LocationRepository,
        userRepository: UserRepository,
        passwordEncoder: PasswordEncoder,
        permissionService: PermissionService
    ): CommandLineRunner = CommandLineRunner {
        logger.info("=== Initializing Demo Client Data ===")

        // Check if demo club already exists
        if (clubRepository.existsById(DEMO_CLUB_ID)) {
            logger.info("Demo client data already exists, skipping initialization")
            return@CommandLineRunner
        }

        // Create Demo Organization
        val demoOrg = Organization(
            id = DEMO_ORG_ID,
            name = LocalizedText(en = "Demo Fitness Organization", ar = "منظمة اللياقة التجريبية"),
            tradeName = LocalizedText(en = "Demo Fitness", ar = "اللياقة التجريبية"),
            organizationType = OrganizationType.CORPORATION,
            status = OrganizationStatus.ACTIVE
        )
        organizationRepository.save(demoOrg)
        logger.info("Created demo organization: ${demoOrg.id}")

        // Create Demo Club with subdomain slug
        val demoClub = Club(
            id = DEMO_CLUB_ID,
            organizationId = DEMO_ORG_ID,
            name = LocalizedText(en = "Demo Gym", ar = "الصالة التجريبية"),
            description = LocalizedText(en = "Demo fitness club for testing", ar = "نادي لياقة تجريبي للاختبار"),
            status = ClubStatus.ACTIVE
        )
        demoClub.setSlugValidated("demo-gym")
        clubRepository.save(demoClub)
        logger.info("Created demo club: ${demoClub.id} with slug: ${demoClub.slug}")

        // Create Demo Location and Admin User (set tenant context first)
        TenantContext.setCurrentTenant(TenantId(DEMO_CLUB_ID))
        try {
            // Create Demo Location
            val demoLocation = Location(
                id = DEMO_LOCATION_ID,
                clubId = DEMO_CLUB_ID,
                name = LocalizedText(en = "Main Gym Floor", ar = "صالة الألعاب الرئيسية"),
                address = LocalizedAddress(
                    street = LocalizedText(en = "123 Demo Street", ar = "شارع تجريبي 123"),
                    city = LocalizedText(en = "Demo City", ar = "المدينة التجريبية")
                ),
                status = LocationStatus.ACTIVE
            )
            demoLocation.initializeFromClub(demoClub)
            locationRepository.save(demoLocation)
            logger.info("Created demo location: ${demoLocation.id}")

            // Create Demo Admin User
            val demoAdmin = User(
                id = DEMO_ADMIN_ID,
                email = "admin@demo.com",
                passwordHash = passwordEncoder.encode("Test1234")!!,
                displayName = LocalizedText(en = "Demo Admin", ar = "مدير تجريبي"),
                role = Role.CLUB_ADMIN,
                status = UserStatus.ACTIVE
            )
            val savedDemoAdmin = userRepository.save(demoAdmin)
            logger.info("Created demo admin: admin@demo.com / Test1234")

            // Grant default permissions for the demo admin
            permissionService.grantDefaultPermissionsForRole(savedDemoAdmin.id, savedDemoAdmin.role.name)
        } finally {
            TenantContext.clear()
        }

        logger.info("=== Demo Client Initialization Complete ===")
        logger.info("")
        logger.info("Demo Client Login:")
        logger.info("  Subdomain URL: http://demo-gym.liyaqa.local:3000/en/login")
        logger.info("  Direct URL: http://liyaqa.local:3000/en/login (with Tenant ID)")
        logger.info("  Email: admin@demo.com")
        logger.info("  Password: Test1234")
        logger.info("  Tenant ID: $DEMO_CLUB_ID")
        logger.info("")
    }
}
