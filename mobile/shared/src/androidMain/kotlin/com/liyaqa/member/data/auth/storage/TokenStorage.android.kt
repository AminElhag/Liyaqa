package com.liyaqa.member.data.auth.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Android implementation of TokenStorage using EncryptedSharedPreferences.
 * Uses AES256-GCM encryption backed by Android Keystore.
 */
actual class TokenStorage(private val context: Context) {

    private val prefs: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            PREFS_FILE_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

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

    actual suspend fun saveTenantId(tenantId: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_TENANT_ID, tenantId).apply()
    }

    actual suspend fun getTenantId(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_TENANT_ID, null)
    }

    actual suspend fun saveUserId(userId: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_USER_ID, userId).apply()
    }

    actual suspend fun getUserId(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_USER_ID, null)
    }

    actual suspend fun saveUserRole(role: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_USER_ROLE, role).apply()
    }

    actual suspend fun getUserRole(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_USER_ROLE, null)
    }

    actual suspend fun saveUserJson(userJson: String) = withContext(Dispatchers.IO) {
        prefs.edit().putString(KEY_USER_JSON, userJson).apply()
    }

    actual suspend fun getUserJson(): String? = withContext(Dispatchers.IO) {
        prefs.getString(KEY_USER_JSON, null)
    }

    actual suspend fun clearAll() = withContext(Dispatchers.IO) {
        prefs.edit().clear().apply()
    }

    actual suspend fun isLoggedIn(): Boolean = withContext(Dispatchers.IO) {
        !prefs.getString(KEY_ACCESS_TOKEN, null).isNullOrEmpty()
    }

    companion object {
        private const val PREFS_FILE_NAME = "liyaqa_secure_prefs"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_TENANT_ID = "tenant_id"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_JSON = "user_json"
    }
}
