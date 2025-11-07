package com.liyaqa.liyaqa_internal_app.features.auth.data.dto

import com.liyaqa.liyaqa_internal_app.features.auth.domain.model.User
import kotlinx.serialization.Serializable

/**
 * Login request DTO matching backend's structure
 */
@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

/**
 * Login response DTO matching backend's structure
 */
@Serializable
data class LoginResponse(
    val token: String,
    val refreshToken: String? = null,
    val user: UserDto
)

/**
 * User DTO matching backend's structure
 */
@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val permissions: List<String> = emptyList(),
    val tenantId: String? = null
)

/**
 * Extension to map DTO to domain model
 */
fun UserDto.toDomain(): User {
    return User(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role,
        permissions = permissions,
        tenantId = tenantId
    )
}

/**
 * Extension to map LoginResponse to domain model
 */
fun LoginResponse.toDomain() = user.toDomain()
