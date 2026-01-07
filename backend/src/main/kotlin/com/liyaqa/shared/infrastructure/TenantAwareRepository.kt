package com.liyaqa.shared.infrastructure

import com.liyaqa.shared.domain.TenantContext
import jakarta.persistence.EntityManager
import org.hibernate.Session
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.NoRepositoryBean
import java.util.UUID

/**
 * Base interface for tenant-aware repositories.
 * All queries will be automatically filtered by the current tenant.
 */
@NoRepositoryBean
interface TenantAwareRepository<T : Any, ID : Any> : JpaRepository<T, ID>

/**
 * Utility class for enabling Hibernate tenant and organization filters.
 *
 * Supports two modes:
 * - Tenant filter: Standard club-level data isolation
 * - Organization filter: Super-tenant mode for cross-club queries
 */
object TenantFilter {
    const val TENANT_FILTER_NAME = "tenantFilter"
    const val ORG_FILTER_NAME = "organizationFilter"
    const val TENANT_PARAMETER = "tenantId"
    const val ORG_PARAMETER = "organizationId"

    // Legacy constants for backward compatibility
    const val FILTER_NAME = TENANT_FILTER_NAME
    const val PARAMETER_NAME = TENANT_PARAMETER

    /**
     * Enable tenant filter for standard club-level access.
     */
    fun enableFilter(entityManager: EntityManager) {
        enableTenantFilter(entityManager)
    }

    /**
     * Enable tenant filter for standard club-level access.
     */
    fun enableTenantFilter(entityManager: EntityManager) {
        val tenantId = TenantContext.getCurrentTenantOrNull() ?: return

        val session = entityManager.unwrap(Session::class.java)
        session.enableFilter(TENANT_FILTER_NAME)
            .setParameter(TENANT_PARAMETER, tenantId.value)
    }

    /**
     * Enable organization filter for super-tenant access.
     * Disables tenant filter and enables organization filter instead.
     */
    fun enableOrganizationFilter(entityManager: EntityManager) {
        val orgId = TenantContext.getCurrentOrganizationOrNull() ?: return

        val session = entityManager.unwrap(Session::class.java)

        // Disable tenant filter if enabled
        try {
            session.disableFilter(TENANT_FILTER_NAME)
        } catch (_: Exception) {
            // Filter might not be enabled, ignore
        }

        // Enable organization filter
        session.enableFilter(ORG_FILTER_NAME)
            .setParameter(ORG_PARAMETER, orgId.value)
    }

    /**
     * Enable the appropriate filter based on current context.
     * Uses organization filter in super-tenant mode, otherwise tenant filter.
     */
    fun enableContextualFilter(entityManager: EntityManager) {
        if (TenantContext.isSuperTenantMode()) {
            enableOrganizationFilter(entityManager)
        } else {
            enableTenantFilter(entityManager)
        }
    }

    fun disableFilter(entityManager: EntityManager) {
        disableAllFilters(entityManager)
    }

    fun disableAllFilters(entityManager: EntityManager) {
        val session = entityManager.unwrap(Session::class.java)
        try {
            session.disableFilter(TENANT_FILTER_NAME)
        } catch (_: Exception) {
            // Ignore if not enabled
        }
        try {
            session.disableFilter(ORG_FILTER_NAME)
        } catch (_: Exception) {
            // Ignore if not enabled
        }
    }
}
