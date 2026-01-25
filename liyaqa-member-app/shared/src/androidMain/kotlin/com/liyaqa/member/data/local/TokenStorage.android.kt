package com.liyaqa.member.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

actual class TokenStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "liyaqa_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    actual suspend fun saveAccessToken(token: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    }

    actual suspend fun getAccessToken(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_ACCESS_TOKEN, null)
    }

    actual suspend fun saveRefreshToken(token: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
    }

    actual suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_REFRESH_TOKEN, null)
    }

    actual suspend fun saveTokens(accessToken: String, refreshToken: String) = withContext(Dispatchers.IO) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply()
    }

    actual suspend fun clearTokens() = withContext(Dispatchers.IO) {
        prefs.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .apply()
    }

    actual suspend fun saveUserId(userId: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_USER_ID, userId).apply()
    }

    actual suspend fun getUserId(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_USER_ID, null)
    }

    actual suspend fun clearUserId() = withContext(Dispatchers.IO) {
        prefs.edit().remove(KEY_USER_ID).apply()
    }

    actual suspend fun saveTenantId(tenantId: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_TENANT_ID, tenantId).apply()
    }

    actual suspend fun getTenantId(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_TENANT_ID, null)
    }

    actual suspend fun clearTenantId() = withContext(Dispatchers.IO) {
        prefs.edit().remove(KEY_TENANT_ID).apply()
    }

    actual suspend fun clearAll() = withContext(Dispatchers.IO) {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_TENANT_ID = "tenant_id"
    }
}
