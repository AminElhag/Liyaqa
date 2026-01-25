package com.liyaqa.member.data.local

/**
 * Secure token storage interface
 * Platform implementations use:
 * - Android: EncryptedSharedPreferences
 * - iOS: Keychain
 */
expect class TokenStorage {
    suspend fun saveAccessToken(token: String)
    suspend fun getAccessToken(): String?
    suspend fun saveRefreshToken(token: String)
    suspend fun getRefreshToken(): String?
    suspend fun saveTokens(accessToken: String, refreshToken: String)
    suspend fun clearTokens()

    // User ID storage for biometric auth
    suspend fun saveUserId(userId: String)
    suspend fun getUserId(): String?
    suspend fun clearUserId()

    // Tenant ID storage
    suspend fun saveTenantId(tenantId: String)
    suspend fun getTenantId(): String?
    suspend fun clearTenantId()

    // Clear all stored data
    suspend fun clearAll()
}
