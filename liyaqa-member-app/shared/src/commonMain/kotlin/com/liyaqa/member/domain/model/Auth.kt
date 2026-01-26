package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Login request
 */
@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val tenantId: String? = null,
    val deviceInfo: DeviceInfo? = null
)

/**
 * Device information for login
 */
@Serializable
data class DeviceInfo(
    val platform: DevicePlatform,
    val deviceId: String,
    val deviceName: String? = null,
    val appVersion: String? = null
)

/**
 * Refresh token request
 */
@Serializable
data class RefreshTokenRequest(
    val refreshToken: String,
    val deviceInfo: DeviceInfo? = null
)

/**
 * Authentication response
 */
@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: User
)

/**
 * Authenticated user information
 */
@Serializable
data class User(
    val id: String,
    val email: String,
    val displayName: LocalizedText,
    val role: String,
    val status: String,
    val memberId: String?,
    val tenantId: String,
    val organizationId: String?,
    val permissions: List<String>,
    val createdAt: String,
    val updatedAt: String
)

/**
 * Tenant information response
 */
@Serializable
data class TenantInfo(
    val resolved: Boolean,
    val tenantId: String? = null,
    val clubName: LocalizedText? = null,
    val slug: String? = null,
    val logoUrl: String? = null,
    // Branding fields for white-label support
    val primaryColor: String? = null,
    val secondaryColor: String? = null,
    val accentColor: String? = null
)

/**
 * Change password request
 */
@Serializable
data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

/**
 * Update profile request
 */
@Serializable
data class UpdateProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val street: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null
)

/**
 * Device token registration request
 */
@Serializable
data class DeviceTokenRequest(
    val token: String,
    val platform: DevicePlatform
)

/**
 * Authentication state
 */
sealed class AuthState {
    data object Loading : AuthState()
    data object Unauthenticated : AuthState()
    data class Authenticated(val user: User) : AuthState()
    data class Error(val message: String, val messageAr: String? = null) : AuthState()
}
