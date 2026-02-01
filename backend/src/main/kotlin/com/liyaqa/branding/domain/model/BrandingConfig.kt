package com.liyaqa.branding.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Branding configuration for white-label mobile apps.
 * Stores custom colors, logos, app names, and feature flags per tenant.
 */
@Entity
@Table(name = "branding_configs")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class BrandingConfig(
    id: UUID = UUID.randomUUID(),

    // App Identity
    @Column(name = "app_name", nullable = false, length = 100)
    var appName: String = "Liyaqa",

    @Column(name = "app_name_ar", length = 100)
    var appNameAr: String? = "لياقة",

    // Colors (hex format)
    @Column(name = "primary_color", nullable = false, length = 7)
    var primaryColor: String = "#1E3A5F",

    @Column(name = "primary_dark_color", nullable = false, length = 7)
    var primaryDarkColor: String = "#3D5A80",

    @Column(name = "secondary_color", nullable = false, length = 7)
    var secondaryColor: String = "#2E7D32",

    @Column(name = "secondary_dark_color", nullable = false, length = 7)
    var secondaryDarkColor: String = "#4CAF50",

    @Column(name = "accent_color", nullable = false, length = 7)
    var accentColor: String = "#FFB300",

    // Logos
    @Column(name = "logo_light_url", length = 500)
    var logoLightUrl: String? = null,

    @Column(name = "logo_dark_url", length = 500)
    var logoDarkUrl: String? = null,

    // Feature Flags
    @Column(name = "feature_classes")
    var featureClasses: Boolean = true,

    @Column(name = "feature_facilities")
    var featureFacilities: Boolean = true,

    @Column(name = "feature_loyalty")
    var featureLoyalty: Boolean = true,

    @Column(name = "feature_wearables")
    var featureWearables: Boolean = true,

    @Column(name = "feature_payments")
    var featurePayments: Boolean = true

) : BaseEntity(id) {

    /**
     * Updates app identity (names).
     */
    fun updateAppIdentity(appName: String, appNameAr: String?) {
        require(appName.isNotBlank()) { "App name cannot be blank" }
        require(appName.length <= 100) { "App name cannot exceed 100 characters" }
        require(appNameAr == null || appNameAr.length <= 100) { "Arabic app name cannot exceed 100 characters" }

        this.appName = appName.trim()
        this.appNameAr = appNameAr?.trim()
    }

    /**
     * Updates color scheme.
     */
    fun updateColors(
        primaryColor: String,
        primaryDarkColor: String,
        secondaryColor: String,
        secondaryDarkColor: String,
        accentColor: String
    ) {
        validateHexColor(primaryColor, "Primary color")
        validateHexColor(primaryDarkColor, "Primary dark color")
        validateHexColor(secondaryColor, "Secondary color")
        validateHexColor(secondaryDarkColor, "Secondary dark color")
        validateHexColor(accentColor, "Accent color")

        this.primaryColor = primaryColor.uppercase()
        this.primaryDarkColor = primaryDarkColor.uppercase()
        this.secondaryColor = secondaryColor.uppercase()
        this.secondaryDarkColor = secondaryDarkColor.uppercase()
        this.accentColor = accentColor.uppercase()
    }

    /**
     * Updates logo URLs.
     */
    fun updateLogos(logoLightUrl: String?, logoDarkUrl: String?) {
        require(logoLightUrl == null || logoLightUrl.length <= 500) { "Logo light URL cannot exceed 500 characters" }
        require(logoDarkUrl == null || logoDarkUrl.length <= 500) { "Logo dark URL cannot exceed 500 characters" }

        this.logoLightUrl = logoLightUrl?.trim()?.takeIf { it.isNotBlank() }
        this.logoDarkUrl = logoDarkUrl?.trim()?.takeIf { it.isNotBlank() }
    }

    /**
     * Updates feature flags.
     */
    fun updateFeatures(
        featureClasses: Boolean,
        featureFacilities: Boolean,
        featureLoyalty: Boolean,
        featureWearables: Boolean,
        featurePayments: Boolean
    ) {
        this.featureClasses = featureClasses
        this.featureFacilities = featureFacilities
        this.featureLoyalty = featureLoyalty
        this.featureWearables = featureWearables
        this.featurePayments = featurePayments
    }

    private fun validateHexColor(color: String, fieldName: String) {
        val hexPattern = Regex("^#[0-9A-Fa-f]{6}$")
        require(hexPattern.matches(color)) {
            "$fieldName must be a valid hex color (e.g., #1E3A5F)"
        }
    }

    companion object {
        /**
         * Creates a default branding config for a tenant.
         */
        fun createDefault(tenantId: UUID): BrandingConfig {
            return BrandingConfig().apply {
                this.tenantId = tenantId
            }
        }
    }
}
