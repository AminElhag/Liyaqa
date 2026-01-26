package com.liyaqa.member.presentation.screens.wearables

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.data.health.HealthDataManager
import com.liyaqa.member.data.health.HealthPlatformStatus
import com.liyaqa.member.data.health.HealthPermissionResult
import com.liyaqa.member.data.remote.dto.BatchSyncRequest
import com.liyaqa.member.domain.model.WearableConnection
import com.liyaqa.member.domain.model.WearablePlatform
import com.liyaqa.member.domain.repository.WearableRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.toLocalDateTime

data class WearablesState(
    val isLoading: Boolean = false,
    val isConnecting: Boolean = false,
    val isSyncing: Boolean = false,
    val platforms: List<WearablePlatform> = emptyList(),
    val connections: List<WearableConnection> = emptyList(),
    val devicePlatformStatus: HealthPlatformStatus? = null,
    val devicePlatformId: String? = null, // Platform ID for device SDK platform
    val error: WearablesError? = null,
    val successMessage: String? = null
)

data class WearablesError(
    val message: String,
    val messageAr: String? = null
)

class WearablesScreenModel(
    private val wearableRepository: WearableRepository,
    private val healthDataManager: HealthDataManager
) : ScreenModel {

    private val _state = MutableStateFlow(WearablesState())
    val state: StateFlow<WearablesState> = _state.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // Load platforms
            wearableRepository.getPlatforms().onSuccess { platforms ->
                // Find the device SDK platform for this device
                val devicePlatformName = healthDataManager.getPlatformName()
                val devicePlatform = platforms.find { it.name == devicePlatformName }

                _state.update {
                    it.copy(
                        platforms = platforms,
                        devicePlatformId = devicePlatform?.id
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        error = WearablesError(
                            message = error.message ?: "Failed to load platforms",
                            messageAr = error.messageAr
                        )
                    )
                }
            }

            // Load connections
            wearableRepository.getMyConnections().onSuccess { connections ->
                _state.update { it.copy(connections = connections) }
            }.onError { error ->
                _state.update {
                    it.copy(
                        error = WearablesError(
                            message = error.message ?: "Failed to load connections",
                            messageAr = error.messageAr
                        )
                    )
                }
            }

            // Check device health platform status
            val platformStatus = healthDataManager.getPlatformStatus()
            _state.update { it.copy(devicePlatformStatus = platformStatus, isLoading = false) }
        }
    }

    fun connectDevicePlatform() {
        screenModelScope.launch {
            _state.update { it.copy(isConnecting = true, error = null) }

            // Check if health platform is available
            if (!healthDataManager.isAvailable()) {
                _state.update {
                    it.copy(
                        isConnecting = false,
                        error = WearablesError(
                            message = "Health data is not available on this device",
                            messageAr = "بيانات الصحة غير متوفرة على هذا الجهاز"
                        )
                    )
                }
                return@launch
            }

            // Request permissions
            val permissionResult = healthDataManager.requestPermissions()
            when (permissionResult) {
                HealthPermissionResult.GRANTED -> {
                    // Create connection in backend
                    val platformId = _state.value.devicePlatformId
                    if (platformId != null) {
                        createConnection(platformId)
                    } else {
                        _state.update {
                            it.copy(
                                isConnecting = false,
                                error = WearablesError(
                                    message = "Platform not found",
                                    messageAr = "المنصة غير موجودة"
                                )
                            )
                        }
                    }
                }
                HealthPermissionResult.DENIED -> {
                    _state.update {
                        it.copy(
                            isConnecting = false,
                            error = WearablesError(
                                message = "Permission denied. Please grant health data access.",
                                messageAr = "تم رفض الإذن. يرجى منح حق الوصول لبيانات الصحة."
                            )
                        )
                    }
                }
                HealthPermissionResult.NOT_AVAILABLE -> {
                    _state.update {
                        it.copy(
                            isConnecting = false,
                            error = WearablesError(
                                message = "Health data is not available on this device",
                                messageAr = "بيانات الصحة غير متوفرة على هذا الجهاز"
                            )
                        )
                    }
                }
                HealthPermissionResult.ERROR -> {
                    _state.update {
                        it.copy(
                            isConnecting = false,
                            error = WearablesError(
                                message = "Error requesting permissions",
                                messageAr = "خطأ في طلب الأذونات"
                            )
                        )
                    }
                }
            }
        }
    }

    private suspend fun createConnection(platformId: String) {
        wearableRepository.createConnection(platformId).onSuccess { connection ->
            _state.update {
                it.copy(
                    isConnecting = false,
                    connections = it.connections + connection,
                    successMessage = "Connected successfully",
                    devicePlatformStatus = it.devicePlatformStatus?.copy(hasPermissions = true)
                )
            }
            // Immediately sync data
            syncDeviceData(connection.id)
        }.onError { error ->
            _state.update {
                it.copy(
                    isConnecting = false,
                    error = WearablesError(
                        message = error.message ?: "Failed to connect",
                        messageAr = error.messageAr
                    )
                )
            }
        }
    }

    fun disconnectPlatform(connectionId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            wearableRepository.deleteConnection(connectionId).onSuccess {
                _state.update {
                    it.copy(
                        isLoading = false,
                        connections = it.connections.filter { c -> c.id != connectionId },
                        successMessage = "Disconnected successfully"
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = WearablesError(
                            message = error.message ?: "Failed to disconnect",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun syncDeviceData(connectionId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isSyncing = true, error = null) }

            try {
                // Read last 30 days of data from device
                val endDate = Clock.System.now()
                    .toLocalDateTime(TimeZone.currentSystemDefault())
                    .date
                val startDate = endDate.minus(30, DateTimeUnit.DAY)

                // Read activities from device health platform
                val activities = healthDataManager.readDailyActivities(
                    startDate.toString(),
                    endDate.toString()
                )

                // Read workouts from device health platform
                val workouts = healthDataManager.readWorkouts(
                    startDate.toString(),
                    endDate.toString()
                )

                // Sync to backend
                val request = BatchSyncRequest(
                    activities = activities.map { it.toCreateRequest(connectionId) },
                    workouts = workouts.map { it.toCreateRequest(connectionId) }
                )

                wearableRepository.batchSync(connectionId, request).onSuccess { response ->
                    val totalSynced = response.activitiesCreated + response.activitiesUpdated +
                            response.workoutsCreated + response.workoutsUpdated

                    _state.update {
                        it.copy(
                            isSyncing = false,
                            successMessage = "Synced $totalSynced records"
                        )
                    }

                    // Refresh connections to get updated lastSyncAt
                    loadData()
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isSyncing = false,
                            error = WearablesError(
                                message = error.message ?: "Failed to sync data",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        isSyncing = false,
                        error = WearablesError(
                            message = "Error reading health data: ${e.message}",
                            messageAr = "خطأ في قراءة بيانات الصحة"
                        )
                    )
                }
            }
        }
    }

    fun openHealthSettings() {
        healthDataManager.openHealthSettings()
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    fun clearSuccessMessage() {
        _state.update { it.copy(successMessage = null) }
    }

    // Helper to check if device platform is connected
    fun isDevicePlatformConnected(): Boolean {
        val devicePlatformName = healthDataManager.getPlatformName()
        return _state.value.connections.any { it.platformName == devicePlatformName }
    }

    // Get connection for device platform
    fun getDevicePlatformConnection(): WearableConnection? {
        val devicePlatformName = healthDataManager.getPlatformName()
        return _state.value.connections.find { it.platformName == devicePlatformName }
    }
}
