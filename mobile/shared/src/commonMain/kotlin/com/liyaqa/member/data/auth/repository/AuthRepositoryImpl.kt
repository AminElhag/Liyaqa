package com.liyaqa.member.data.auth.repository

import com.liyaqa.member.data.api.ApiClient
import com.liyaqa.member.data.api.ApiResult
import com.liyaqa.member.data.auth.model.AuthResponse
import com.liyaqa.member.data.auth.model.LoginRequest
import com.liyaqa.member.data.auth.model.LogoutRequest
import com.liyaqa.member.data.auth.model.RefreshTokenRequest
import com.liyaqa.member.data.auth.model.User
import com.liyaqa.member.data.auth.storage.TokenStorage
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Implementation of AuthRepository using Ktor HTTP client
 * and secure token storage.
 */
class AuthRepositoryImpl(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val json: Json
) : AuthRepository {

    override suspend fun login(
        email: String,
        password: String,
        tenantId: String,
        deviceInfo: String?
    ): AuthResult {
        val request = LoginRequest(
            email = email,
            password = password,
            tenantId = tenantId,
            deviceInfo = deviceInfo
        )

        val client = apiClient.createHttpClient()
        return try {
            val result: ApiResult<AuthResponse> = apiClient.post(
                client = client,
                urlString = "/api/auth/login",
                body = request
            )

            when (result) {
                is ApiResult.Success -> {
                    val response = result.data
                    saveAuthData(response, tenantId)
                    val user = User.fromResponse(response.user)
                    AuthResult.Success(user)
                }
                is ApiResult.Error -> {
                    AuthResult.Error(result.message, result.code)
                }
                is ApiResult.NetworkError -> {
                    AuthResult.NetworkError
                }
            }
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Unknown error occurred")
        } finally {
            client.close()
        }
    }

    override suspend fun refreshToken(): AuthResult {
        val refreshToken = tokenStorage.getRefreshToken()
            ?: return AuthResult.Error("No refresh token available")

        val tenantId = tokenStorage.getTenantId()
            ?: return AuthResult.Error("No tenant ID available")

        val request = RefreshTokenRequest(refreshToken = refreshToken)

        val client = apiClient.createHttpClient()
        return try {
            val result: ApiResult<AuthResponse> = apiClient.post(
                client = client,
                urlString = "/api/auth/refresh",
                body = request
            )

            when (result) {
                is ApiResult.Success -> {
                    val response = result.data
                    saveAuthData(response, tenantId)
                    val user = User.fromResponse(response.user)
                    AuthResult.Success(user)
                }
                is ApiResult.Error -> {
                    // If refresh fails, clear stored tokens
                    if (result.code == 401) {
                        tokenStorage.clearAll()
                    }
                    AuthResult.Error(result.message, result.code)
                }
                is ApiResult.NetworkError -> {
                    AuthResult.NetworkError
                }
            }
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Unknown error occurred")
        } finally {
            client.close()
        }
    }

    override suspend fun logout() {
        val refreshToken = tokenStorage.getRefreshToken()
        val accessToken = tokenStorage.getAccessToken()
        val tenantId = tokenStorage.getTenantId()

        // Try to call logout endpoint if we have tokens
        if (refreshToken != null && accessToken != null && tenantId != null) {
            val client = apiClient.createAuthenticatedClient(accessToken, tenantId, "en")
            try {
                val request = LogoutRequest(refreshToken = refreshToken)
                apiClient.post<Unit>(
                    client = client,
                    urlString = "/api/auth/logout",
                    body = request
                )
            } catch (e: Exception) {
                // Ignore errors during logout - we'll clear tokens anyway
            } finally {
                client.close()
            }
        }

        // Always clear local storage
        tokenStorage.clearAll()
    }

    override suspend fun isAuthenticated(): Boolean {
        return tokenStorage.isLoggedIn()
    }

    override suspend fun getCurrentUser(): User? {
        val userJson = tokenStorage.getUserJson() ?: return null
        return try {
            json.decodeFromString<User>(userJson)
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun getAccessToken(): String? {
        return tokenStorage.getAccessToken()
    }

    override suspend fun getTenantId(): String? {
        return tokenStorage.getTenantId()
    }

    /**
     * Saves authentication data to secure storage.
     */
    private suspend fun saveAuthData(response: AuthResponse, tenantId: String) {
        tokenStorage.saveAccessToken(response.accessToken)
        tokenStorage.saveRefreshToken(response.refreshToken)
        tokenStorage.saveTenantId(tenantId)
        tokenStorage.saveUserId(response.user.id)
        tokenStorage.saveUserRole(response.user.role)

        // Save full user object as JSON
        val user = User.fromResponse(response.user)
        val userJson = json.encodeToString(user)
        tokenStorage.saveUserJson(userJson)
    }
}
