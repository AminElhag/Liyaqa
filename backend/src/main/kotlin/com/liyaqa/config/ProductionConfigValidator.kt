package com.liyaqa.config

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment

/**
 * Validates that all required environment variables are set in production.
 * Fails fast on startup if critical configuration is missing.
 *
 * This prevents silent failures where features don't work because
 * environment variables weren't configured.
 */
@Configuration
@Profile("prod")
class ProductionConfigValidator(
    private val environment: Environment
) {
    private val logger = LoggerFactory.getLogger(ProductionConfigValidator::class.java)

    companion object {
        /**
         * Required variables that MUST be set in production.
         * Application will fail to start if any are missing.
         */
        private val REQUIRED_VARIABLES = listOf(
            // Database
            ConfigVariable("DATABASE_URL", "PostgreSQL connection URL"),
            ConfigVariable("DATABASE_USERNAME", "Database username"),
            ConfigVariable("DATABASE_PASSWORD", "Database password"),

            // Security
            ConfigVariable("JWT_SECRET", "JWT signing secret (min 32 characters)"),
            ConfigVariable("CORS_ALLOWED_ORIGINS", "Allowed CORS origins for frontend")
        )

        /**
         * Conditionally required variables based on feature enablement.
         */
        private val CONDITIONAL_VARIABLES = listOf(
            // Payment - required if payments are used
            ConditionalVariable(
                name = "PAYTABS_PROFILE_ID",
                description = "PayTabs merchant profile ID",
                condition = "Payment processing"
            ),
            ConditionalVariable(
                name = "PAYTABS_SERVER_KEY",
                description = "PayTabs server key for API authentication",
                condition = "Payment processing"
            ),

            // Zatca - required for Saudi Arabia compliance
            ConditionalVariable(
                name = "ZATCA_SELLER_NAME",
                description = "Business name for Zatca QR code",
                condition = "Zatca e-invoicing (when ZATCA_ENABLED=true)"
            ),
            ConditionalVariable(
                name = "ZATCA_VAT_NUMBER",
                description = "VAT registration number (15 digits)",
                condition = "Zatca e-invoicing (when ZATCA_ENABLED=true)"
            ),

            // Email - required if email is enabled
            ConditionalVariable(
                name = "SMTP_HOST",
                description = "SMTP server hostname",
                condition = "Email notifications (when EMAIL_ENABLED=true)"
            ),
            ConditionalVariable(
                name = "SMTP_USERNAME",
                description = "SMTP authentication username",
                condition = "Email notifications (when EMAIL_ENABLED=true)"
            ),
            ConditionalVariable(
                name = "SMTP_PASSWORD",
                description = "SMTP authentication password",
                condition = "Email notifications (when EMAIL_ENABLED=true)"
            ),

            // SMS - required if SMS is enabled
            ConditionalVariable(
                name = "TWILIO_ACCOUNT_SID",
                description = "Twilio account SID",
                condition = "SMS notifications (when SMS_ENABLED=true)"
            ),
            ConditionalVariable(
                name = "TWILIO_AUTH_TOKEN",
                description = "Twilio authentication token",
                condition = "SMS notifications (when SMS_ENABLED=true)"
            ),
            ConditionalVariable(
                name = "TWILIO_FROM_NUMBER",
                description = "Twilio sender phone number",
                condition = "SMS notifications (when SMS_ENABLED=true)"
            )
        )

        /**
         * Recommended variables that should be set for optimal operation.
         */
        private val RECOMMENDED_VARIABLES = listOf(
            ConfigVariable("HSTS_ENABLED", "Enable HSTS header (should be true with HTTPS)"),
            ConfigVariable("EMAIL_BASE_URL", "Base URL for email links"),
            ConfigVariable("PAYTABS_CALLBACK_URL", "PayTabs webhook callback URL"),
            ConfigVariable("PAYTABS_RETURN_URL", "User return URL after payment")
        )
    }

    @PostConstruct
    fun validateConfiguration() {
        logger.info("=".repeat(60))
        logger.info("Production Configuration Validation")
        logger.info("=".repeat(60))

        val errors = mutableListOf<String>()
        val warnings = mutableListOf<String>()

        // Check required variables
        logger.info("Checking required environment variables...")
        REQUIRED_VARIABLES.forEach { variable ->
            val value = getEnvValue(variable.name)
            if (value.isNullOrBlank()) {
                errors.add("${variable.name}: ${variable.description}")
            } else {
                logger.info("  [OK] ${variable.name}")
            }
        }

        // Validate JWT_SECRET length
        val jwtSecret = getEnvValue("JWT_SECRET")
        if (!jwtSecret.isNullOrBlank() && jwtSecret.length < 32) {
            errors.add("JWT_SECRET must be at least 32 characters long (current: ${jwtSecret.length})")
        }

        // Check conditional variables based on feature flags
        logger.info("Checking conditional environment variables...")

        // PayTabs - always warn if not configured
        val paytabsConfigured = checkPayTabsConfig()
        if (!paytabsConfigured) {
            warnings.add("PayTabs not configured - online payments will not work")
        }

        // Zatca - required if enabled
        val zatcaEnabled = getEnvValue("ZATCA_ENABLED")?.toBoolean() ?: false
        if (zatcaEnabled) {
            checkZatcaConfig(errors)
        } else {
            warnings.add("Zatca e-invoicing disabled - Saudi tax compliance not active")
        }

        // Email - required if enabled
        val emailEnabled = getEnvValue("EMAIL_ENABLED")?.toBoolean() ?: false
        if (emailEnabled) {
            checkEmailConfig(errors)
        } else {
            warnings.add("Email notifications disabled")
        }

        // SMS - required if enabled
        val smsEnabled = getEnvValue("SMS_ENABLED")?.toBoolean() ?: false
        if (smsEnabled) {
            checkSmsConfig(errors)
        } else {
            warnings.add("SMS notifications disabled")
        }

        // Check recommended variables
        logger.info("Checking recommended environment variables...")
        RECOMMENDED_VARIABLES.forEach { variable ->
            val value = getEnvValue(variable.name)
            if (value.isNullOrBlank()) {
                warnings.add("${variable.name} not set: ${variable.description}")
            }
        }

        // Report results
        logger.info("=".repeat(60))

        if (warnings.isNotEmpty()) {
            logger.warn("Configuration Warnings (${warnings.size}):")
            warnings.forEach { logger.warn("  - $it") }
        }

        if (errors.isNotEmpty()) {
            logger.error("=".repeat(60))
            logger.error("FATAL: Missing required configuration!")
            logger.error("=".repeat(60))
            errors.forEach { logger.error("  - $it") }
            logger.error("")
            logger.error("Please set the required environment variables and restart.")
            logger.error("See PRODUCTION_DEPLOYMENT.md for configuration details.")
            logger.error("=".repeat(60))

            throw IllegalStateException(
                "Production configuration validation failed. " +
                "Missing ${errors.size} required environment variable(s). " +
                "Check logs for details."
            )
        }

        logger.info("Configuration validation PASSED")
        logger.info("=".repeat(60))
    }

    private fun checkPayTabsConfig(): Boolean {
        val profileId = getEnvValue("PAYTABS_PROFILE_ID")
        val serverKey = getEnvValue("PAYTABS_SERVER_KEY")

        return if (!profileId.isNullOrBlank() && !serverKey.isNullOrBlank()) {
            logger.info("  [OK] PayTabs configured")
            true
        } else {
            logger.warn("  [WARN] PayTabs not fully configured")
            false
        }
    }

    private fun checkZatcaConfig(errors: MutableList<String>) {
        val sellerName = getEnvValue("ZATCA_SELLER_NAME")
        val vatNumber = getEnvValue("ZATCA_VAT_NUMBER")

        if (sellerName.isNullOrBlank()) {
            errors.add("ZATCA_SELLER_NAME: Required when ZATCA_ENABLED=true")
        }
        if (vatNumber.isNullOrBlank()) {
            errors.add("ZATCA_VAT_NUMBER: Required when ZATCA_ENABLED=true")
        } else if (vatNumber.length != 15) {
            errors.add("ZATCA_VAT_NUMBER: Must be exactly 15 digits (current: ${vatNumber.length})")
        }
    }

    private fun checkEmailConfig(errors: MutableList<String>) {
        val host = getEnvValue("SMTP_HOST")
        val username = getEnvValue("SMTP_USERNAME")
        val password = getEnvValue("SMTP_PASSWORD")

        if (host.isNullOrBlank()) {
            errors.add("SMTP_HOST: Required when EMAIL_ENABLED=true")
        }
        if (username.isNullOrBlank()) {
            errors.add("SMTP_USERNAME: Required when EMAIL_ENABLED=true")
        }
        if (password.isNullOrBlank()) {
            errors.add("SMTP_PASSWORD: Required when EMAIL_ENABLED=true")
        }
    }

    private fun checkSmsConfig(errors: MutableList<String>) {
        val accountSid = getEnvValue("TWILIO_ACCOUNT_SID")
        val authToken = getEnvValue("TWILIO_AUTH_TOKEN")
        val fromNumber = getEnvValue("TWILIO_FROM_NUMBER")

        if (accountSid.isNullOrBlank()) {
            errors.add("TWILIO_ACCOUNT_SID: Required when SMS_ENABLED=true")
        }
        if (authToken.isNullOrBlank()) {
            errors.add("TWILIO_AUTH_TOKEN: Required when SMS_ENABLED=true")
        }
        if (fromNumber.isNullOrBlank()) {
            errors.add("TWILIO_FROM_NUMBER: Required when SMS_ENABLED=true")
        }
    }

    /**
     * Gets environment variable value, checking both system env and Spring properties.
     */
    private fun getEnvValue(name: String): String? {
        // Check system environment first
        val envValue = System.getenv(name)
        if (!envValue.isNullOrBlank()) {
            return envValue
        }

        // Check Spring environment (application.yml, etc.)
        return environment.getProperty(name)
            ?: environment.getProperty(name.lowercase().replace("_", "-"))
            ?: environment.getProperty(name.lowercase().replace("_", "."))
    }
}

/**
 * Represents a required configuration variable.
 */
private data class ConfigVariable(
    val name: String,
    val description: String
)

/**
 * Represents a conditionally required configuration variable.
 */
private data class ConditionalVariable(
    val name: String,
    val description: String,
    val condition: String
)
