package com.liyaqa.liyaqa_internal_app.features.auth.data.repository

import com.liyaqa.liyaqa_internal_app.core.data.BaseRepository
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.network.NetworkConfig
import com.liyaqa.liyaqa_internal_app.features.auth.data.dto.LoginRequest
import com.liyaqa.liyaqa_internal_app.features.auth.data.dto.LoginResponse
import com.liyaqa.liyaqa_internal_app.features.auth.data.dto.UserDto
import com.liyaqa.liyaqa_internal_app.features.auth.data.dto.toDomain
import com.liyaqa.liyaqa_internal_app.features.auth.domain.model.User
import io.ktor.client.*

/**
 * Repository for authentication operations.
 * Follows backend's repository pattern with feature-based organization.
 */
class AuthRepository(
    httpClient: HttpClient
) : BaseRepository(httpClient) {

    /**
     * Authenticate user with email and password
     */
    suspend fun login(email: String, password: String): Result<Pair<User, String>> {
        val request = LoginRequest(email, password)
        return when (val result = post<LoginResponse, LoginRequest>(
            path = NetworkConfig.Endpoints.AUTH_LOGIN,
            body = request
        )) {
            is Result.Success -> {
                Result.Success(
                    Pair(result.data.user.toDomain(), result.data.token)
                )
            }
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Logout current user
     */
    suspend fun logout(): Result<Unit> {
        return post<Unit, Unit>(
            path = NetworkConfig.Endpoints.AUTH_LOGOUT,
            body = Unit
        )
    }

    /**
     * Get current authenticated user
     */
    suspend fun getCurrentUser(): Result<User> {
        return when (val result = get<UserDto>(NetworkConfig.Endpoints.AUTH_ME)) {
            is Result.Success -> Result.Success(result.data.toDomain())
            is Result.Error -> Result.Error(result.exception, result.message)
            is Result.Loading -> Result.Loading
        }
    }

    /**
     * Refresh authentication token
     */
    suspend fun refreshToken(refreshToken: String): Result<LoginResponse> {
        return post<LoginResponse, Map<String, String>>(
            path = NetworkConfig.Endpoints.AUTH_REFRESH,
            body = mapOf("refreshToken" to refreshToken)
        )
    }

    /**
     * Validate current token
     */
    suspend fun validateToken(): Result<Unit> {
        return get(NetworkConfig.Endpoints.AUTH_VALIDATE)
    }

    /**
     * Request password reset via email
     */
    suspend fun requestPasswordReset(email: String): Result<Unit> {
        return post<Unit, Map<String, String>>(
            path = NetworkConfig.Endpoints.AUTH_PASSWORD_RESET_REQUEST,
            body = mapOf("email" to email)
        )
    }

    /**
     * Complete password reset with token
     */
    suspend fun completePasswordReset(token: String, newPassword: String): Result<Unit> {
        return post<Unit, Map<String, String>>(
            path = NetworkConfig.Endpoints.AUTH_PASSWORD_RESET_COMPLETE,
            body = mapOf("token" to token, "newPassword" to newPassword)
        )
    }
}
