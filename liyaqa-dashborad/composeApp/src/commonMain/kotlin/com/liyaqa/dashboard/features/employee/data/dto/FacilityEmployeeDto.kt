package com.liyaqa.dashboard.features.employee.data.dto

import com.liyaqa.dashboard.features.employee.domain.model.EmployeeStatus
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployee
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployeeGroup
import com.liyaqa.dashboard.features.employee.domain.model.FacilityPermission
import kotlinx.serialization.Serializable

@Serializable
data class FacilityEmployeeDto(
    val id: String,
    val facilityId: String,
    val branchId: String? = null,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val employeeNumber: String,
    val position: String? = null,
    val status: String,
    val permissions: List<String> = emptyList(),
    val groups: List<FacilityEmployeeGroupDto> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class FacilityEmployeeGroupDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val permissions: List<String> = emptyList()
)

@Serializable
data class CreateFacilityEmployeeRequest(
    val email: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val employeeNumber: String,
    val position: String? = null,
    val branchId: String? = null,
    val permissions: List<String> = emptyList()
)

@Serializable
data class UpdateFacilityEmployeeRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val phoneNumber: String? = null,
    val position: String? = null,
    val status: String? = null,
    val permissions: List<String>? = null
)

@Serializable
data class FacilityEmployeePageResponse(
    val content: List<FacilityEmployeeDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

fun FacilityEmployeeDto.toDomain() = FacilityEmployee(
    id = id,
    facilityId = facilityId,
    branchId = branchId,
    email = email,
    firstName = firstName,
    lastName = lastName,
    phoneNumber = phoneNumber,
    employeeNumber = employeeNumber,
    position = position,
    status = EmployeeStatus.valueOf(status),
    permissions = permissions.mapNotNull {
        try { FacilityPermission.valueOf(it) } catch (e: Exception) { null }
    },
    groups = groups.map { it.toDomain() },
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun FacilityEmployeeGroupDto.toDomain() = FacilityEmployeeGroup(
    id = id,
    name = name,
    description = description,
    permissions = permissions.mapNotNull {
        try { FacilityPermission.valueOf(it) } catch (e: Exception) { null }
    }
)

fun FacilityEmployee.toUpdateRequest() = UpdateFacilityEmployeeRequest(
    firstName = firstName,
    lastName = lastName,
    phoneNumber = phoneNumber,
    position = position,
    status = status.name,
    permissions = permissions.map { it.name }
)
