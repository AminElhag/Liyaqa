package com.liyaqa.branding.application.services

import com.liyaqa.branding.domain.model.BrandingConfig
import com.liyaqa.branding.domain.ports.BrandingConfigRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Command for updating branding configuration.
 */
data class UpdateBrandingCommand(
    // App Identity
    val appName: String,
    val appNameAr: String?,

    // Colors
    val primaryColor: String,
    val primaryDarkColor: String,
    val secondaryColor: String,
    val secondaryDarkColor: String,
    val accentColor: String,

    // Logos
    val logoLightUrl: String?,
    val logoDarkUrl: String?,

    // Feature Flags
    val featureClasses: Boolean,
    val featureFacilities: Boolean,
    val featureLoyalty: Boolean,
    val featureWearables: Boolean,
    val featurePayments: Boolean
)

/**
 * Service for managing branding configuration.
 */
@Service
class BrandingService(
    private val brandingConfigRepository: BrandingConfigRepository
) {
    private val logger = LoggerFactory.getLogger(BrandingService::class.java)

    /**
     * Gets or creates the branding config for the current tenant.
     */
    @Transactional
    fun getOrCreateConfig(): BrandingConfig {
        val tenantId = TenantContext.getCurrentTenantId()
        return getOrCreateConfigForTenant(tenantId)
    }

    /**
     * Gets or creates the branding config for a specific tenant.
     */
    @Transactional
    fun getOrCreateConfigForTenant(tenantId: UUID): BrandingConfig {
        return brandingConfigRepository.findByTenantId(tenantId)
            ?: run {
                logger.info("Creating default branding config for tenant: $tenantId")
                val config = BrandingConfig.createDefault(tenantId)
                brandingConfigRepository.save(config)
            }
    }

    /**
     * Updates branding configuration for the current tenant.
     */
    @Transactional
    fun updateConfig(command: UpdateBrandingCommand): BrandingConfig {
        val tenantId = TenantContext.getCurrentTenantId()
        val config = getOrCreateConfigForTenant(tenantId)

        config.updateAppIdentity(command.appName, command.appNameAr)
        config.updateColors(
            primaryColor = command.primaryColor,
            primaryDarkColor = command.primaryDarkColor,
            secondaryColor = command.secondaryColor,
            secondaryDarkColor = command.secondaryDarkColor,
            accentColor = command.accentColor
        )
        config.updateLogos(command.logoLightUrl, command.logoDarkUrl)
        config.updateFeatures(
            featureClasses = command.featureClasses,
            featureFacilities = command.featureFacilities,
            featureLoyalty = command.featureLoyalty,
            featureWearables = command.featureWearables,
            featurePayments = command.featurePayments
        )

        logger.info("Updated branding config for tenant: $tenantId")
        return brandingConfigRepository.save(config)
    }

    /**
     * Gets branding for mobile app.
     * This is a public method that doesn't require the tenant to be in context.
     */
    @Transactional(readOnly = true)
    fun getBrandingForMobile(tenantId: UUID): BrandingConfig {
        return brandingConfigRepository.findByTenantId(tenantId)
            ?: BrandingConfig.createDefault(tenantId)
    }
}
