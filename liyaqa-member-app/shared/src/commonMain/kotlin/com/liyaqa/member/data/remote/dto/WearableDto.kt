package com.liyaqa.member.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Request to create a wearable connection
 */
@Serializable
data class CreateConnectionRequest(
    val platformId: String,
    val externalUserId: String? = null,
    val externalUsername: String? = null,
    val syncSource: String = "SDK"
)

/**
 * Request to create a daily activity record
 */
@Serializable
data class CreateDailyActivityRequest(
    val connectionId: String,
    val activityDate: String,
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
    val hrvAverage: Double? = null,
    val stressScore: Int? = null,
    val recoveryScore: Int? = null,
    val rawData: Map<String, String>? = null,
    val syncSource: String = "SDK"
)

/**
 * Request to create a workout record
 */
@Serializable
data class CreateWorkoutRequest(
    val connectionId: String,
    val externalWorkoutId: String? = null,
    val activityType: String,
    val activityName: String? = null,
    val startedAt: String,
    val endedAt: String? = null,
    val durationSeconds: Int? = null,
    val distanceMeters: Int? = null,
    val caloriesBurned: Int? = null,
    val avgHeartRate: Int? = null,
    val maxHeartRate: Int? = null,
    val avgPaceSecondsPerKm: Int? = null,
    val elevationGainMeters: Int? = null,
    val steps: Int? = null,
    val rawData: Map<String, String>? = null,
    val syncSource: String = "SDK"
)

/**
 * Request to start a sync job
 */
@Serializable
data class StartSyncRequest(
    val jobType: String = "FULL_SYNC"
)

/**
 * Request for batch sync from device
 */
@Serializable
data class BatchSyncRequest(
    val activities: List<CreateDailyActivityRequest> = emptyList(),
    val workouts: List<CreateWorkoutRequest> = emptyList()
)

/**
 * Response from batch sync
 */
@Serializable
data class BatchSyncResponse(
    val activitiesCreated: Int,
    val activitiesUpdated: Int,
    val activitiesFailed: Int,
    val workoutsCreated: Int,
    val workoutsUpdated: Int,
    val workoutsFailed: Int,
    val errors: List<String> = emptyList()
)
