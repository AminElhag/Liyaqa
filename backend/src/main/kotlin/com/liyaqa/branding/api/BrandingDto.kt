package com.liyaqa.branding.api

import com.liyaqa.branding.application.services.UpdateBrandingCommand
import com.liyaqa.branding.domain.model.BrandingConfig
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

/**
 * Full branding configuration response for admin dashboard.
 */
data class BrandingConfigResponse(
    val id: UUID,
    val tenantId: UUID,

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
    val featurePayments: Boolean,

    // Timestamps
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(config: BrandingConfig) = BrandingConfigResponse(
            id = config.id,
            tenantId = config.tenantId,
            appName = config.appName,
            appNameAr = config.appNameAr,
            primaryColor = config.primaryColor,
            primaryDarkColor = config.primaryDarkColor,
            secondaryColor = config.secondaryColor,
            secondaryDarkColor = config.secondaryDarkColor,
            accentColor = config.accentColor,
            logoLightUrl = config.logoLightUrl,
            logoDarkUrl = config.logoDarkUrl,
            featureClasses = config.featureClasses,
            featureFacilities = config.featureFacilities,
            featureLoyalty = config.featureLoyalty,
            featureWearables = config.featureWearables,
            featurePayments = config.featurePayments,
            createdAt = config.createdAt,
            updatedAt = config.updatedAt
        )
    }
}

/**
 * Request to update branding configuration.
 */
data class UpdateBrandingRequest(
    // App Identity
    @field:NotBlank(message = "App name is required")
    @field:Size(max = 100, message = "App name cannot exceed 100 characters")
    val appName: String,

    @field:Size(max = 100, message = "Arabic app name cannot exceed 100 characters")
    val appNameAr: String?,

    // Colors
    @field:NotBlank(message = "Primary color is required")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Primary color must be a valid hex color")
    val primaryColor: String,

    @field:NotBlank(message = "Primary dark color is required")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Primary dark color must be a valid hex color")
    val primaryDarkColor: String,

    @field:NotBlank(message = "Secondary color is required")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Secondary color must be a valid hex color")
    val secondaryColor: String,

    @field:NotBlank(message = "Secondary dark color is required")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Secondary dark color must be a valid hex color")
    val secondaryDarkColor: String,

    @field:NotBlank(message = "Accent color is required")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Accent color must be a valid hex color")
    val accentColor: String,

    // Logos
    @field:Size(max = 500, message = "Logo light URL cannot exceed 500 characters")
    val logoLightUrl: String?,

    @field:Size(max = 500, message = "Logo dark URL cannot exceed 500 characters")
    val logoDarkUrl: String?,

    // Feature Flags
    val featureClasses: Boolean = true,
    val featureFacilities: Boolean = true,
    val featureLoyalty: Boolean = true,
    val featureWearables: Boolean = true,
    val featurePayments: Boolean = true
) {
    fun toCommand() = UpdateBrandingCommand(
        appName = appName,
        appNameAr = appNameAr,
        primaryColor = primaryColor,
        primaryDarkColor = primaryDarkColor,
        secondaryColor = secondaryColor,
        secondaryDarkColor = secondaryDarkColor,
        accentColor = accentColor,
        logoLightUrl = logoLightUrl,
        logoDarkUrl = logoDarkUrl,
        featureClasses = featureClasses,
        featureFacilities = featureFacilities,
        featureLoyalty = featureLoyalty,
        featureWearables = featureWearables,
        featurePayments = featurePayments
    )
}

/**
 * Lightweight branding response for mobile app.
 * Only includes information needed for theming.
 */
data class MobileBrandingResponse(
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
    val features: MobileFeatures
) {
    companion object {
        fun from(config: BrandingConfig) = MobileBrandingResponse(
            appName = config.appName,
            appNameAr = config.appNameAr,
            primaryColor = config.primaryColor,
            primaryDarkColor = config.primaryDarkColor,
            secondaryColor = config.secondaryColor,
            secondaryDarkColor = config.secondaryDarkColor,
            accentColor = config.accentColor,
            logoLightUrl = config.logoLightUrl,
            logoDarkUrl = config.logoDarkUrl,
            features = MobileFeatures(
                classes = config.featureClasses,
                facilities = config.featureFacilities,
                loyalty = config.featureLoyalty,
                wearables = config.featureWearables,
                payments = config.featurePayments
            )
        )
    }
}

/**
 * Feature flags for mobile app.
 */
data class MobileFeatures(
    val classes: Boolean,
    val facilities: Boolean,
    val loyalty: Boolean,
    val wearables: Boolean,
    val payments: Boolean
)
