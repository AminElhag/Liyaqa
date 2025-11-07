package com.liyaqa.liyaqa_internal_app.features.facility.data.repository

import com.liyaqa.liyaqa_internal_app.core.data.BaseRepository
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.*
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.*
import io.ktor.client.*

class FacilityRepository(httpClient: HttpClient) : BaseRepository(httpClient) {
    private val basePath = "/internal/facilities"

    suspend fun getFacilities(
        page: Int = 0,
        size: Int = 20,
        searchTerm: String? = null,
        tenantId: String? = null,
        status: String? = null
    ): Result<FacilityPageResponse> {
        val params = mutableMapOf<String, Any?>("page" to page, "size" to size)
        searchTerm?.let { params["searchTerm"] = it }
        tenantId?.let { params["tenantId"] = it }
        status?.let { params["status"] = it }
        return get(basePath, params)
    }

    suspend fun getFacilityById(id: String): Result<Facility> {
        return when (val result = get<FacilityDto>("$basePath/$id")) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun createFacility(request: CreateFacilityRequest): Result<Facility> {
        return when (val result = post<FacilityDto, CreateFacilityRequest>(basePath, request)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun updateFacility(id: String, request: UpdateFacilityRequest): Result<Facility> {
        return when (val result = put<FacilityDto, UpdateFacilityRequest>("$basePath/$id", request)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    suspend fun deleteFacility(id: String): Result<Unit> {
        return delete("$basePath/$id")
    }

    suspend fun getBranches(facilityId: String): Result<List<FacilityBranch>> {
        return when (val result = get<List<FacilityBranchDto>>("$basePath/$facilityId/branches")) {
            is Result.Success -> Result.Success(result.data.map { it.toDomain() })
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }
}
