package com.liyaqa.member.data.remote.api

import com.liyaqa.member.data.remote.dto.BatchSyncRequest
import com.liyaqa.member.data.remote.dto.BatchSyncResponse
import com.liyaqa.member.data.remote.dto.CreateConnectionRequest
import com.liyaqa.member.data.remote.dto.CreateDailyActivityRequest
import com.liyaqa.member.data.remote.dto.CreateWorkoutRequest
import com.liyaqa.member.data.remote.dto.StartSyncRequest
import com.liyaqa.member.domain.model.WearableActivityStats
import com.liyaqa.member.domain.model.WearableConnection
import com.liyaqa.member.domain.model.WearableDailyActivity
import com.liyaqa.member.domain.model.WearablePlatform
import com.liyaqa.member.domain.model.WearableSyncJob
import com.liyaqa.member.domain.model.WearableWorkout
import com.liyaqa.member.domain.model.WearableWorkoutStats
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.client.request.parameter
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.json.Json

/**
 * API client for wearable integration endpoints
 */
class WearableApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    // ========== Platforms ==========

    /**
     * Get all available wearable platforms
     */
    suspend fun getPlatforms(): Result<List<WearablePlatform>> =
        httpGet("/api/wearables/platforms", typeInfo<List<WearablePlatform>>())

    /**
     * Get a specific platform by ID
     */
    suspend fun getPlatform(platformId: String): Result<WearablePlatform> =
        httpGet("/api/wearables/platforms/$platformId", typeInfo<WearablePlatform>())

    // ========== Connections ==========

    /**
     * Get current member's wearable connections
     */
    suspend fun getMyConnections(): Result<List<WearableConnection>> =
        httpGet("/api/wearables/members/me/connections", typeInfo<List<WearableConnection>>())

    /**
     * Create a new wearable connection for current member
     */
    suspend fun createConnection(request: CreateConnectionRequest): Result<WearableConnection> =
        httpPost("/api/wearables/connections", typeInfo<WearableConnection>(), request)

    /**
     * Delete/disconnect a wearable connection
     */
    suspend fun deleteConnection(connectionId: String): Result<Unit> =
        deleteUnit("/api/wearables/connections/$connectionId")

    /**
     * Toggle sync enabled for a connection
     */
    suspend fun updateConnectionSyncEnabled(connectionId: String, syncEnabled: Boolean): Result<WearableConnection> =
        httpPatch(
            "/api/wearables/connections/$connectionId",
            typeInfo<WearableConnection>(),
            mapOf("syncEnabled" to syncEnabled)
        )

    // ========== Activities ==========

    /**
     * Get daily activities for current member
     */
    suspend fun getMyActivities(
        startDate: String? = null,
        endDate: String? = null,
        limit: Int = 30
    ): Result<List<WearableDailyActivity>> =
        httpGet("/api/wearables/members/me/activities", typeInfo<List<WearableDailyActivity>>()) {
            startDate?.let { parameter("startDate", it) }
            endDate?.let { parameter("endDate", it) }
            parameter("limit", limit)
        }

    /**
     * Get latest activity for current member
     */
    suspend fun getLatestActivity(): Result<WearableDailyActivity?> =
        httpGet("/api/wearables/members/me/activities/latest", typeInfo<WearableDailyActivity?>())

    /**
     * Create a daily activity record (for SDK sync)
     */
    suspend fun createActivity(request: CreateDailyActivityRequest): Result<WearableDailyActivity> =
        httpPost("/api/wearables/activities", typeInfo<WearableDailyActivity>(), request)

    // ========== Workouts ==========

    /**
     * Get workouts for current member
     */
    suspend fun getMyWorkouts(
        startDate: String? = null,
        endDate: String? = null,
        limit: Int = 30
    ): Result<List<WearableWorkout>> =
        httpGet("/api/wearables/members/me/workouts", typeInfo<List<WearableWorkout>>()) {
            startDate?.let { parameter("startDate", it) }
            endDate?.let { parameter("endDate", it) }
            parameter("limit", limit)
        }

    /**
     * Create a workout record (for SDK sync)
     */
    suspend fun createWorkout(request: CreateWorkoutRequest): Result<WearableWorkout> =
        httpPost("/api/wearables/workouts", typeInfo<WearableWorkout>(), request)

    // ========== Stats ==========

    /**
     * Get activity statistics for current member
     */
    suspend fun getMyActivityStats(
        startDate: String? = null,
        endDate: String? = null
    ): Result<WearableActivityStats> =
        httpGet("/api/wearables/members/me/stats/activities", typeInfo<WearableActivityStats>()) {
            startDate?.let { parameter("startDate", it) }
            endDate?.let { parameter("endDate", it) }
        }

    /**
     * Get workout statistics for current member
     */
    suspend fun getMyWorkoutStats(
        startDate: String? = null,
        endDate: String? = null
    ): Result<WearableWorkoutStats> =
        httpGet("/api/wearables/members/me/stats/workouts", typeInfo<WearableWorkoutStats>()) {
            startDate?.let { parameter("startDate", it) }
            endDate?.let { parameter("endDate", it) }
        }

    // ========== Sync ==========

    /**
     * Start sync job for a connection
     */
    suspend fun startSync(connectionId: String, request: StartSyncRequest = StartSyncRequest()): Result<WearableSyncJob> =
        httpPost("/api/wearables/connections/$connectionId/sync", typeInfo<WearableSyncJob>(), request)

    /**
     * Get sync jobs for a connection
     */
    suspend fun getSyncJobs(connectionId: String, limit: Int = 10): Result<List<WearableSyncJob>> =
        httpGet("/api/wearables/connections/$connectionId/sync-jobs", typeInfo<List<WearableSyncJob>>()) {
            parameter("limit", limit)
        }

    /**
     * Batch sync from device (for SDK sync)
     */
    suspend fun batchSync(connectionId: String, request: BatchSyncRequest): Result<BatchSyncResponse> =
        httpPost("/api/wearables/connections/$connectionId/sync/batch", typeInfo<BatchSyncResponse>(), request)
}
