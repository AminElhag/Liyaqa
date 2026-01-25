package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.AuthResponse
import com.liyaqa.member.domain.model.AuthState
import com.liyaqa.member.domain.model.ChangePasswordRequest
import com.liyaqa.member.domain.model.DeviceInfo
import com.liyaqa.member.domain.model.TenantInfo
import com.liyaqa.member.domain.model.User
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for authentication operations
 */
interface AuthRepository {
    /**
     * Observable auth state
     */
    val authState: Flow<AuthState>

    /**
     * Get current user if authenticated
     */
    val currentUser: User?

    /**
     * Check if user is currently authenticated
     */
    val isAuthenticated: Boolean

    /**
     * Get tenant info by subdomain or tenant ID
     */
    suspend fun getTenantInfo(subdomain: String? = null, tenantId: String? = null): Result<TenantInfo>

    /**
     * Login with email and password
     */
    suspend fun login(
        email: String,
        password: String,
        tenantId: String? = null,
        deviceInfo: DeviceInfo? = null
    ): Result<AuthResponse>

    /**
     * Refresh the access token
     */
    suspend fun refreshToken(): Result<AuthResponse>

    /**
     * Logout the current user
     */
    suspend fun logout(): Result<Unit>

    /**
     * Logout from all devices
     */
    suspend fun logoutAll(): Result<Unit>

    /**
     * Get current user profile
     */
    suspend fun getCurrentUser(): Result<User>

    /**
     * Change password
     */
    suspend fun changePassword(request: ChangePasswordRequest): Result<Unit>

    /**
     * Check if biometric authentication is available
     */
    suspend fun isBiometricAvailable(): Boolean

    /**
     * Enable biometric authentication
     */
    suspend fun enableBiometric(): Result<Unit>

    /**
     * Authenticate with biometrics
     */
    suspend fun authenticateWithBiometric(): Result<AuthResponse>
}
