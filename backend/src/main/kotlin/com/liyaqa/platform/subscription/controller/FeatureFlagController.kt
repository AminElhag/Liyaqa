package com.liyaqa.platform.subscription.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.subscription.dto.CreateFeatureFlagRequest
import com.liyaqa.platform.subscription.dto.EffectiveFeaturesResponse
import com.liyaqa.platform.subscription.dto.FeatureFlagResponse
import com.liyaqa.platform.subscription.dto.FeatureFlagsByCategoryResponse
import com.liyaqa.platform.subscription.dto.SetFeatureOverrideRequest
import com.liyaqa.platform.subscription.dto.TenantFeatureOverrideResponse
import com.liyaqa.platform.subscription.dto.UpdateFeatureFlagRequest
import com.liyaqa.platform.subscription.service.FeatureAccessService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/subscriptions/feature-flags")
@PlatformSecured
@Tag(name = "Feature Flags", description = "Manage feature flags for subscription plans")
class FeatureFlagController(
    private val featureAccessService: FeatureAccessService
) {

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.PLANS_VIEW])
    @Operation(summary = "List feature flags", description = "Returns all feature flags grouped by category")
    @ApiResponse(responseCode = "200", description = "List of feature flags by category")
    fun listFeatureFlags(): ResponseEntity<List<FeatureFlagsByCategoryResponse>> {
        val flags = featureAccessService.listFeatureFlags()
        return ResponseEntity.ok(flags)
    }

    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.SYSTEM_SETTINGS])
    @Operation(summary = "Create a feature flag", description = "Creates a new feature flag with the specified key and default state")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Feature flag created successfully"),
        ApiResponse(responseCode = "409", description = "A feature flag with the same key already exists")
    )
    fun createFeatureFlag(
        @Valid @RequestBody request: CreateFeatureFlagRequest
    ): ResponseEntity<FeatureFlagResponse> {
        val flag = featureAccessService.createFeatureFlag(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(FeatureFlagResponse.from(flag))
    }

    @PutMapping("/{key}")
    @PlatformSecured(permissions = [PlatformPermission.SYSTEM_SETTINGS])
    @Operation(summary = "Update a feature flag", description = "Updates the configuration of an existing feature flag by key")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Feature flag updated successfully"),
        ApiResponse(responseCode = "404", description = "Feature flag not found")
    )
    fun updateFeatureFlag(
        @PathVariable key: String,
        @Valid @RequestBody request: UpdateFeatureFlagRequest
    ): ResponseEntity<FeatureFlagResponse> {
        val flag = featureAccessService.updateFeatureFlag(key, request.toCommand())
        return ResponseEntity.ok(FeatureFlagResponse.from(flag))
    }

    @GetMapping("/tenants/{tenantId}/effective")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_VIEW])
    @Operation(summary = "Get effective features for a tenant", description = "Returns the resolved feature flags for a tenant, including plan defaults and overrides")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Effective features for the tenant"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun getEffectiveFeatures(@PathVariable tenantId: UUID): ResponseEntity<EffectiveFeaturesResponse> {
        val response = featureAccessService.getEffectiveFeatures(tenantId)
        return ResponseEntity.ok(response)
    }

    @PutMapping("/tenants/{tenantId}/overrides")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_EDIT])
    @Operation(summary = "Set a feature override for a tenant", description = "Creates or updates a feature flag override for a specific tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Feature override set successfully"),
        ApiResponse(responseCode = "404", description = "Tenant or feature flag not found")
    )
    fun setOverride(
        @PathVariable tenantId: UUID,
        @Valid @RequestBody request: SetFeatureOverrideRequest
    ): ResponseEntity<TenantFeatureOverrideResponse> {
        val currentUserId = UUID.fromString(SecurityContextHolder.getContext().authentication.name)
        val override = featureAccessService.setOverride(
            tenantId = tenantId,
            featureKey = request.featureKey,
            enabled = request.enabled,
            reason = request.reason,
            overriddenBy = currentUserId
        )
        return ResponseEntity.ok(TenantFeatureOverrideResponse.from(override))
    }

    @DeleteMapping("/tenants/{tenantId}/overrides/{featureKey}")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_EDIT])
    @Operation(summary = "Remove a feature override", description = "Removes a tenant-specific feature flag override, reverting to the plan default")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Feature override removed successfully"),
        ApiResponse(responseCode = "404", description = "Override not found")
    )
    fun removeOverride(
        @PathVariable tenantId: UUID,
        @PathVariable featureKey: String
    ): ResponseEntity<Void> {
        featureAccessService.removeOverride(tenantId, featureKey)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/tenants/{tenantId}/overrides")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_VIEW])
    @Operation(summary = "List feature overrides for a tenant", description = "Returns all feature flag overrides configured for a specific tenant")
    @ApiResponse(responseCode = "200", description = "List of feature overrides for the tenant")
    fun listOverrides(@PathVariable tenantId: UUID): ResponseEntity<List<TenantFeatureOverrideResponse>> {
        val overrides = featureAccessService.getOverrides(tenantId)
        return ResponseEntity.ok(overrides.map { TenantFeatureOverrideResponse.from(it) })
    }
}
