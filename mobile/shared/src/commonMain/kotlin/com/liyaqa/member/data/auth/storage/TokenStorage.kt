package com.liyaqa.member.data.auth.storage

/**
 * Platform-specific secure token storage.
 * - Android: Uses EncryptedSharedPreferences with AES256-GCM encryption
 * - iOS: Uses Keychain with kSecAttrAccessibleWhenUnlockedThisDeviceOnly
 */
expect class TokenStorage {
    /**
     * Saves the access token securely.
     */
    suspend fun saveAccessToken(token: String)

    /**
     * Retrieves the stored access token.
     */
    suspend fun getAccessToken(): String?

    /**
     * Saves the refresh token securely.
     */
    suspend fun saveRefreshToken(token: String)

    /**
     * Retrieves the stored refresh token.
     */
    suspend fun getRefreshToken(): String?

    /**
     * Saves the tenant ID.
     */
    suspend fun saveTenantId(tenantId: String)

    /**
     * Retrieves the stored tenant ID.
     */
    suspend fun getTenantId(): String?

    /**
     * Saves the user ID.
     */
    suspend fun saveUserId(userId: String)

    /**
     * Retrieves the stored user ID.
     */
    suspend fun getUserId(): String?

    /**
     * Saves the user role.
     */
    suspend fun saveUserRole(role: String)

    /**
     * Retrieves the stored user role.
     */
    suspend fun getUserRole(): String?

    /**
     * Saves the serialized user JSON.
     */
    suspend fun saveUserJson(userJson: String)

    /**
     * Retrieves the stored user JSON.
     */
    suspend fun getUserJson(): String?

    /**
     * Clears all stored authentication data.
     * Called on logout.
     */
    suspend fun clearAll()

    /**
     * Checks if user is logged in (has valid access token).
     */
    suspend fun isLoggedIn(): Boolean
}
