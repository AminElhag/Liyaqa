package com.liyaqa.platform.subscription.dto

import com.liyaqa.platform.subscription.model.FeatureCategory
import com.liyaqa.platform.subscription.model.FeatureFlag
import com.liyaqa.platform.subscription.model.TenantFeatureOverride
import java.time.Instant
import java.util.UUID

// ── Commands ────────────────────────────────────────────────────────────────

data class CreateFeatureFlagCommand(
    val key: String,
    val name: String,
    val description: String?,
    val category: FeatureCategory,
    val defaultEnabled: Boolean
)

data class UpdateFeatureFlagCommand(
    val name: String?,
    val description: String?,
    val category: FeatureCategory?,
    val defaultEnabled: Boolean?,
    val isActive: Boolean?
)

// ── Requests ────────────────────────────────────────────────────────────────

data class CreateFeatureFlagRequest(
    val key: String,
    val name: String,
    val description: String? = null,
    val category: FeatureCategory,
    val defaultEnabled: Boolean = false
) {
    fun toCommand() = CreateFeatureFlagCommand(
        key = key,
        name = name,
        description = description,
        category = category,
        defaultEnabled = defaultEnabled
    )
}

data class UpdateFeatureFlagRequest(
    val name: String? = null,
    val description: String? = null,
    val category: FeatureCategory? = null,
    val defaultEnabled: Boolean? = null,
    val isActive: Boolean? = null
) {
    fun toCommand() = UpdateFeatureFlagCommand(
        name = name,
        description = description,
        category = category,
        defaultEnabled = defaultEnabled,
        isActive = isActive
    )
}

data class SetFeatureOverrideRequest(
    val featureKey: String,
    val enabled: Boolean,
    val reason: String? = null
)

// ── Responses ───────────────────────────────────────────────────────────────

data class FeatureFlagResponse(
    val id: UUID,
    val key: String,
    val name: String,
    val description: String?,
    val category: FeatureCategory,
    val defaultEnabled: Boolean,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(flag: FeatureFlag) = FeatureFlagResponse(
            id = flag.id,
            key = flag.key,
            name = flag.name,
            description = flag.description,
            category = flag.category,
            defaultEnabled = flag.defaultEnabled,
            isActive = flag.isActive,
            createdAt = flag.createdAt,
            updatedAt = flag.updatedAt
        )
    }
}

data class TenantFeatureOverrideResponse(
    val id: UUID,
    val tenantId: UUID,
    val featureKey: String,
    val enabled: Boolean,
    val reason: String?,
    val overriddenBy: UUID,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(override: TenantFeatureOverride) = TenantFeatureOverrideResponse(
            id = override.id,
            tenantId = override.tenantId,
            featureKey = override.featureKey,
            enabled = override.enabled,
            reason = override.reason,
            overriddenBy = override.overriddenBy,
            createdAt = override.createdAt,
            updatedAt = override.updatedAt
        )
    }
}

data class EffectiveFeaturesResponse(
    val tenantId: UUID,
    val planId: UUID?,
    val planName: String?,
    val features: Map<String, Boolean>,
    val overrides: List<TenantFeatureOverrideResponse>
)

data class FeatureFlagsByCategoryResponse(
    val category: FeatureCategory,
    val flags: List<FeatureFlagResponse>
)
