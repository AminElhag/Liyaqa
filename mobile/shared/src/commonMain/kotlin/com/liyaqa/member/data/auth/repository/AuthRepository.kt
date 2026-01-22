package com.liyaqa.member.data.auth.repository

import com.liyaqa.member.data.auth.model.User

/**
 * Repository interface for authentication operations.
 */
interface AuthRepository {
    /**
     * Performs login with email, password, and tenant ID.
     * Returns AuthResult indicating success or failure.
     */
    suspend fun login(
        email: String,
        password: String,
        tenantId: String,
        deviceInfo: String? = null
    ): AuthResult

    /**
     * Refreshes the access token using the stored refresh token.
     * Returns AuthResult indicating success or failure.
     */
    suspend fun refreshToken(): AuthResult

    /**
     * Logs out the current user and clears all stored tokens.
     */
    suspend fun logout()

    /**
     * Checks if the user is currently authenticated (has valid access token).
     */
    suspend fun isAuthenticated(): Boolean

    /**
     * Gets the currently stored user, or null if not authenticated.
     */
    suspend fun getCurrentUser(): User?

    /**
     * Gets the current access token, or null if not authenticated.
     */
    suspend fun getAccessToken(): String?

    /**
     * Gets the current tenant ID, or null if not set.
     */
    suspend fun getTenantId(): String?
}

/**
 * Sealed class representing the result of authentication operations.
 */
sealed class AuthResult {
    /**
     * Successful authentication with user data.
     */
    data class Success(val user: User) : AuthResult()

    /**
     * Authentication error with message and optional HTTP code.
     */
    data class Error(val message: String, val code: Int? = null) : AuthResult()

    /**
     * Network error when unable to reach the server.
     */
    data object NetworkError : AuthResult()

    /**
     * Returns true if this is a successful result.
     */
    val isSuccess: Boolean
        get() = this is Success

    /**
     * Returns the user if successful, null otherwise.
     */
    fun getOrNull(): User? = when (this) {
        is Success -> user
        else -> null
    }

    /**
     * Returns the error message if this is an error.
     */
    fun errorMessage(): String? = when (this) {
        is Error -> message
        is NetworkError -> "Network error. Please check your connection."
        is Success -> null
    }
}
