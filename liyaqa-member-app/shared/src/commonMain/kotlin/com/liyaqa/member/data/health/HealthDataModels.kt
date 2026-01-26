package com.liyaqa.member.data.health

import com.liyaqa.member.data.remote.dto.CreateDailyActivityRequest
import com.liyaqa.member.data.remote.dto.CreateWorkoutRequest

/**
 * Health data models for platform-specific health integrations
 * (Apple Health / HealthKit on iOS, Health Connect / Google Fit on Android)
 */

/**
 * Daily activity data read from device health platform
 */
data class HealthDailyActivity(
    val date: String, // YYYY-MM-DD
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
    val hrvAverage: Double? = null
) {
    fun toCreateRequest(connectionId: String): CreateDailyActivityRequest {
        return CreateDailyActivityRequest(
            connectionId = connectionId,
            activityDate = date,
            steps = steps,
            distanceMeters = distanceMeters,
            floorsClimbed = floorsClimbed,
            caloriesTotal = caloriesTotal,
            caloriesActive = caloriesActive,
            activeMinutes = activeMinutes,
            sedentaryMinutes = sedentaryMinutes,
            sleepMinutes = sleepMinutes,
            sleepQualityScore = sleepQualityScore,
            restingHeartRate = restingHeartRate,
            hrvAverage = hrvAverage,
            syncSource = "SDK"
        )
    }
}

/**
 * Workout data read from device health platform
 */
data class HealthWorkout(
    val externalId: String? = null,
    val activityType: String,
    val activityName: String? = null,
    val startedAt: String, // ISO-8601 timestamp
    val endedAt: String? = null,
    val durationSeconds: Int? = null,
    val distanceMeters: Int? = null,
    val caloriesBurned: Int? = null,
    val avgHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val steps: Int? = null,
    val elevationGainMeters: Int? = null
) {
    fun toCreateRequest(connectionId: String): CreateWorkoutRequest {
        return CreateWorkoutRequest(
            connectionId = connectionId,
            externalWorkoutId = externalId,
            activityType = activityType,
            activityName = activityName,
            startedAt = startedAt,
            endedAt = endedAt,
            durationSeconds = durationSeconds,
            distanceMeters = distanceMeters,
            caloriesBurned = caloriesBurned,
            avgHeartRate = avgHeartRate,
            maxHeartRate = maxHeartRate,
            steps = steps,
            elevationGainMeters = elevationGainMeters,
            syncSource = "SDK"
        )
    }
}

/**
 * Result of permission request
 */
enum class HealthPermissionResult {
    GRANTED,
    DENIED,
    NOT_AVAILABLE,
    ERROR
}

/**
 * Status of health platform availability
 */
data class HealthPlatformStatus(
    val isAvailable: Boolean,
    val hasPermissions: Boolean,
    val platformName: String, // APPLE_HEALTH or GOOGLE_FIT
    val displayName: String
)
