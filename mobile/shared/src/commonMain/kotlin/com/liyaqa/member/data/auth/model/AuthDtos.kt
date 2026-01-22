package com.liyaqa.member.data.auth.model

import com.liyaqa.member.core.localization.LocalizedText
import kotlinx.serialization.Serializable

/**
 * Request DTOs for authentication endpoints.
 * These match the backend AuthController request formats.
 */

/**
 * Login request DTO.
 * POST /api/auth/login
 */
@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val tenantId: String,
    val deviceInfo: String? = null
)

/**
 * Refresh token request DTO.
 * POST /api/auth/refresh
 */
@Serializable
data class RefreshTokenRequest(
    val refreshToken: String,
    val deviceInfo: String? = null
)

/**
 * Logout request DTO.
 * POST /api/auth/logout
 */
@Serializable
data class LogoutRequest(
    val refreshToken: String
)

/**
 * Response DTOs from authentication endpoints.
 */

/**
 * Authentication response containing tokens and user info.
 * Returned from login and refresh endpoints.
 */
@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserResponse
)

/**
 * User information returned in auth responses.
 */
@Serializable
data class UserResponse(
    val id: String,
    val email: String,
    val displayName: LocalizedText,
    val role: String,
    val status: String,
    val memberId: String? = null,
    val tenantId: String? = null,
    val organizationId: String? = null
)
