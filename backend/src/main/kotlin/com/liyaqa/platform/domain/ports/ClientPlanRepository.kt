package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.ClientPlan
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ClientPlan entity.
 * ClientPlans are platform-level (not tenant-scoped) and represent B2B pricing tiers.
 */
interface ClientPlanRepository {
    fun save(plan: ClientPlan): ClientPlan
    fun findById(id: UUID): Optional<ClientPlan>
    fun findAll(pageable: Pageable): Page<ClientPlan>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<ClientPlan>
    fun findAllActive(): List<ClientPlan>
    fun findAllOrderBySortOrder(): List<ClientPlan>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
}
