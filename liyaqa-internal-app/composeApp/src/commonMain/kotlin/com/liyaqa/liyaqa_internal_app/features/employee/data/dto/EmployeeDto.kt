package com.liyaqa.liyaqa_internal_app.features.employee.data.dto

import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeGroup
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeStatus
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Permission
import kotlinx.serialization.Serializable

/**
 * Employee DTO for API responses
 */
@Serializable
data class EmployeeDto(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val employeeNumber: String,
    val phoneNumber: String? = null,
    val status: String,
    val isSystemAccount: Boolean = false,
    val locale: String = "en_US",
    val timezone: String = "UTC",
    val department: String? = null,
    val jobTitle: String? = null,
    val hireDate: String? = null,
    val groups: List<EmployeeGroupDto> = emptyList(),
    val permissions: List<String> = emptyList(),
    val lastLoginAt: String? = null,
    val failedLoginAttempts: Int = 0,
    val lockedUntil: String? = null,
    val createdAt: String,
    val updatedAt: String
)

/**
 * Employee group DTO
 */
@Serializable
data class EmployeeGroupDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val permissions: List<String> = emptyList()
)

/**
 * Create employee request DTO
 */
@Serializable
data class CreateEmployeeRequest(
    val email: String,
    val firstName: String,
    val lastName: String,
    val password: String,
    val phoneNumber: String? = null,
    val department: String? = null,
    val jobTitle: String? = null,
    val hireDate: String? = null,
    val locale: String = "en_US",
    val timezone: String = "UTC",
    val groupIds: List<String> = emptyList()
)

/**
 * Update employee request DTO
 */
@Serializable
data class UpdateEmployeeRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val phoneNumber: String? = null,
    val department: String? = null,
    val jobTitle: String? = null,
    val locale: String? = null,
    val timezone: String? = null,
    val status: String? = null
)

/**
 * Assign groups request DTO
 */
@Serializable
data class AssignGroupsRequest(
    val groupIds: List<String>
)

/**
 * Employee list response with pagination
 */
@Serializable
data class EmployeePageResponse(
    val content: List<EmployeeDto>,
    val totalElements: Long,
    val totalPages: Int,
    val size: Int,
    val number: Int,
    val first: Boolean,
    val last: Boolean
)

// Extension functions for DTO to Domain mapping

fun EmployeeDto.toDomain(): Employee {
    return Employee(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        employeeNumber = employeeNumber,
        phoneNumber = phoneNumber,
        status = EmployeeStatus.valueOf(status),
        isSystemAccount = isSystemAccount,
        locale = locale,
        timezone = timezone,
        department = department,
        jobTitle = jobTitle,
        hireDate = hireDate,
        groups = groups.map { it.toDomain() },
        permissions = permissions.mapNotNull {
            try { Permission.valueOf(it) } catch (e: Exception) { null }
        },
        lastLoginAt = lastLoginAt,
        failedLoginAttempts = failedLoginAttempts,
        lockedUntil = lockedUntil,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun EmployeeGroupDto.toDomain(): EmployeeGroup {
    return EmployeeGroup(
        id = id,
        name = name,
        description = description,
        permissions = permissions.mapNotNull {
            try { Permission.valueOf(it) } catch (e: Exception) { null }
        }
    )
}
