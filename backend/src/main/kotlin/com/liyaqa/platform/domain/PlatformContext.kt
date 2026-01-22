package com.liyaqa.platform.domain

import java.util.UUID

/**
 * Thread-local context for platform operations.
 *
 * Holds the current platform user context, including:
 * - Whether the current request is from a platform user
 * - The platform user's ID
 * - The current impersonation target (if any)
 *
 * Similar to TenantContext but for platform-level operations.
 */
object PlatformContext {

    /** Well-known UUID for the Liyaqa Platform organization */
    val PLATFORM_ORGANIZATION_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000001")

    private val platformModeHolder = ThreadLocal<Boolean>()
    private val platformUserIdHolder = ThreadLocal<UUID>()
    private val impersonatedUserIdHolder = ThreadLocal<UUID>()
    private val impersonatedTenantIdHolder = ThreadLocal<UUID>()

    /**
     * Check if the current request is in platform mode.
     */
    fun isPlatformMode(): Boolean = platformModeHolder.get() ?: false

    /**
     * Set platform mode for the current thread.
     */
    fun setPlatformMode(enabled: Boolean) {
        platformModeHolder.set(enabled)
    }

    /**
     * Get the current platform user ID.
     */
    fun getCurrentPlatformUserId(): UUID? = platformUserIdHolder.get()

    /**
     * Set the current platform user ID.
     */
    fun setCurrentPlatformUserId(userId: UUID?) {
        if (userId != null) {
            platformUserIdHolder.set(userId)
        } else {
            platformUserIdHolder.remove()
        }
    }

    /**
     * Check if currently impersonating a user.
     */
    fun isImpersonating(): Boolean = impersonatedUserIdHolder.get() != null

    /**
     * Get the ID of the user being impersonated.
     */
    fun getImpersonatedUserId(): UUID? = impersonatedUserIdHolder.get()

    /**
     * Set the impersonated user ID.
     */
    fun setImpersonatedUserId(userId: UUID?) {
        if (userId != null) {
            impersonatedUserIdHolder.set(userId)
        } else {
            impersonatedUserIdHolder.remove()
        }
    }

    /**
     * Get the tenant ID of the impersonated user.
     */
    fun getImpersonatedTenantId(): UUID? = impersonatedTenantIdHolder.get()

    /**
     * Set the tenant ID for the impersonated user.
     */
    fun setImpersonatedTenantId(tenantId: UUID?) {
        if (tenantId != null) {
            impersonatedTenantIdHolder.set(tenantId)
        } else {
            impersonatedTenantIdHolder.remove()
        }
    }

    /**
     * Start impersonation session.
     */
    fun startImpersonation(userId: UUID, tenantId: UUID) {
        impersonatedUserIdHolder.set(userId)
        impersonatedTenantIdHolder.set(tenantId)
    }

    /**
     * End impersonation session.
     */
    fun endImpersonation() {
        impersonatedUserIdHolder.remove()
        impersonatedTenantIdHolder.remove()
    }

    /**
     * Clear all platform context from the current thread.
     * Should be called after request processing.
     */
    fun clear() {
        platformModeHolder.remove()
        platformUserIdHolder.remove()
        impersonatedUserIdHolder.remove()
        impersonatedTenantIdHolder.remove()
    }
}

/**
 * Data class representing the current platform context.
 */
data class PlatformContextData(
    val isPlatformMode: Boolean,
    val platformUserId: UUID?,
    val impersonatedUserId: UUID?,
    val impersonatedTenantId: UUID?
)

/**
 * Get current platform context as a data class.
 */
fun PlatformContext.toData(): PlatformContextData = PlatformContextData(
    isPlatformMode = isPlatformMode(),
    platformUserId = getCurrentPlatformUserId(),
    impersonatedUserId = getImpersonatedUserId(),
    impersonatedTenantId = getImpersonatedTenantId()
)
