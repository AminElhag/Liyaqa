package com.liyaqa.platform.config.dto

import com.liyaqa.platform.config.model.GlobalSetting
import com.liyaqa.platform.config.model.MaintenanceWindow
import com.liyaqa.platform.config.model.SettingCategory
import com.liyaqa.platform.config.model.SettingValueType
import com.liyaqa.shared.domain.AuditAction
import java.time.Instant
import java.util.UUID

// ========================================
// Settings DTOs
// ========================================

data class UpdateSettingRequest(
    val value: String
)

data class GlobalSettingResponse(
    val id: UUID,
    val key: String,
    val value: String,
    val valueType: SettingValueType,
    val category: SettingCategory,
    val description: String?,
    val descriptionAr: String?,
    val isEditable: Boolean,
    val updatedBy: UUID?,
    val updatedAt: Instant
) {
    companion object {
        fun from(setting: GlobalSetting) = GlobalSettingResponse(
            id = setting.id,
            key = setting.key,
            value = setting.value,
            valueType = setting.valueType,
            category = setting.category,
            description = setting.description,
            descriptionAr = setting.descriptionAr,
            isEditable = setting.isEditable,
            updatedBy = setting.updatedBy,
            updatedAt = setting.updatedAt
        )
    }
}

data class SettingsByCategoryResponse(
    val category: SettingCategory,
    val settings: List<GlobalSettingResponse>
)

data class SettingHistoryEntryResponse(
    val id: UUID,
    val settingKey: String,
    val action: AuditAction,
    val oldValue: String?,
    val newValue: String?,
    val userId: UUID?,
    val userEmail: String?,
    val description: String?,
    val createdAt: Instant
)

// ========================================
// Maintenance DTOs
// ========================================

data class CreateMaintenanceWindowRequest(
    val tenantId: UUID? = null,
    val title: String,
    val titleAr: String? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val startAt: Instant,
    val endAt: Instant
)

data class MaintenanceWindowResponse(
    val id: UUID,
    val tenantId: UUID?,
    val title: String,
    val titleAr: String?,
    val description: String?,
    val descriptionAr: String?,
    val startAt: Instant,
    val endAt: Instant,
    val isActive: Boolean,
    val isCurrentlyActive: Boolean,
    val createdBy: UUID,
    val createdAt: Instant
) {
    companion object {
        fun from(window: MaintenanceWindow) = MaintenanceWindowResponse(
            id = window.id,
            tenantId = window.tenantId,
            title = window.title,
            titleAr = window.titleAr,
            description = window.description,
            descriptionAr = window.descriptionAr,
            startAt = window.startAt,
            endAt = window.endAt,
            isActive = window.isActive,
            isCurrentlyActive = window.isCurrentlyActive(),
            createdBy = window.createdBy,
            createdAt = window.createdAt
        )
    }
}

data class MaintenanceStatusResponse(
    val isMaintenanceActive: Boolean,
    val activeWindows: List<MaintenanceWindowResponse>
)

// ========================================
// Feature Flag Admin DTOs
// ========================================

data class ToggleFeatureFlagRequest(
    val enabled: Boolean,
    val reason: String? = null
)

data class FeatureRolloutRequest(
    val featureKey: String,
    val percentage: Int,
    val reason: String? = null
) {
    init {
        require(percentage in 0..100) { "Percentage must be between 0 and 100" }
    }
}

data class FeatureRolloutResponse(
    val featureKey: String,
    val percentage: Int,
    val totalActiveTenants: Int,
    val enabledCount: Int,
    val tenantsEnabled: List<UUID>
)

data class FeatureMatrixEntry(
    val tenantId: UUID,
    val tenantName: String?,
    val features: Map<String, Boolean>
)

data class FeatureMatrixResponse(
    val featureKeys: List<String>,
    val tenants: List<FeatureMatrixEntry>
)
