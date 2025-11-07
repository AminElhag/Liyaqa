package com.liyaqa.dashboard.features.employee.data.repository

import com.liyaqa.dashboard.core.data.BaseRepository
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.domain.map
import com.liyaqa.dashboard.core.network.NetworkConfig
import com.liyaqa.dashboard.features.employee.data.dto.CreateFacilityEmployeeRequest
import com.liyaqa.dashboard.features.employee.data.dto.FacilityEmployeeDto
import com.liyaqa.dashboard.features.employee.data.dto.FacilityEmployeePageResponse
import com.liyaqa.dashboard.features.employee.data.dto.UpdateFacilityEmployeeRequest
import com.liyaqa.dashboard.features.employee.data.dto.toDomain
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployee
import io.ktor.client.HttpClient

/**
 * Repository for facility employee operations
 */
class FacilityEmployeeRepository(
    httpClient: HttpClient
) : BaseRepository(httpClient) {

    suspend fun getEmployees(
        page: Int = 0,
        size: Int = 20,
        search: String? = null,
        status: String? = null,
        branchId: String? = null
    ): Result<FacilityEmployeePageResponse> {
        val params = buildMap {
            put("page", page.toString())
            put("size", size.toString())
            search?.let { put("search", it) }
            status?.let { put("status", it) }
            branchId?.let { put("branchId", it) }
        }
        return get(NetworkConfig.Endpoints.FACILITY_EMPLOYEES, params)
    }

    suspend fun getEmployeeById(id: String): Result<FacilityEmployee> {
        return get<FacilityEmployeeDto>("${NetworkConfig.Endpoints.FACILITY_EMPLOYEES}/$id")
            .map { it.toDomain() }
    }

    suspend fun createEmployee(request: CreateFacilityEmployeeRequest): Result<FacilityEmployee> {
        return post<FacilityEmployeeDto, CreateFacilityEmployeeRequest>(
            NetworkConfig.Endpoints.FACILITY_EMPLOYEES,
            request
        ).map { it.toDomain() }
    }

    suspend fun updateEmployee(id: String, request: UpdateFacilityEmployeeRequest): Result<FacilityEmployee> {
        return put<FacilityEmployeeDto, UpdateFacilityEmployeeRequest>(
            "${NetworkConfig.Endpoints.FACILITY_EMPLOYEES}/$id",
            request
        ).map { it.toDomain() }
    }

    suspend fun deleteEmployee(id: String): Result<Unit> {
        return delete("${NetworkConfig.Endpoints.FACILITY_EMPLOYEES}/$id")
    }

    suspend fun assignGroups(id: String, groupIds: List<String>): Result<FacilityEmployee> {
        return post<FacilityEmployeeDto, Map<String, List<String>>>(
            "${NetworkConfig.Endpoints.FACILITY_EMPLOYEES}/$id/groups",
            mapOf("groupIds" to groupIds)
        ).map { it.toDomain() }
    }
}
