package com.liyaqa.member.data.repository

import com.liyaqa.member.data.local.TokenStorage
import com.liyaqa.member.data.remote.api.AuthApi
import com.liyaqa.member.data.remote.api.RefreshResult
import com.liyaqa.member.data.remote.api.TokenProvider
import com.liyaqa.member.domain.model.AuthResponse
import com.liyaqa.member.domain.model.AuthState
import com.liyaqa.member.domain.model.ChangePasswordRequest
import com.liyaqa.member.domain.model.DeviceInfo
import com.liyaqa.member.domain.model.LoginRequest
import com.liyaqa.member.domain.model.RefreshTokenRequest
import com.liyaqa.member.domain.model.TenantInfo
import com.liyaqa.member.domain.model.User
import com.liyaqa.member.domain.repository.AuthRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class AuthRepositoryImpl(
    private val authApi: AuthApi,
    private val tokenStorage: TokenStorage
) : AuthRepository, TokenProvider {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    override val authState: Flow<AuthState> = _authState.asStateFlow()

    private var _currentUser: User? = null
    override val currentUser: User? get() = _currentUser

    override val isAuthenticated: Boolean
        get() = _authState.value is AuthState.Authenticated

    override suspend fun getTenantInfo(subdomain: String?, tenantId: String?): Result<TenantInfo> {
        return authApi.getTenantInfo(subdomain, tenantId)
    }

    override suspend fun login(
        email: String,
        password: String,
        tenantId: String?,
        deviceInfo: DeviceInfo?
    ): Result<AuthResponse> {
        val result = authApi.login(LoginRequest(email, password, tenantId, deviceInfo))

        result.onSuccess { response ->
            tokenStorage.saveTokens(response.accessToken, response.refreshToken)
            tokenStorage.saveUserId(response.user.id)
            response.user.tenantId.let { tokenStorage.saveTenantId(it) }
            _currentUser = response.user
            _authState.value = AuthState.Authenticated(response.user)
        }.onError { error ->
            _authState.value = AuthState.Error(error.message ?: "Login failed", error.messageAr)
        }

        return result
    }

    override suspend fun refreshToken(): Result<AuthResponse> {
        val refreshToken = tokenStorage.getRefreshToken()
            ?: return Result.error(message = "No refresh token available")

        val result = authApi.refreshToken(RefreshTokenRequest(refreshToken))

        result.onSuccess { response ->
            tokenStorage.saveTokens(response.accessToken, response.refreshToken)
            _currentUser = response.user
            _authState.value = AuthState.Authenticated(response.user)
        }.onError {
            // Refresh failed, clear tokens and set unauthenticated
            tokenStorage.clearTokens()
            _currentUser = null
            _authState.value = AuthState.Unauthenticated
        }

        return result
    }

    override suspend fun logout(): Result<Unit> {
        val result = authApi.logout()

        // Always clear local state, even if API call fails
        tokenStorage.clearTokens()
        _currentUser = null
        _authState.value = AuthState.Unauthenticated

        return result
    }

    override suspend fun logoutAll(): Result<Unit> {
        val result = authApi.logoutAll()

        tokenStorage.clearTokens()
        _currentUser = null
        _authState.value = AuthState.Unauthenticated

        return result
    }

    override suspend fun getCurrentUser(): Result<User> {
        return authApi.getCurrentUser().onSuccess { user ->
            _currentUser = user
            _authState.value = AuthState.Authenticated(user)
        }
    }

    override suspend fun changePassword(request: ChangePasswordRequest): Result<Unit> {
        return authApi.changePassword(request)
    }

    override suspend fun isBiometricAvailable(): Boolean {
        // Platform-specific implementation would be needed
        return false
    }

    override suspend fun enableBiometric(): Result<Unit> {
        // Platform-specific implementation would be needed
        return Result.error(message = "Not implemented")
    }

    override suspend fun authenticateWithBiometric(): Result<AuthResponse> {
        // Platform-specific implementation would be needed
        return Result.error(message = "Not implemented")
    }

    // TokenProvider implementation
    override suspend fun getAccessToken(): String? = tokenStorage.getAccessToken()

    override suspend fun getRefreshToken(): String? = tokenStorage.getRefreshToken()

    override suspend fun refreshTokens(): RefreshResult? {
        val refreshToken = tokenStorage.getRefreshToken() ?: return null

        return authApi.refreshToken(RefreshTokenRequest(refreshToken)).getOrNull()?.let {
            tokenStorage.saveTokens(it.accessToken, it.refreshToken)
            RefreshResult(it.accessToken, it.refreshToken)
        }
    }

    override suspend fun clearTokens() {
        tokenStorage.clearTokens()
        _currentUser = null
        _authState.value = AuthState.Unauthenticated
    }

    /**
     * Initialize auth state by checking for existing tokens
     */
    suspend fun initializeAuthState() {
        val accessToken = tokenStorage.getAccessToken()
        if (accessToken != null) {
            // Try to get current user with existing token
            getCurrentUser().onSuccess {
                // Auth state already updated in getCurrentUser
            }.onError {
                // Token might be expired, try refresh
                refreshToken().onError {
                    _authState.value = AuthState.Unauthenticated
                }
            }
        } else {
            _authState.value = AuthState.Unauthenticated
        }
    }
}
