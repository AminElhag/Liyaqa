package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.ScheduledChangeStatus
import com.liyaqa.membership.domain.model.ScheduledPlanChange
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ScheduledPlanChange entity.
 * Scheduled changes are tenant-scoped (belong to a club).
 */
interface ScheduledPlanChangeRepository {
    fun save(change: ScheduledPlanChange): ScheduledPlanChange
    fun findById(id: UUID): Optional<ScheduledPlanChange>
    fun findBySubscriptionId(subscriptionId: UUID): Optional<ScheduledPlanChange>
    fun findPendingBySubscriptionId(subscriptionId: UUID): Optional<ScheduledPlanChange>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ScheduledPlanChange>
    fun findByStatus(status: ScheduledChangeStatus, pageable: Pageable): Page<ScheduledPlanChange>
    fun findAll(pageable: Pageable): Page<ScheduledPlanChange>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find pending changes due for processing.
     */
    fun findPendingDueForProcessing(asOfDate: LocalDate, pageable: Pageable): Page<ScheduledPlanChange>

    /**
     * Find all pending changes.
     */
    fun findAllPending(pageable: Pageable): Page<ScheduledPlanChange>

    /**
     * Check if subscription has a pending change.
     */
    fun existsPendingBySubscriptionId(subscriptionId: UUID): Boolean
}
