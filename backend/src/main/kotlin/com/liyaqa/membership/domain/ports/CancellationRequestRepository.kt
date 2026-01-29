package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.CancellationRequest
import com.liyaqa.membership.domain.model.CancellationRequestStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for CancellationRequest entity.
 * Cancellation requests are tenant-scoped (belong to a club).
 */
interface CancellationRequestRepository {
    fun save(request: CancellationRequest): CancellationRequest
    fun findById(id: UUID): Optional<CancellationRequest>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<CancellationRequest>
    fun findBySubscriptionId(subscriptionId: UUID): Optional<CancellationRequest>
    fun findPendingBySubscriptionId(subscriptionId: UUID): Optional<CancellationRequest>
    fun findByStatus(status: CancellationRequestStatus, pageable: Pageable): Page<CancellationRequest>
    fun findAll(pageable: Pageable): Page<CancellationRequest>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find requests in notice period ready for completion.
     */
    fun findRequestsDueForCompletion(asOfDate: LocalDate, pageable: Pageable): Page<CancellationRequest>

    /**
     * Find requests assigned to a staff member.
     */
    fun findByAssignedTo(userId: UUID, pageable: Pageable): Page<CancellationRequest>

    /**
     * Count requests by status.
     */
    fun countByStatus(status: CancellationRequestStatus): Long

    /**
     * Get saved members count (retention success).
     */
    fun countSaved(): Long

    /**
     * Get retention rate (saved / total completed).
     */
    fun getRetentionRate(): Double
}
