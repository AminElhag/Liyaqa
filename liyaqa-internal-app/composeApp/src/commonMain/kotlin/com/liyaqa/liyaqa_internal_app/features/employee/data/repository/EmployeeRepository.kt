package com.liyaqa.liyaqa_internal_app.features.employee.data.repository

import com.liyaqa.liyaqa_internal_app.core.data.BaseRepository
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.*
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeGroup
import io.ktor.client.*

/**
 * Repository for employee management operations.
 * Follows backend's internal/employee API structure.
 */
class EmployeeRepository(
    httpClient: HttpClient
) : BaseRepository(httpClient) {

    private val basePath = "/internal/employees"

    /**
     * Get paginated list of employees
     */
    suspend fun getEmployees(
        page: Int = 0,
        size: Int = 20,
        searchTerm: String? = null,
        status: String? = null,
        department: String? = null
    ): Result<EmployeePageResponse> {
        val parameters = mutableMapOf<String, Any?>(
            "page" to page,
            "size" to size
        )
        searchTerm?.let { parameters["searchTerm"] = it }
        status?.let { parameters["status"] = it }
        department?.let { parameters["department"] = it }

        return get(basePath, parameters)
    }

    /**
     * Get employee by ID
     */
    suspend fun getEmployeeById(id: String): Result<Employee> {
        return when (val result = get<EmployeeDto>("$basePath/$id")) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Create new employee
     */
    suspend fun createEmployee(request: CreateEmployeeRequest): Result<Employee> {
        return when (val result = post<EmployeeDto, CreateEmployeeRequest>(
            basePath, request
        )) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Update employee
     */
    suspend fun updateEmployee(
        id: String,
        request: UpdateEmployeeRequest
    ): Result<Employee> {
        return when (val result = put<EmployeeDto, UpdateEmployeeRequest>(
            "$basePath/$id", request
        )) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Delete employee
     */
    suspend fun deleteEmployee(id: String): Result<Unit> {
        return delete("$basePath/$id")
    }

    /**
     * Assign groups to employee
     */
    suspend fun assignGroups(
        id: String,
        groupIds: List<String>
    ): Result<Employee> {
        return when (val result = post<EmployeeDto, AssignGroupsRequest>(
            "$basePath/$id/groups",
            AssignGroupsRequest(groupIds)
        )) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Get available employee groups
     */
    suspend fun getEmployeeGroups(): Result<List<EmployeeGroup>> {
        return when (val result = get<List<EmployeeGroupDto>>("$basePath/groups")) {
            is Result.Success -> Result.Success(result.data.map { it.toDomain() })
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Unlock employee account
     */
    suspend fun unlockEmployee(id: String): Result<Employee> {
        return when (val result = post<EmployeeDto, Unit>(
            "$basePath/$id/unlock", Unit
        )) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Reset employee password
     */
    suspend fun resetPassword(id: String): Result<Unit> {
        return post("$basePath/$id/reset-password", Unit)
    }

    /**
     * Get current employee profile
     */
    suspend fun getCurrentEmployee(): Result<Employee> {
        return when (val result = get<EmployeeDto>("$basePath/me")) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Update current employee profile
     */
    suspend fun updateCurrentEmployee(request: UpdateEmployeeRequest): Result<Employee> {
        return when (val result = patch<EmployeeDto, UpdateEmployeeRequest>(
            "$basePath/me", request
        )) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Change current employee password
     */
    suspend fun changePassword(currentPassword: String, newPassword: String): Result<Unit> {
        return post<Unit, Map<String, String>>(
            "$basePath/me/change-password",
            mapOf("currentPassword" to currentPassword, "newPassword" to newPassword)
        )
    }
}
