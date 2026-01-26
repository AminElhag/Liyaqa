package com.liyaqa.wearables.api

import com.liyaqa.wearables.application.services.WearableActivityStats
import com.liyaqa.wearables.application.services.WearableWorkoutStats
import com.liyaqa.wearables.domain.model.*
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.*

// ========== Request DTOs ==========

data class CreateConnectionRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val platformId: UUID,
    val externalUserId: String? = null,
    val externalUsername: String? = null
)

data class UpdateConnectionRequest(
    val externalUserId: String? = null,
    val externalUsername: String? = null,
    val syncEnabled: Boolean? = null
)

data class UpdateConnectionTokensRequest(
    @field:NotBlank val accessToken: String,
    val refreshToken: String? = null,
    val expiresAt: Instant? = null
)

data class OAuthCallbackRequest(
    @field:NotBlank val code: String,
    @field:NotNull val platformId: UUID,
    @field:NotNull val memberId: UUID,
    val state: String? = null,
    val redirectUri: String? = null
)

data class CreateDailyActivityRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val connectionId: UUID,
    @field:NotNull val activityDate: LocalDate,
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
    val rawData: Map<String, Any>? = null
)

data class CreateWearableWorkoutRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val connectionId: UUID,
    val externalWorkoutId: String? = null,
    @field:NotBlank val activityType: String,
    val activityName: String? = null,
    @field:NotNull val startedAt: Instant,
    val endedAt: Instant? = null,
    val durationSeconds: Int? = null,
    val distanceMeters: Int? = null,
    val caloriesBurned: Int? = null,
    val avgHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val avgPaceSecondsPerKm: Int? = null,
    val elevationGainMeters: Int? = null,
    val steps: Int? = null,
    val rawData: Map<String, Any>? = null
)

data class StartSyncRequest(
    val jobType: SyncJobType = SyncJobType.INCREMENTAL
)

// ========== Response DTOs ==========

data class WearablePlatformResponse(
    val id: UUID,
    val name: String,
    val displayName: String,
    val apiBaseUrl: String?,
    val oauthAuthUrl: String?,
    val authType: WearableAuthType,
    val logoUrl: String?,
    val isActive: Boolean,
    val supportsOAuth: Boolean
) {
    companion object {
        fun from(platform: WearablePlatform) = WearablePlatformResponse(
            id = platform.id,
            name = platform.name,
            displayName = platform.displayName,
            apiBaseUrl = platform.apiBaseUrl,
            oauthAuthUrl = platform.oauthAuthUrl,
            authType = platform.authType,
            logoUrl = platform.logoUrl,
            isActive = platform.isActive,
            supportsOAuth = platform.supportsOAuth()
        )
    }
}

data class MemberWearableConnectionResponse(
    val id: UUID,
    val memberId: UUID,
    val platformId: UUID,
    val platformName: String?,
    val platformDisplayName: String?,
    val platformLogoUrl: String?,
    val externalUserId: String?,
    val externalUsername: String?,
    val hasOAuthTokens: Boolean,
    val isTokenExpired: Boolean,
    val syncEnabled: Boolean,
    val lastSyncAt: Instant?,
    val lastSyncStatus: SyncStatus?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(connection: MemberWearableConnection) = MemberWearableConnectionResponse(
            id = connection.id,
            memberId = connection.memberId,
            platformId = connection.platformId,
            platformName = connection.platform?.name,
            platformDisplayName = connection.platform?.displayName,
            platformLogoUrl = connection.platform?.logoUrl,
            externalUserId = connection.externalUserId,
            externalUsername = connection.externalUsername,
            hasOAuthTokens = connection.oauthAccessTokenEncrypted != null,
            isTokenExpired = connection.isTokenExpired(),
            syncEnabled = connection.syncEnabled,
            lastSyncAt = connection.lastSyncAt,
            lastSyncStatus = connection.lastSyncStatus,
            createdAt = connection.createdAt,
            updatedAt = connection.updatedAt
        )
    }
}

data class WearableDailyActivityResponse(
    val id: UUID,
    val memberId: UUID,
    val connectionId: UUID,
    val activityDate: LocalDate,
    val steps: Int?,
    val distanceMeters: Int?,
    val distanceKm: Double?,
    val floorsClimbed: Int?,
    val caloriesTotal: Int?,
    val caloriesActive: Int?,
    val activeMinutes: Int?,
    val activeHours: Double?,
    val sedentaryMinutes: Int?,
    val sleepMinutes: Int?,
    val sleepHours: Double?,
    val sleepQualityScore: Int?,
    val restingHeartRate: Int?,
    val hrvAverage: BigDecimal?,
    val stressScore: Int?,
    val recoveryScore: Int?,
    val syncSource: SyncSource,
    val createdAt: Instant
) {
    companion object {
        fun from(activity: WearableDailyActivity) = WearableDailyActivityResponse(
            id = activity.id,
            memberId = activity.memberId,
            connectionId = activity.connectionId,
            activityDate = activity.activityDate,
            steps = activity.steps,
            distanceMeters = activity.distanceMeters,
            distanceKm = activity.getDistanceKm(),
            floorsClimbed = activity.floorsClimbed,
            caloriesTotal = activity.caloriesTotal,
            caloriesActive = activity.caloriesActive,
            activeMinutes = activity.activeMinutes,
            activeHours = activity.getActiveHours(),
            sedentaryMinutes = activity.sedentaryMinutes,
            sleepMinutes = activity.sleepMinutes,
            sleepHours = activity.getSleepHours(),
            sleepQualityScore = activity.sleepQualityScore,
            restingHeartRate = activity.restingHeartRate,
            hrvAverage = activity.hrvAverage,
            stressScore = activity.stressScore,
            recoveryScore = activity.recoveryScore,
            syncSource = activity.syncSource,
            createdAt = activity.createdAt
        )
    }
}

data class WearableWorkoutResponse(
    val id: UUID,
    val memberId: UUID,
    val connectionId: UUID,
    val externalWorkoutId: String?,
    val activityType: String,
    val activityName: String?,
    val startedAt: Instant,
    val endedAt: Instant?,
    val durationSeconds: Int?,
    val durationMinutes: Int?,
    val distanceMeters: Int?,
    val distanceKm: Double?,
    val caloriesBurned: Int?,
    val avgHeartRate: Int?,
    val maxHeartRate: Int?,
    val avgPaceSecondsPerKm: Int?,
    val avgPaceMinutesPerKm: Double?,
    val elevationGainMeters: Int?,
    val steps: Int?,
    val syncSource: SyncSource,
    val createdAt: Instant
) {
    companion object {
        fun from(workout: WearableWorkout) = WearableWorkoutResponse(
            id = workout.id,
            memberId = workout.memberId,
            connectionId = workout.connectionId,
            externalWorkoutId = workout.externalWorkoutId,
            activityType = workout.activityType,
            activityName = workout.activityName,
            startedAt = workout.startedAt,
            endedAt = workout.endedAt,
            durationSeconds = workout.durationSeconds,
            durationMinutes = workout.getDurationMinutes(),
            distanceMeters = workout.distanceMeters,
            distanceKm = workout.getDistanceKm(),
            caloriesBurned = workout.caloriesBurned,
            avgHeartRate = workout.avgHeartRate,
            maxHeartRate = workout.maxHeartRate,
            avgPaceSecondsPerKm = workout.avgPaceSecondsPerKm,
            avgPaceMinutesPerKm = workout.getAvgPaceMinutesPerKm(),
            elevationGainMeters = workout.elevationGainMeters,
            steps = workout.steps,
            syncSource = workout.syncSource,
            createdAt = workout.createdAt
        )
    }
}

data class WearableWorkoutStatsResponse(
    val totalWorkouts: Long,
    val totalDurationSeconds: Long,
    val totalDurationMinutes: Long,
    val totalDurationHours: Double,
    val totalCalories: Long
) {
    companion object {
        fun from(stats: WearableWorkoutStats) = WearableWorkoutStatsResponse(
            totalWorkouts = stats.totalWorkouts,
            totalDurationSeconds = stats.totalDurationSeconds,
            totalDurationMinutes = stats.totalDurationMinutes,
            totalDurationHours = stats.totalDurationHours,
            totalCalories = stats.totalCalories
        )
    }
}

data class WearableActivityStatsResponse(
    val daysTracked: Int,
    val totalSteps: Long,
    val averageStepsPerDay: Double,
    val totalCalories: Long,
    val totalActiveMinutes: Int,
    val totalActiveHours: Double,
    val averageSleepMinutes: Int,
    val averageSleepHours: Double,
    val averageRestingHeartRate: Int?
) {
    companion object {
        fun from(stats: WearableActivityStats) = WearableActivityStatsResponse(
            daysTracked = stats.daysTracked,
            totalSteps = stats.totalSteps,
            averageStepsPerDay = stats.averageStepsPerDay,
            totalCalories = stats.totalCalories,
            totalActiveMinutes = stats.totalActiveMinutes,
            totalActiveHours = stats.totalActiveHours,
            averageSleepMinutes = stats.averageSleepMinutes,
            averageSleepHours = stats.averageSleepHours,
            averageRestingHeartRate = stats.averageRestingHeartRate
        )
    }
}

data class WearableSyncJobResponse(
    val id: UUID,
    val connectionId: UUID,
    val jobType: SyncJobType,
    val status: SyncJobStatus,
    val startedAt: Instant?,
    val completedAt: Instant?,
    val durationSeconds: Long?,
    val recordsProcessed: Int,
    val recordsCreated: Int,
    val recordsUpdated: Int,
    val recordsFailed: Int,
    val errorMessage: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(job: WearableSyncJob) = WearableSyncJobResponse(
            id = job.id,
            connectionId = job.connectionId,
            jobType = job.jobType,
            status = job.status,
            startedAt = job.startedAt,
            completedAt = job.completedAt,
            durationSeconds = job.getDurationSeconds(),
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
