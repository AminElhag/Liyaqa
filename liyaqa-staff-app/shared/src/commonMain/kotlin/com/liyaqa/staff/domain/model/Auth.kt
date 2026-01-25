package com.liyaqa.staff.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val tenantId: String? = null
)

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val staffProfile: StaffProfile
)

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String
)

@Serializable
data class RefreshTokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long
)
