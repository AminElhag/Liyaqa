package com.liyaqa.shared.domain

import java.util.UUID

/**
 * Holds the current tenant and organization context for the request.
 * Uses ThreadLocal for thread-safe tenant isolation.
 *
 * Supports:
 * - Standard tenant-level access (club-level data isolation)
 * - Super-tenant mode (organization-level access across all clubs)
 */
object TenantContext {
    private val currentTenant = ThreadLocal<TenantId?>()
    private val currentOrganization = ThreadLocal<OrganizationId?>()
    private val superTenantMode = ThreadLocal<Boolean>()

    // Tenant methods
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

    // Organization methods
    fun setCurrentOrganization(orgId: OrganizationId) {
        currentOrganization.set(orgId)
    }

    fun getCurrentOrganization(): OrganizationId {
        return currentOrganization.get()
            ?: throw IllegalStateException("No organization context set for current request")
    }

    fun getCurrentOrganizationOrNull(): OrganizationId? {
        return currentOrganization.get()
    }

    /**
     * Enable super-tenant mode - allows organization to query across all its clubs.
     * When enabled, tenant filter is bypassed but organization filter is applied.
     */
    fun enableSuperTenantMode() {
        superTenantMode.set(true)
    }

    fun isSuperTenantMode(): Boolean {
        return superTenantMode.get() ?: false
    }

    fun clear() {
        currentTenant.remove()
        currentOrganization.remove()
        superTenantMode.remove()
    }
}

/**
 * Value object representing a Tenant identifier.
 * In this system, Tenant ID corresponds to Club ID.
 */
@JvmInline
value class TenantId(val value: UUID) {
    companion object {
        fun generate(): TenantId = TenantId(UUID.randomUUID())
        fun fromString(value: String): TenantId = TenantId(UUID.fromString(value))
    }

    override fun toString(): String = value.toString()
}

/**
 * Value object representing an Organization identifier.
 */
@JvmInline
value class OrganizationId(val value: UUID) {
    companion object {
        fun generate(): OrganizationId = OrganizationId(UUID.randomUUID())
        fun fromString(value: String): OrganizationId = OrganizationId(UUID.fromString(value))
    }

    override fun toString(): String = value.toString()
}
