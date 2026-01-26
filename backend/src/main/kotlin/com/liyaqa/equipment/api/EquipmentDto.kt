package com.liyaqa.equipment.api

import com.liyaqa.equipment.application.services.WorkoutStats
import com.liyaqa.equipment.domain.model.*
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.util.*

// ========== Request DTOs ==========

data class CreateProviderConfigRequest(
    @field:NotNull val providerId: UUID,
    val apiKey: String? = null,
    val apiSecret: String? = null,
    val oauthClientId: String? = null,
    val oauthClientSecret: String? = null,
    val webhookSecret: String? = null,
    val customConfig: Map<String, Any>? = null,
    @field:Min(5) @field:Max(1440) val syncIntervalMinutes: Int = 60
)

data class UpdateProviderConfigRequest(
    val apiKey: String? = null,
    val apiSecret: String? = null,
    val oauthClientId: String? = null,
    val oauthClientSecret: String? = null,
    val webhookSecret: String? = null,
    val customConfig: Map<String, Any>? = null,
    val isActive: Boolean? = null,
    val syncEnabled: Boolean? = null,
    @field:Min(5) @field:Max(1440) val syncIntervalMinutes: Int? = null
)

data class CreateEquipmentUnitRequest(
    @field:NotNull val locationId: UUID,
    @field:NotNull val providerId: UUID,
    val externalId: String? = null,
    @field:NotNull val equipmentType: EquipmentType,
    @field:NotBlank @field:Size(max = 100) val name: String,
    @field:Size(max = 100) val nameAr: String? = null,
    @field:Size(max = 100) val model: String? = null,
    @field:Size(max = 100) val serialNumber: String? = null,
    @field:Size(max = 100) val manufacturer: String? = null,
    @field:Size(max = 100) val zone: String? = null,
    val floorNumber: Int? = null,
    val positionX: Int? = null,
    val positionY: Int? = null,
    val metadata: Map<String, Any>? = null
)

data class UpdateEquipmentUnitRequest(
    @field:Size(max = 100) val name: String? = null,
    @field:Size(max = 100) val nameAr: String? = null,
    val equipmentType: EquipmentType? = null,
    @field:Size(max = 100) val model: String? = null,
    @field:Size(max = 100) val serialNumber: String? = null,
    val status: EquipmentStatus? = null,
    @field:Size(max = 100) val zone: String? = null,
    val floorNumber: Int? = null,
    val positionX: Int? = null,
    val positionY: Int? = null,
    val metadata: Map<String, Any>? = null
)

data class CreateMemberProfileRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val providerId: UUID,
    val externalMemberId: String? = null,
    val externalUsername: String? = null
)

data class UpdateMemberProfileRequest(
    val externalMemberId: String? = null,
    val externalUsername: String? = null,
    val syncEnabled: Boolean? = null
)

data class CreateWorkoutRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val providerId: UUID,
    val equipmentUnitId: UUID? = null,
    val externalWorkoutId: String? = null,
    @field:NotNull val workoutType: WorkoutType,
    val equipmentType: EquipmentType? = null,
    @field:NotNull val startedAt: Instant,
    val endedAt: Instant? = null,
    val durationSeconds: Int? = null,
    val distanceMeters: Int? = null,
    val steps: Int? = null,
    val floorsClimbed: Int? = null,
    val caloriesTotal: Int? = null,
    val caloriesActive: Int? = null,
    val avgHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val heartRateZones: Map<String, Int>? = null,
    val avgPaceSecondsPerKm: Int? = null,
    val avgSpeedKmh: BigDecimal? = null,
    val maxSpeedKmh: BigDecimal? = null,
    val avgPowerWatts: Int? = null,
    val maxPowerWatts: Int? = null,
    val avgCadence: Int? = null,
    val totalReps: Int? = null,
    val totalSets: Int? = null,
    val totalWeightKg: BigDecimal? = null,
    val exercises: List<Map<String, Any>>? = null,
    val rawData: Map<String, Any>? = null
)

data class StartSyncRequest(
    val jobType: SyncJobType = SyncJobType.INCREMENTAL
)

// ========== Response DTOs ==========

data class EquipmentProviderResponse(
    val id: UUID,
    val name: String,
    val displayName: String,
    val apiBaseUrl: String?,
    val authType: AuthType,
    val documentationUrl: String?,
    val logoUrl: String?,
    val isActive: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(provider: EquipmentProvider) = EquipmentProviderResponse(
            id = provider.id,
            name = provider.name,
            displayName = provider.displayName,
            apiBaseUrl = provider.apiBaseUrl,
            authType = provider.authType,
            documentationUrl = provider.documentationUrl,
            logoUrl = provider.logoUrl,
            isActive = provider.isActive,
            createdAt = provider.createdAt
        )
    }
}

data class EquipmentProviderConfigResponse(
    val id: UUID,
    val providerId: UUID,
    val providerName: String?,
    val hasApiKey: Boolean,
    val hasOAuthClient: Boolean,
    val hasOAuthTokens: Boolean,
    val isTokenExpired: Boolean,
    val isActive: Boolean,
    val syncEnabled: Boolean,
    val syncIntervalMinutes: Int,
    val lastSyncAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(config: EquipmentProviderConfig) = EquipmentProviderConfigResponse(
            id = config.id,
            providerId = config.providerId,
            providerName = config.provider?.displayName,
            hasApiKey = !config.apiKeyEncrypted.isNullOrBlank(),
            hasOAuthClient = !config.oauthClientId.isNullOrBlank(),
            hasOAuthTokens = !config.oauthAccessTokenEncrypted.isNullOrBlank(),
            isTokenExpired = config.isTokenExpired(),
            isActive = config.isActive,
            syncEnabled = config.syncEnabled,
            syncIntervalMinutes = config.syncIntervalMinutes,
            lastSyncAt = config.lastSyncAt,
            createdAt = config.createdAt,
            updatedAt = config.updatedAt
        )
    }
}

data class EquipmentUnitResponse(
    val id: UUID,
    val locationId: UUID,
    val providerId: UUID,
    val providerName: String?,
    val externalId: String?,
    val equipmentType: EquipmentType,
    val name: String,
    val nameAr: String?,
    val model: String?,
    val serialNumber: String?,
    val manufacturer: String?,
    val isConnected: Boolean,
    val lastConnectedAt: Instant?,
    val status: EquipmentStatus,
    val zone: String?,
    val floorNumber: Int?,
    val positionX: Int?,
    val positionY: Int?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(unit: EquipmentUnit) = EquipmentUnitResponse(
            id = unit.id,
            locationId = unit.locationId,
            providerId = unit.providerId,
            providerName = unit.provider?.displayName,
            externalId = unit.externalId,
            equipmentType = unit.equipmentType,
            name = unit.name,
            nameAr = unit.nameAr,
            model = unit.model,
            serialNumber = unit.serialNumber,
            manufacturer = unit.manufacturer,
            isConnected = unit.isConnected,
            lastConnectedAt = unit.lastConnectedAt,
            status = unit.status,
            zone = unit.zone,
            floorNumber = unit.floorNumber,
            positionX = unit.positionX,
            positionY = unit.positionY,
            createdAt = unit.createdAt,
            updatedAt = unit.updatedAt
        )
    }
}

data class MemberEquipmentProfileResponse(
    val id: UUID,
    val memberId: UUID,
    val providerId: UUID,
    val providerName: String?,
    val externalMemberId: String?,
    val externalUsername: String?,
    val hasOAuthTokens: Boolean,
    val isTokenExpired: Boolean,
    val syncEnabled: Boolean,
    val lastSyncAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(profile: MemberEquipmentProfile) = MemberEquipmentProfileResponse(
            id = profile.id,
            memberId = profile.memberId,
            providerId = profile.providerId,
            providerName = profile.provider?.displayName,
            externalMemberId = profile.externalMemberId,
            externalUsername = profile.externalUsername,
            hasOAuthTokens = !profile.oauthAccessTokenEncrypted.isNullOrBlank(),
            isTokenExpired = profile.isTokenExpired(),
            syncEnabled = profile.syncEnabled,
            lastSyncAt = profile.lastSyncAt,
            createdAt = profile.createdAt,
            updatedAt = profile.updatedAt
        )
    }
}

data class EquipmentWorkoutResponse(
    val id: UUID,
    val memberId: UUID,
    val equipmentUnitId: UUID?,
    val providerId: UUID,
    val externalWorkoutId: String?,
    val workoutType: WorkoutType,
    val equipmentType: EquipmentType?,
    val startedAt: Instant,
    val endedAt: Instant?,
    val durationSeconds: Int?,
    val durationMinutes: Int?,
    val distanceMeters: Int?,
    val distanceKm: Double?,
    val steps: Int?,
    val floorsClimbed: Int?,
    val caloriesTotal: Int?,
    val caloriesActive: Int?,
    val avgHeartRate: Int?,
    val maxHeartRate: Int?,
    val avgSpeedKmh: BigDecimal?,
    val maxSpeedKmh: BigDecimal?,
    val avgPowerWatts: Int?,
    val maxPowerWatts: Int?,
    val avgCadence: Int?,
    val totalReps: Int?,
    val totalSets: Int?,
    val totalWeightKg: BigDecimal?,
    val syncSource: SyncSource,
    val createdAt: Instant
) {
    companion object {
        fun from(workout: EquipmentWorkout) = EquipmentWorkoutResponse(
            id = workout.id,
            memberId = workout.memberId,
            equipmentUnitId = workout.equipmentUnitId,
            providerId = workout.providerId,
            externalWorkoutId = workout.externalWorkoutId,
            workoutType = workout.workoutType,
            equipmentType = workout.equipmentType,
            startedAt = workout.startedAt,
            endedAt = workout.endedAt,
            durationSeconds = workout.durationSeconds,
            durationMinutes = workout.getDurationMinutes(),
            distanceMeters = workout.distanceMeters,
            distanceKm = workout.getDistanceKm(),
            steps = workout.steps,
            floorsClimbed = workout.floorsClimbed,
            caloriesTotal = workout.caloriesTotal,
            caloriesActive = workout.caloriesActive,
            avgHeartRate = workout.avgHeartRate,
            maxHeartRate = workout.maxHeartRate,
            avgSpeedKmh = workout.avgSpeedKmh,
            maxSpeedKmh = workout.maxSpeedKmh,
            avgPowerWatts = workout.avgPowerWatts,
            maxPowerWatts = workout.maxPowerWatts,
            avgCadence = workout.avgCadence,
            totalReps = workout.totalReps,
            totalSets = workout.totalSets,
            totalWeightKg = workout.totalWeightKg,
            syncSource = workout.syncSource,
            createdAt = workout.createdAt
        )
    }
}

data class WorkoutStatsResponse(
    val totalWorkouts: Long,
    val totalDurationSeconds: Long,
    val totalDurationMinutes: Long,
    val totalDurationHours: Double,
    val totalCalories: Long
) {
    companion object {
        fun from(stats: WorkoutStats) = WorkoutStatsResponse(
            totalWorkouts = stats.totalWorkouts,
            totalDurationSeconds = stats.totalDurationSeconds,
            totalDurationMinutes = stats.totalDurationMinutes,
            totalDurationHours = stats.totalDurationHours,
            totalCalories = stats.totalCalories
        )
    }
}

data class EquipmentSyncJobResponse(
    val id: UUID,
    val providerConfigId: UUID,
    val jobType: SyncJobType,
    val status: SyncJobStatus,
    val startedAt: Instant?,
    val completedAt: Instant?,
    val recordsProcessed: Int,
    val recordsCreated: Int,
    val recordsUpdated: Int,
    val recordsFailed: Int,
    val errorMessage: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(job: EquipmentSyncJob) = EquipmentSyncJobResponse(
            id = job.id,
            providerConfigId = job.providerConfigId,
            jobType = job.jobType,
            status = job.status,
            startedAt = job.startedAt,
            completedAt = job.completedAt,
            recordsProcessed = job.recordsProcessed,
            recordsCreated = job.recordsCreated,
            recordsUpdated = job.recordsUpdated,
            recordsFailed = job.recordsFailed,
            errorMessage = job.errorMessage,
            createdAt = job.createdAt
        )
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
