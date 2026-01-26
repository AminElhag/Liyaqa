package com.liyaqa.member.domain.repository

import com.liyaqa.member.data.remote.dto.BatchSyncRequest
import com.liyaqa.member.data.remote.dto.BatchSyncResponse
import com.liyaqa.member.domain.model.WearableActivityStats
import com.liyaqa.member.domain.model.WearableConnection
import com.liyaqa.member.domain.model.WearableDailyActivity
import com.liyaqa.member.domain.model.WearablePlatform
import com.liyaqa.member.domain.model.WearableSyncJob
import com.liyaqa.member.domain.model.WearableWorkout
import com.liyaqa.member.domain.model.WearableWorkoutStats
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for wearable integration operations
 */
interface WearableRepository {

    // ========== Platforms ==========

    /**
     * Get all available wearable platforms
     */
    suspend fun getPlatforms(): Result<List<WearablePlatform>>

    /**
     * Get device SDK platforms (Apple Health, Google Fit)
     */
    suspend fun getDeviceSdkPlatforms(): Result<List<WearablePlatform>>

    // ========== Connections ==========

    /**
     * Get current member's wearable connections
     */
    suspend fun getMyConnections(): Result<List<WearableConnection>>

    /**
     * Get connections as a Flow for reactive updates
     */
    fun observeConnections(): Flow<Result<List<WearableConnection>>>

    /**
     * Create a new wearable connection
     */
    suspend fun createConnection(platformId: String): Result<WearableConnection>

    /**
     * Delete/disconnect a wearable connection
     */
    suspend fun deleteConnection(connectionId: String): Result<Unit>

    /**
     * Toggle sync enabled for a connection
     */
    suspend fun toggleSyncEnabled(connectionId: String, enabled: Boolean): Result<WearableConnection>

    // ========== Activities ==========

    /**
     * Get daily activities for current member
     */
    suspend fun getMyActivities(
        startDate: String? = null,
        endDate: String? = null,
        limit: Int = 30
    ): Result<List<WearableDailyActivity>>

    /**
     * Get latest activity for current member
     */
    suspend fun getLatestActivity(): Result<WearableDailyActivity?>

    /**
     * Get activity statistics for current member
     */
    suspend fun getMyActivityStats(
        startDate: String? = null,
        endDate: String? = null
    ): Result<WearableActivityStats>

    // ========== Workouts ==========

    /**
     * Get workouts for current member
     */
    suspend fun getMyWorkouts(
        startDate: String? = null,
        endDate: String? = null,
        limit: Int = 30
    ): Result<List<WearableWorkout>>

    /**
     * Get workout statistics for current member
     */
    suspend fun getMyWorkoutStats(
        startDate: String? = null,
        endDate: String? = null
    ): Result<WearableWorkoutStats>

    // ========== Sync ==========

    /**
     * Start sync job for a connection
     */
    suspend fun startSync(connectionId: String): Result<WearableSyncJob>

    /**
     * Get sync jobs for a connection
     */
    suspend fun getSyncJobs(connectionId: String, limit: Int = 10): Result<List<WearableSyncJob>>

    /**
     * Batch sync from device (for SDK platforms)
     */
    suspend fun batchSync(connectionId: String, request: BatchSyncRequest): Result<BatchSyncResponse>

    /**
     * Refresh all data (invalidate cache)
     */
    suspend fun refresh()
}
