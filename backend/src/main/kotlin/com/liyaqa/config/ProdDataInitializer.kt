package com.liyaqa.config

import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.annotation.Order
import org.springframework.security.crypto.password.PasswordEncoder

/**
 * Production data initializer that creates the platform admin account.
 * Only runs in the "prod" profile.
 */
@Configuration
@Profile("prod")
class ProdDataInitializer {

    private val logger = LoggerFactory.getLogger(ProdDataInitializer::class.java)

    /**
     * Creates the platform admin account if it doesn't exist.
     * This ensures the B2B dashboard is accessible after deployment.
     */
    @Bean
    @Order(1)
    fun initPlatformAdmin(
        platformUserRepository: PlatformUserRepository,
        passwordEncoder: PasswordEncoder
    ): CommandLineRunner = CommandLineRunner {
        logger.info("=== Checking Platform Admin Account ===")

        // Only create if doesn't exist
        if (platformUserRepository.findByEmail("admin@liyaqa.com").isPresent) {
            logger.info("Platform admin already exists, skipping creation")
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

        logger.info("=== Platform Admin Created ===")
        logger.info("Email: admin@liyaqa.com")
        logger.info("Password: admin123")
        logger.info("==============================")
    }
}
