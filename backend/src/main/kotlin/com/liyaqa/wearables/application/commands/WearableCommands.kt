package com.liyaqa.wearables.application.commands

import com.liyaqa.wearables.domain.model.SyncJobType
import com.liyaqa.wearables.domain.model.SyncSource
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.*

data class CreateConnectionCommand(
    val memberId: UUID,
    val platformId: UUID,
    val externalUserId: String? = null,
    val externalUsername: String? = null
)

data class UpdateConnectionCommand(
    val externalUserId: String? = null,
    val externalUsername: String? = null,
    val syncEnabled: Boolean? = null
)

data class UpdateConnectionTokensCommand(
    val accessToken: String,
    val refreshToken: String? = null,
    val expiresAt: Instant? = null
)

data class CreateDailyActivityCommand(
    val memberId: UUID,
    val connectionId: UUID,
    val activityDate: LocalDate,
    val steps: Int? = null,
    val distanceMeters: Int? = null,
    val floorsClimbed: Int? = null,
    val caloriesTotal: Int? = null,
    val caloriesActive: Int? = null,
    val activeMinutes: Int? = null,
    val sedentaryMinutes: Int? = null,
    val sleepMinutes: Int? = null,
    val sleepQualityScore: Int? = null,
    val restingHeartRate: Int? = null,
    val hrvAverage: BigDecimal? = null,
    val stressScore: Int? = null,
    val recoveryScore: Int? = null,
    val rawData: Map<String, Any>? = null,
    val syncSource: SyncSource = SyncSource.API
)

data class CreateWorkoutCommand(
    val memberId: UUID,
    val connectionId: UUID,
    val externalWorkoutId: String? = null,
    val activityType: String,
    val activityName: String? = null,
    val startedAt: Instant,
    val endedAt: Instant? = null,
    val durationSeconds: Int? = null,
    val distanceMeters: Int? = null,
    val caloriesBurned: Int? = null,
    val avgHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val avgPaceSecondsPerKm: Int? = null,
    val elevationGainMeters: Int? = null,
    val steps: Int? = null,
    val rawData: Map<String, Any>? = null,
    val syncSource: SyncSource = SyncSource.API
)

data class StartSyncJobCommand(
    val connectionId: UUID,
    val jobType: SyncJobType = SyncJobType.INCREMENTAL
)
