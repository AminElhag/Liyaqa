package com.liyaqa.liyaqa_internal_app.features.system.data.repository

import com.liyaqa.liyaqa_internal_app.core.data.BaseRepository
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.network.NetworkConfig
import com.liyaqa.liyaqa_internal_app.features.system.data.dto.*
import io.ktor.client.*

/**
 * Repository for system initialization and setup operations.
 * These endpoints are typically used during first-time setup.
 */
class SystemRepository(httpClient: HttpClient) : BaseRepository(httpClient) {

    /**
     * Check if the system has been initialized
     */
    suspend fun getInitializationStatus(): Result<InitializationStatusResponse> {
        return get(NetworkConfig.Endpoints.SYSTEM_INIT_STATUS)
    }

    /**
     * Initialize the system with administrator account.
     * This can only be called once when the system has no employees.
     */
    suspend fun initializeSystem(request: SystemInitializationRequest): Result<SystemInitializationResponse> {
        return post(NetworkConfig.Endpoints.SYSTEM_INITIALIZE, request)
    }

    /**
     * Ensure predefined employee groups exist.
     * Requires SYSTEM_CONFIGURE permission.
     */
    suspend fun ensurePredefinedGroups(): Result<MessageResponse> {
        return post(NetworkConfig.Endpoints.SYSTEM_ENSURE_GROUPS, Unit)
    }
}
