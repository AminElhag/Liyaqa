package com.liyaqa.member.data.local

import kotlinx.cinterop.COpaquePointerVar
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.alloc
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import kotlinx.cinterop.value
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import platform.CoreFoundation.CFDictionaryRef
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
import platform.Security.SecItemUpdate
import platform.Security.errSecItemNotFound
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
import platform.darwin.OSStatus

@OptIn(ExperimentalForeignApi::class)
actual class TokenStorage {
    private val serviceName = "com.liyaqa.member"

    actual suspend fun saveAccessToken(token: String) = withContext(Dispatchers.IO) {
        save(KEY_ACCESS_TOKEN, token)
    }

    actual suspend fun getAccessToken(): String? = withContext(Dispatchers.IO) {
        get(KEY_ACCESS_TOKEN)
    }

    actual suspend fun saveRefreshToken(token: String) = withContext(Dispatchers.IO) {
        save(KEY_REFRESH_TOKEN, token)
    }

    actual suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        get(KEY_REFRESH_TOKEN)
    }

    actual suspend fun saveTokens(accessToken: String, refreshToken: String) = withContext(Dispatchers.IO) {
        save(KEY_ACCESS_TOKEN, accessToken)
        save(KEY_REFRESH_TOKEN, refreshToken)
    }

    actual suspend fun clearTokens() = withContext(Dispatchers.IO) {
        delete(KEY_ACCESS_TOKEN)
        delete(KEY_REFRESH_TOKEN)
    }

    actual suspend fun saveUserId(userId: String) = withContext(Dispatchers.IO) {
        save(KEY_USER_ID, userId)
    }

    actual suspend fun getUserId(): String? = withContext(Dispatchers.IO) {
        get(KEY_USER_ID)
    }

    actual suspend fun clearUserId() = withContext(Dispatchers.IO) {
        delete(KEY_USER_ID)
    }

    actual suspend fun saveTenantId(tenantId: String) = withContext(Dispatchers.IO) {
        save(KEY_TENANT_ID, tenantId)
    }

    actual suspend fun getTenantId(): String? = withContext(Dispatchers.IO) {
        get(KEY_TENANT_ID)
    }

    actual suspend fun clearTenantId() = withContext(Dispatchers.IO) {
        delete(KEY_TENANT_ID)
    }

    actual suspend fun clearAll() = withContext(Dispatchers.IO) {
        clearTokens()
        clearUserId()
        clearTenantId()
    }

    private fun save(key: String, value: String) {
        val data = (value as NSString).dataUsingEncoding(NSUTF8StringEncoding) ?: return

        // First try to update existing item
        val updateQuery = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to serviceName,
            kSecAttrAccount to key
        )

        val updateAttributes = mapOf<Any?, Any?>(
            kSecValueData to data
        )

        val updateStatus = SecItemUpdate(
            CFBridgingRetain(updateQuery) as CFDictionaryRef,
            CFBridgingRetain(updateAttributes) as CFDictionaryRef
        )

        if (updateStatus == errSecItemNotFound) {
            // Item doesn't exist, add it
            val addQuery = mapOf<Any?, Any?>(
                kSecClass to kSecClassGenericPassword,
                kSecAttrService to serviceName,
                kSecAttrAccount to key,
                kSecValueData to data,
                kSecAttrAccessible to kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            )

            SecItemAdd(CFBridgingRetain(addQuery) as CFDictionaryRef, null)
        }
    }

    private fun get(key: String): String? {
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to serviceName,
            kSecAttrAccount to key,
            kSecReturnData to true,
            kSecMatchLimit to kSecMatchLimitOne
        )

        memScoped {
            val resultPtr = alloc<COpaquePointerVar>()
            val status = SecItemCopyMatching(
                CFBridgingRetain(query) as CFDictionaryRef,
                resultPtr.ptr
            )

            if (status == errSecSuccess) {
                val data = CFBridgingRelease(resultPtr.value) as? NSData
                return data?.let {
                    NSString.create(data = it, encoding = NSUTF8StringEncoding) as? String
                }
            }
        }
        return null
    }

    private fun delete(key: String) {
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to serviceName,
            kSecAttrAccount to key
        )

        SecItemDelete(CFBridgingRetain(query) as CFDictionaryRef)
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_TENANT_ID = "tenant_id"
    }
}
