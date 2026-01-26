package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.WearableApi
import com.liyaqa.member.data.remote.dto.BatchSyncRequest
import com.liyaqa.member.data.remote.dto.BatchSyncResponse
import com.liyaqa.member.data.remote.dto.CreateConnectionRequest
import com.liyaqa.member.domain.model.WearableActivityStats
import com.liyaqa.member.domain.model.WearableAuthType
import com.liyaqa.member.domain.model.WearableConnection
import com.liyaqa.member.domain.model.WearableDailyActivity
import com.liyaqa.member.domain.model.WearablePlatform
import com.liyaqa.member.domain.model.WearableSyncJob
import com.liyaqa.member.domain.model.WearableWorkout
import com.liyaqa.member.domain.model.WearableWorkoutStats
import com.liyaqa.member.domain.repository.WearableRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.flow

class WearableRepositoryImpl(
    private val wearableApi: WearableApi
) : WearableRepository {

    // Cache for platforms and connections
    private var cachedPlatforms: List<WearablePlatform>? = null
    private var cachedConnections: List<WearableConnection>? = null

    // SharedFlow for connection updates
    private val _connectionsFlow = MutableSharedFlow<Result<List<WearableConnection>>>(replay = 1)

    // ========== Platforms ==========

    override suspend fun getPlatforms(): Result<List<WearablePlatform>> {
        cachedPlatforms?.let { return Result.success(it) }

        return wearableApi.getPlatforms().onSuccess { platforms ->
            cachedPlatforms = platforms
        }
    }

    override suspend fun getDeviceSdkPlatforms(): Result<List<WearablePlatform>> {
        return getPlatforms().map { platforms ->
            platforms.filter { it.authTypeEnum == WearableAuthType.DEVICE_SDK }
        }
    }

    // ========== Connections ==========

    override suspend fun getMyConnections(): Result<List<WearableConnection>> {
        return wearableApi.getMyConnections().onSuccess { connections ->
            cachedConnections = connections
            _connectionsFlow.emit(Result.success(connections))
        }
    }

    override fun observeConnections(): Flow<Result<List<WearableConnection>>> = flow {
        // Emit cached first if available
        cachedConnections?.let { emit(Result.success(it)) }

        // Fetch fresh data
        val result = getMyConnections()
        emit(result)

        // Subscribe to future updates
        _connectionsFlow.asSharedFlow().collect { emit(it) }
    }

    override suspend fun createConnection(platformId: String): Result<WearableConnection> {
        val request = CreateConnectionRequest(
            platformId = platformId,
            syncSource = "SDK"
        )
        return wearableApi.createConnection(request).also {
            it.onSuccess { refreshConnections() }
        }
    }

    override suspend fun deleteConnection(connectionId: String): Result<Unit> {
        return wearableApi.deleteConnection(connectionId).also {
            it.onSuccess { refreshConnections() }
        }
    }

    override suspend fun toggleSyncEnabled(connectionId: String, enabled: Boolean): Result<WearableConnection> {
        return wearableApi.updateConnectionSyncEnabled(connectionId, enabled).also {
            it.onSuccess { refreshConnections() }
        }
    }

    // ========== Activities ==========

    override suspend fun getMyActivities(
        startDate: String?,
        endDate: String?,
        limit: Int
    ): Result<List<WearableDailyActivity>> {
        return wearableApi.getMyActivities(startDate, endDate, limit)
    }

    override suspend fun getLatestActivity(): Result<WearableDailyActivity?> {
        return wearableApi.getLatestActivity()
    }

    override suspend fun getMyActivityStats(
        startDate: String?,
        endDate: String?
    ): Result<WearableActivityStats> {
        return wearableApi.getMyActivityStats(startDate, endDate)
    }

    // ========== Workouts ==========

    override suspend fun getMyWorkouts(
        startDate: String?,
        endDate: String?,
        limit: Int
    ): Result<List<WearableWorkout>> {
        return wearableApi.getMyWorkouts(startDate, endDate, limit)
    }

    override suspend fun getMyWorkoutStats(
        startDate: String?,
        endDate: String?
    ): Result<WearableWorkoutStats> {
        return wearableApi.getMyWorkoutStats(startDate, endDate)
    }

    // ========== Sync ==========

    override suspend fun startSync(connectionId: String): Result<WearableSyncJob> {
        return wearableApi.startSync(connectionId)
    }

    override suspend fun getSyncJobs(connectionId: String, limit: Int): Result<List<WearableSyncJob>> {
        return wearableApi.getSyncJobs(connectionId, limit)
    }

    override suspend fun batchSync(connectionId: String, request: BatchSyncRequest): Result<BatchSyncResponse> {
        return wearableApi.batchSync(connectionId, request)
    }

    // ========== Cache Management ==========

    override suspend fun refresh() {
        cachedPlatforms = null
        cachedConnections = null
        getMyConnections()
    }

    private suspend fun refreshConnections() {
        getMyConnections()
    }
}

// Extension to map Result
private inline fun <T, R> Result<T>.map(transform: (T) -> R): Result<R> {
    return when (this) {
        is Result.Success -> Result.success(transform(data))
        is Result.Error -> Result.error(exception, message, messageAr, code)
    }
}
