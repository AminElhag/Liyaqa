package com.liyaqa.platform.config.controller

import com.liyaqa.platform.config.dto.CreateMaintenanceWindowRequest
import com.liyaqa.platform.config.dto.FeatureMatrixResponse
import com.liyaqa.platform.config.dto.FeatureRolloutRequest
import com.liyaqa.platform.config.dto.FeatureRolloutResponse
import com.liyaqa.platform.config.dto.GlobalSettingResponse
import com.liyaqa.platform.config.dto.MaintenanceStatusResponse
import com.liyaqa.platform.config.dto.MaintenanceWindowResponse
import com.liyaqa.platform.config.dto.SettingHistoryEntryResponse
import com.liyaqa.platform.config.dto.SettingsByCategoryResponse
import com.liyaqa.platform.config.dto.ToggleFeatureFlagRequest
import com.liyaqa.platform.config.dto.UpdateSettingRequest
import com.liyaqa.platform.config.service.ConfigFeatureFlagService
import com.liyaqa.platform.config.service.GlobalSettingService
import com.liyaqa.platform.config.service.MaintenanceWindowService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/config")
@Tag(name = "Platform Configuration", description = "Global settings, maintenance windows, and feature flag admin")
@PlatformSecured
class PlatformConfigController(
    private val globalSettingService: GlobalSettingService,
    private val maintenanceWindowService: MaintenanceWindowService,
    private val configFeatureFlagService: ConfigFeatureFlagService
) {

    // ========================================
    // Settings
    // ========================================

    @GetMapping("/settings")
    @PlatformSecured(permissions = [PlatformPermission.CONFIG_VIEW])
    @Operation(summary = "Get all settings grouped by category")
    fun getAllSettings(): ResponseEntity<List<SettingsByCategoryResponse>> {
        return ResponseEntity.ok(globalSettingService.getAllSettingsGrouped())
    }

    @PutMapping("/settings/{key}")
    @PlatformSecured(permissions = [PlatformPermission.CONFIG_EDIT])
    @Operation(summary = "Update a global setting")
    fun updateSetting(
        @PathVariable key: String,
        @Valid @RequestBody request: UpdateSettingRequest
    ): ResponseEntity<GlobalSettingResponse> {
        return ResponseEntity.ok(globalSettingService.updateSetting(key, request.value))
    }

    @GetMapping("/settings/history")
    @PlatformSecured(permissions = [PlatformPermission.CONFIG_VIEW])
    @Operation(summary = "Get settings change history")
    fun getSettingsHistory(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<Page<SettingHistoryEntryResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        return ResponseEntity.ok(globalSettingService.getSettingsHistory(pageable))
    }

    // ========================================
    // Maintenance Windows
    // ========================================

    @GetMapping("/maintenance")
    @PlatformSecured(permissions = [PlatformPermission.CONFIG_VIEW])
    @Operation(summary = "Get all maintenance windows")
    fun getAllMaintenanceWindows(): ResponseEntity<List<MaintenanceWindowResponse>> {
        return ResponseEntity.ok(maintenanceWindowService.getAllMaintenanceWindows())
    }

    @PostMapping("/maintenance")
    @PlatformSecured(permissions = [PlatformPermission.MAINTENANCE_MANAGE])
    @Operation(summary = "Create a maintenance window")
    fun createMaintenanceWindow(
        @Valid @RequestBody request: CreateMaintenanceWindowRequest
    ): ResponseEntity<MaintenanceWindowResponse> {
        val response = maintenanceWindowService.createMaintenanceWindow(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping("/maintenance/active")
    @PlatformSecured(permissions = [PlatformPermission.CONFIG_VIEW])
    @Operation(summary = "Get active maintenance status")
    fun getActiveMaintenanceStatus(): ResponseEntity<MaintenanceStatusResponse> {
        return ResponseEntity.ok(maintenanceWindowService.getActiveMaintenanceStatus())
    }

    @PutMapping("/maintenance/{id}/cancel")
    @PlatformSecured(permissions = [PlatformPermission.MAINTENANCE_MANAGE])
    @Operation(summary = "Cancel a maintenance window")
    fun cancelMaintenanceWindow(@PathVariable id: UUID): ResponseEntity<MaintenanceWindowResponse> {
        return ResponseEntity.ok(maintenanceWindowService.cancelMaintenanceWindow(id))
    }

    // ========================================
    // Feature Flag Admin
    // ========================================

    @PutMapping("/feature-flags/{tenantId}/{featureKey}/toggle")
    @PlatformSecured(permissions = [PlatformPermission.FEATURE_FLAG_MANAGE])
    @Operation(summary = "Toggle a feature flag for a tenant")
    fun toggleFeatureFlag(
        @PathVariable tenantId: UUID,
        @PathVariable featureKey: String,
        @Valid @RequestBody request: ToggleFeatureFlagRequest
    ): ResponseEntity<Void> {
        configFeatureFlagService.toggleFeatureForTenant(tenantId, featureKey, request)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/feature-flags/rollout")
    @PlatformSecured(permissions = [PlatformPermission.FEATURE_FLAG_MANAGE])
    @Operation(summary = "Rollout a feature to a percentage of active tenants")
    fun rolloutFeature(
        @Valid @RequestBody request: FeatureRolloutRequest
    ): ResponseEntity<FeatureRolloutResponse> {
        return ResponseEntity.ok(configFeatureFlagService.rolloutFeature(request))
    }

    @GetMapping("/feature-flags/matrix")
    @PlatformSecured(permissions = [PlatformPermission.FEATURE_FLAG_MANAGE])
    @Operation(summary = "Get feature flag matrix across all active tenants")
    fun getFeatureMatrix(): ResponseEntity<FeatureMatrixResponse> {
        return ResponseEntity.ok(configFeatureFlagService.getFeatureMatrix())
    }
}
