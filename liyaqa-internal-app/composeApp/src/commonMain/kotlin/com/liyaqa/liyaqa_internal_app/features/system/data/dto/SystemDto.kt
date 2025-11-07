package com.liyaqa.liyaqa_internal_app.features.system.data.dto

import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.EmployeeDto
import kotlinx.serialization.Serializable

@Serializable
data class InitializationStatusResponse(
    val isInitialized: Boolean,
    val employeeCount: Long,
    val groupCount: Long,
    val hasAdministrator: Boolean,
    val predefinedGroupsPresent: Boolean,
    val message: String
)

@Serializable
data class SystemInitializationRequest(
    val adminEmail: String,
    val adminPassword: String,
    val adminFirstName: String,
    val adminLastName: String
)

@Serializable
data class SystemInitializationResponse(
    val success: Boolean,
    val message: String,
    val administrator: EmployeeDto,
    val groupsCreated: List<String>,
    val warningMessage: String
)

@Serializable
data class MessageResponse(
    val message: String
)
