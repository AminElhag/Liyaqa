package com.liyaqa.member.data.auth.storage

import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.alloc
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import kotlinx.cinterop.reinterpret
import kotlinx.cinterop.value
import platform.CoreFoundation.CFDictionaryRef
import platform.CoreFoundation.CFTypeRefVar
import platform.Foundation.CFBridgingRelease
import platform.Foundation.CFBridgingRetain
import platform.Foundation.NSData
import platform.Foundation.NSString
import platform.Foundation.NSUTF8StringEncoding
import platform.Foundation.create
import platform.Foundation.dataUsingEncoding
import platform.Security.SecItemAdd
import platform.Security.SecItemCopyMatching
import platform.Security.SecItemDelete
import platform.Security.errSecSuccess
import platform.Security.kSecAttrAccessible
import platform.Security.kSecAttrAccessibleWhenUnlockedThisDeviceOnly
import platform.Security.kSecAttrAccount
import platform.Security.kSecAttrService
import platform.Security.kSecClass
import platform.Security.kSecClassGenericPassword
import platform.Security.kSecMatchLimit
import platform.Security.kSecMatchLimitOne
import platform.Security.kSecReturnData
import platform.Security.kSecValueData

/**
 * iOS implementation of TokenStorage using Keychain.
 * Uses kSecAttrAccessibleWhenUnlockedThisDeviceOnly for security.
 */
@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
actual class TokenStorage {

    actual suspend fun saveAccessToken(token: String) {
        saveToKeychain(KEY_ACCESS_TOKEN, token)
    }

    actual suspend fun getAccessToken(): String? {
        return getFromKeychain(KEY_ACCESS_TOKEN)
    }

    actual suspend fun saveRefreshToken(token: String) {
        saveToKeychain(KEY_REFRESH_TOKEN, token)
    }

    actual suspend fun getRefreshToken(): String? {
        return getFromKeychain(KEY_REFRESH_TOKEN)
    }

    actual suspend fun saveTenantId(tenantId: String) {
        saveToKeychain(KEY_TENANT_ID, tenantId)
    }

    actual suspend fun getTenantId(): String? {
        return getFromKeychain(KEY_TENANT_ID)
    }

    actual suspend fun saveUserId(userId: String) {
        saveToKeychain(KEY_USER_ID, userId)
    }

    actual suspend fun getUserId(): String? {
        return getFromKeychain(KEY_USER_ID)
    }

    actual suspend fun saveUserRole(role: String) {
        saveToKeychain(KEY_USER_ROLE, role)
    }

    actual suspend fun getUserRole(): String? {
        return getFromKeychain(KEY_USER_ROLE)
    }

    actual suspend fun saveUserJson(userJson: String) {
        saveToKeychain(KEY_USER_JSON, userJson)
    }

    actual suspend fun getUserJson(): String? {
        return getFromKeychain(KEY_USER_JSON)
    }

    actual suspend fun clearAll() {
        listOf(
            KEY_ACCESS_TOKEN,
            KEY_REFRESH_TOKEN,
            KEY_TENANT_ID,
            KEY_USER_ID,
            KEY_USER_ROLE,
            KEY_USER_JSON
        ).forEach { key ->
            deleteFromKeychain(key)
        }
    }

    actual suspend fun isLoggedIn(): Boolean {
        return !getAccessToken().isNullOrEmpty()
    }

    private fun saveToKeychain(key: String, value: String) {
        val data = (value as NSString).dataUsingEncoding(NSUTF8StringEncoding) ?: return

        // First try to delete any existing item
        deleteFromKeychain(key)

        // Create query dictionary
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to SERVICE_NAME,
            kSecAttrAccount to key,
            kSecValueData to data,
            kSecAttrAccessible to kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        )

        @Suppress("UNCHECKED_CAST")
        val cfQuery = CFBridgingRetain(query) as CFDictionaryRef

        SecItemAdd(cfQuery, null)
        CFBridgingRelease(cfQuery)
    }

    private fun getFromKeychain(key: String): String? {
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to SERVICE_NAME,
            kSecAttrAccount to key,
            kSecReturnData to true,
            kSecMatchLimit to kSecMatchLimitOne
        )

        @Suppress("UNCHECKED_CAST")
        val cfQuery = CFBridgingRetain(query) as CFDictionaryRef

        return memScoped {
            val result = alloc<CFTypeRefVar>()
            val status = SecItemCopyMatching(cfQuery, result.ptr)
            CFBridgingRelease(cfQuery)

            if (status == errSecSuccess) {
                val data = CFBridgingRelease(result.value) as? NSData
                data?.let {
                    NSString.create(data = it, encoding = NSUTF8StringEncoding) as? String
                }
            } else {
                null
            }
        }
    }

    private fun deleteFromKeychain(key: String) {
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to SERVICE_NAME,
            kSecAttrAccount to key
        )

        @Suppress("UNCHECKED_CAST")
        val cfQuery = CFBridgingRetain(query) as CFDictionaryRef

        SecItemDelete(cfQuery)
        CFBridgingRelease(cfQuery)
    }

    companion object {
        private const val SERVICE_NAME = "com.liyaqa.member"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_TENANT_ID = "tenant_id"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_JSON = "user_json"
    }
}
