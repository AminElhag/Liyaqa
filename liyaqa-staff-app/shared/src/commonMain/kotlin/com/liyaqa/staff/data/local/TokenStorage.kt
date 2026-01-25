package com.liyaqa.staff.data.local

import com.liyaqa.staff.domain.model.StaffProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map

/**
 * Token storage interface - platform-specific implementations handle secure storage
 */
interface TokenStorage {
    suspend fun saveTokens(accessToken: String, refreshToken: String, expiresIn: Long)
    suspend fun getAccessToken(): String?
    suspend fun getRefreshToken(): String?
    suspend fun clearTokens()
    suspend fun saveStaffProfile(profile: StaffProfile)
    suspend fun getStaffProfile(): StaffProfile?
    fun isLoggedIn(): Flow<Boolean>
    fun observeStaffProfile(): Flow<StaffProfile?>
}

/**
 * In-memory token storage for common module (will be replaced by platform-specific implementations)
 */
class InMemoryTokenStorage : TokenStorage {
    private var accessToken: String? = null
    private var refreshToken: String? = null
    private var expiresAt: Long = 0
    private val _staffProfile = MutableStateFlow<StaffProfile?>(null)
    private val _isLoggedIn = MutableStateFlow(false)

    override suspend fun saveTokens(accessToken: String, refreshToken: String, expiresIn: Long) {
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        this.expiresAt = System.currentTimeMillis() + (expiresIn * 1000)
        _isLoggedIn.value = true
    }

    override suspend fun getAccessToken(): String? = accessToken

    override suspend fun getRefreshToken(): String? = refreshToken

    override suspend fun clearTokens() {
        accessToken = null
        refreshToken = null
        expiresAt = 0
        _staffProfile.value = null
        _isLoggedIn.value = false
    }

    override suspend fun saveStaffProfile(profile: StaffProfile) {
        _staffProfile.value = profile
    }

    override suspend fun getStaffProfile(): StaffProfile? = _staffProfile.value

    override fun isLoggedIn(): Flow<Boolean> = _isLoggedIn

    override fun observeStaffProfile(): Flow<StaffProfile?> = _staffProfile
}

// For commonMain - will need expect/actual for System.currentTimeMillis()
expect fun currentTimeMillis(): Long
