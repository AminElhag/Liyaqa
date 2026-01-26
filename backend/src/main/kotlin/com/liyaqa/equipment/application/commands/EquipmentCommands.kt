package com.liyaqa.equipment.application.commands

import com.liyaqa.equipment.domain.model.EquipmentStatus
import com.liyaqa.equipment.domain.model.EquipmentType
import com.liyaqa.equipment.domain.model.SyncJobType
import com.liyaqa.equipment.domain.model.WorkoutType
import java.math.BigDecimal
import java.time.Instant
import java.util.*

// ========== Provider Config Commands ==========

data class CreateProviderConfigCommand(
    val providerId: UUID,
    val apiKey: String? = null,
    val apiSecret: String? = null,
    val oauthClientId: String? = null,
    val oauthClientSecret: String? = null,
    val webhookSecret: String? = null,
    val customConfig: Map<String, Any>? = null,
    val syncIntervalMinutes: Int = 60
)

data class UpdateProviderConfigCommand(
    val apiKey: String? = null,
    val apiSecret: String? = null,
    val oauthClientId: String? = null,
    val oauthClientSecret: String? = null,
    val webhookSecret: String? = null,
    val customConfig: Map<String, Any>? = null,
    val isActive: Boolean? = null,
    val syncEnabled: Boolean? = null,
    val syncIntervalMinutes: Int? = null
)

data class UpdateOAuthTokensCommand(
    val accessToken: String,
    val refreshToken: String?,
    val expiresAt: Instant?
)

// ========== Equipment Unit Commands ==========

data class CreateEquipmentUnitCommand(
    val locationId: UUID,
    val providerId: UUID,
    val externalId: String? = null,
    val equipmentType: EquipmentType,
    val name: String,
    val nameAr: String? = null,
    val model: String? = null,
    val serialNumber: String? = null,
    val manufacturer: String? = null,
    val zone: String? = null,
    val floorNumber: Int? = null,
    val positionX: Int? = null,
    val positionY: Int? = null,
    val metadata: Map<String, Any>? = null
)

data class UpdateEquipmentUnitCommand(
    val name: String? = null,
    val nameAr: String? = null,
    val equipmentType: EquipmentType? = null,
    val model: String? = null,
    val serialNumber: String? = null,
    val status: EquipmentStatus? = null,
    val zone: String? = null,
    val floorNumber: Int? = null,
    val positionX: Int? = null,
    val positionY: Int? = null,
    val metadata: Map<String, Any>? = null
)

// ========== Member Profile Commands ==========

data class CreateMemberProfileCommand(
    val memberId: UUID,
    val providerId: UUID,
    val externalMemberId: String? = null,
    val externalUsername: String? = null
)

data class UpdateMemberProfileCommand(
    val externalMemberId: String? = null,
    val externalUsername: String? = null,
    val syncEnabled: Boolean? = null
)

data class UpdateMemberOAuthTokensCommand(
    val accessToken: String,
    val refreshToken: String?,
    val expiresAt: Instant?
)

// ========== Workout Commands ==========

data class CreateWorkoutCommand(
    val memberId: UUID,
    val providerId: UUID,
    val equipmentUnitId: UUID? = null,
    val externalWorkoutId: String? = null,
    val workoutType: WorkoutType,
    val equipmentType: EquipmentType? = null,
    val startedAt: Instant,
    val endedAt: Instant? = null,
    val durationSeconds: Int? = null,
    // Cardio
    val distanceMeters: Int? = null,
    val steps: Int? = null,
    val floorsClimbed: Int? = null,
    // Calories
    val caloriesTotal: Int? = null,
    val caloriesActive: Int? = null,
    // Heart rate
    val avgHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val heartRateZones: Map<String, Int>? = null,
    // Intensity
    val avgPaceSecondsPerKm: Int? = null,
    val avgSpeedKmh: BigDecimal? = null,
    val maxSpeedKmh: BigDecimal? = null,
    val avgPowerWatts: Int? = null,
    val maxPowerWatts: Int? = null,
    val avgCadence: Int? = null,
    // Strength
    val totalReps: Int? = null,
    val totalSets: Int? = null,
    val totalWeightKg: BigDecimal? = null,
    val exercises: List<Map<String, Any>>? = null,
    // Raw data
    val rawData: Map<String, Any>? = null
)

// ========== Sync Commands ==========

data class StartSyncJobCommand(
    val providerConfigId: UUID,
    val jobType: SyncJobType = SyncJobType.INCREMENTAL
)
