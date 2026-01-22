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
import com.liyaqa.shared.domain.LocalizedAddress
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
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

    @Bean
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
            passwordHash = passwordEncoder.encode("password123")!!,
            displayName = LocalizedText(en = "Platform Admin", ar = "مدير المنصة"),
            role = PlatformUserRole.PLATFORM_ADMIN
        )
        platformUserRepository.save(platformAdmin)
        logger.info("Created platform admin: admin@liyaqa.com / password123")

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
        logger.info("  Password: password123")
        logger.info("")
    }

    /**
     * Initializes demo organization and club with subdomain slug for testing.
     */
    @Bean
    fun initDemoClientData(
        organizationRepository: OrganizationRepository,
        clubRepository: ClubRepository,
        locationRepository: LocationRepository,
        userRepository: UserRepository,
        passwordEncoder: PasswordEncoder
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
            userRepository.save(demoAdmin)
            logger.info("Created demo admin: admin@demo.com / Test1234")
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
