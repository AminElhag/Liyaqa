package com.liyaqa.shared.infrastructure

import com.liyaqa.shared.domain.TenantContext
import jakarta.persistence.EntityManager
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Before
import org.hibernate.Session
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * AOP Aspect that automatically enables the Hibernate tenant filter
 * before READ operations on repositories.
 *
 * This ensures that all queries are automatically filtered by the
 * current tenant, providing data isolation in a multi-tenant system.
 *
 * IMPORTANT: This aspect only applies to READ operations (find, get, exists, count).
 * It does NOT apply to WRITE operations (save, delete) to avoid interference
 * with JPA's merge() operation which would cause duplicate inserts.
 */
@Aspect
@Component
class TenantFilterAspect(
    private val entityManager: EntityManager
) {
    private val logger = LoggerFactory.getLogger(TenantFilterAspect::class.java)

    /**
     * Enables the tenant filter before READ operations on custom repositories.
     *
     * Only matches: find*, get*, exists*, count* methods
     * Does NOT match: save*, delete*, update* methods
     */
    @Before(
        "execution(* com.liyaqa..*.persistence..*Repository*.find*(..)) || " +
        "execution(* com.liyaqa..*.persistence..*Repository*.get*(..)) || " +
        "execution(* com.liyaqa..*.persistence..*Repository*.exists*(..)) || " +
        "execution(* com.liyaqa..*.persistence..*Repository*.count*(..))"
    )
    fun enableTenantFilterForPersistenceReads() {
        enableFilter()
    }

    /**
     * Enables the tenant filter before READ operations on Spring Data repositories.
     *
     * Only matches: find*, get*, exists*, count* methods
     */
    @Before(
        "execution(* org.springframework.data.repository.Repository+.find*(..)) || " +
        "execution(* org.springframework.data.repository.Repository+.get*(..)) || " +
        "execution(* org.springframework.data.repository.Repository+.exists*(..)) || " +
        "execution(* org.springframework.data.repository.Repository+.count*(..))"
    )
    fun enableTenantFilterForSpringDataReads() {
        enableFilter()
    }

    private fun enableFilter() {
        val tenantId = TenantContext.getCurrentTenantOrNull() ?: return

        try {
            val session = entityManager.unwrap(Session::class.java)
            val filter = session.enableFilter(TenantFilter.TENANT_FILTER_NAME)
            filter.setParameter(TenantFilter.TENANT_PARAMETER, tenantId.value)
            logger.debug("Enabled tenant filter for tenant: ${tenantId.value}")
        } catch (e: Exception) {
            logger.warn("Failed to enable tenant filter: ${e.message}")
        }
    }
}
