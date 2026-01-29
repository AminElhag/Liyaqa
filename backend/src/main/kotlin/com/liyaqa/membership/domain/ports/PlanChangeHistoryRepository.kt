package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.PlanChangeHistory
import com.liyaqa.membership.domain.model.PlanChangeType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for PlanChangeHistory entity.
 * Plan change history is tenant-scoped (belongs to a club).
 */
interface PlanChangeHistoryRepository {
    fun save(history: PlanChangeHistory): PlanChangeHistory
    fun findById(id: UUID): Optional<PlanChangeHistory>
    fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<PlanChangeHistory>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PlanChangeHistory>
    fun findByChangeType(type: PlanChangeType, pageable: Pageable): Page<PlanChangeHistory>
    fun findAll(pageable: Pageable): Page<PlanChangeHistory>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find plan changes within a date range.
     */
    fun findByEffectiveDateBetween(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<PlanChangeHistory>

    /**
     * Count plan changes by type within a date range.
     */
    fun countByChangeTypeAndEffectiveDateBetween(type: PlanChangeType, startDate: LocalDate, endDate: LocalDate): Long

    /**
     * Get most recent change for a subscription.
     */
    fun findLatestBySubscriptionId(subscriptionId: UUID): Optional<PlanChangeHistory>
}
