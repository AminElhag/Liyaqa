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
interface TenantAwareRepository<T, ID> : JpaRepository<T, ID>

/**
 * Utility class for enabling Hibernate tenant filters on the current session.
 */
object TenantFilter {
    const val FILTER_NAME = "tenantFilter"
    const val PARAMETER_NAME = "tenantId"

    fun enableFilter(entityManager: EntityManager) {
        val tenantId = TenantContext.getCurrentTenantOrNull() ?: return

        val session = entityManager.unwrap(Session::class.java)
        session.enableFilter(FILTER_NAME)
            .setParameter(PARAMETER_NAME, tenantId.value)
    }

    fun disableFilter(entityManager: EntityManager) {
        val session = entityManager.unwrap(Session::class.java)
        session.disableFilter(FILTER_NAME)
    }
}
