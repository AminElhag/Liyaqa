package com.liyaqa.liyaqa_internal_app.features.tenant.data.repository

import com.liyaqa.liyaqa_internal_app.core.data.BaseRepository
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.*
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import io.ktor.client.*

class TenantRepository(httpClient: HttpClient) : BaseRepository(httpClient) {
    private val basePath = "/internal/tenants"

    suspend fun getTenants(
        page: Int = 0,
        size: Int = 20,
        searchTerm: String? = null,
        status: String? = null
    ): Result<TenantPageResponse> {
        val params = mutableMapOf<String, Any?>("page" to page, "size" to size)
        searchTerm?.let { params["searchTerm"] = it }
        status?.let { params["status"] = it }
        return get(basePath, params)
    }

    suspend fun getTenantById(id: String): Result<Tenant> {
        return when (val result = get<TenantDto>("$basePath/$id")) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun createTenant(request: CreateTenantRequest): Result<Tenant> {
        return when (val result = post<TenantDto, CreateTenantRequest>(basePath, request)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun updateTenant(id: String, request: UpdateTenantRequest): Result<Tenant> {
        return when (val result = put<TenantDto, UpdateTenantRequest>("$basePath/$id", request)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun deleteTenant(id: String): Result<Unit> {
        return delete("$basePath/$id")
    }

    suspend fun suspendTenant(id: String): Result<Tenant> {
        return when (val result = post<TenantDto, Unit>("$basePath/$id/suspend", Unit)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun reactivateTenant(id: String): Result<Tenant> {
        return when (val result = post<TenantDto, Unit>("$basePath/$id/reactivate", Unit)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun acceptTerms(id: String): Result<Tenant> {
        return when (val result = post<TenantDto, Unit>("$basePath/$id/accept-terms", Unit)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun changePlan(id: String, newTier: String): Result<Tenant> {
        return when (val result = post<TenantDto, Map<String, String>>(
            "$basePath/$id/change-plan",
            mapOf("subscriptionTier" to newTier)
        )) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun getTenantsNeedingAttention(): Result<List<Tenant>> {
        return when (val result = get<List<TenantDto>>("$basePath/attention-needed")) {
            is Result.Success -> Result.Success(result.data.map { it.toDomain() })
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun getTenantAnalytics(): Result<TenantAnalyticsDto> {
        return get("$basePath/analytics")
    }
}
