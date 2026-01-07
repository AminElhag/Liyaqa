package com.liyaqa.shared.domain

import java.util.UUID

/**
 * Holds the current tenant context for the request.
 * Uses ThreadLocal for thread-safe tenant isolation.
 */
object TenantContext {
    private val currentTenant = ThreadLocal<TenantId?>()

    fun setCurrentTenant(tenantId: TenantId) {
        currentTenant.set(tenantId)
    }

    fun getCurrentTenant(): TenantId {
        return currentTenant.get()
            ?: throw IllegalStateException("No tenant context set for current request")
    }

    fun getCurrentTenantOrNull(): TenantId? {
        return currentTenant.get()
    }

    fun clear() {
        currentTenant.remove()
    }
}

/**
 * Value object representing a Tenant identifier.
 */
@JvmInline
value class TenantId(val value: UUID) {
    companion object {
        fun generate(): TenantId = TenantId(UUID.randomUUID())
        fun fromString(value: String): TenantId = TenantId(UUID.fromString(value))
    }

    override fun toString(): String = value.toString()
}
