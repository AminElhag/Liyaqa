package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.CancellationRequest
import com.liyaqa.membership.domain.model.CancellationRequestStatus
import com.liyaqa.membership.domain.ports.CancellationRequestRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataCancellationRequestRepository : JpaRepository<CancellationRequest, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<CancellationRequest>

    fun findBySubscriptionId(subscriptionId: UUID): Optional<CancellationRequest>

    @Query("SELECT r FROM CancellationRequest r WHERE r.subscriptionId = :subscriptionId AND r.status IN ('PENDING_NOTICE', 'IN_NOTICE')")
    fun findPendingBySubscriptionId(@Param("subscriptionId") subscriptionId: UUID): Optional<CancellationRequest>

    fun findByStatus(status: CancellationRequestStatus, pageable: Pageable): Page<CancellationRequest>

    @Query("SELECT r FROM CancellationRequest r WHERE r.status = 'IN_NOTICE' AND r.noticePeriodEndDate <= :asOfDate")
    fun findRequestsDueForCompletion(
        @Param("asOfDate") asOfDate: LocalDate,
        pageable: Pageable
    ): Page<CancellationRequest>

    @Query("SELECT r FROM CancellationRequest r WHERE r.assignedToUserId = :userId")
    fun findByAssignedTo(@Param("userId") userId: UUID, pageable: Pageable): Page<CancellationRequest>

    fun countByStatus(status: CancellationRequestStatus): Long

    @Query("SELECT COUNT(r) FROM CancellationRequest r WHERE r.status = 'SAVED'")
    fun countSaved(): Long

    @Query("""
        SELECT
            CASE WHEN (COUNT(r) > 0)
            THEN CAST(SUM(CASE WHEN r.status = 'SAVED' THEN 1 ELSE 0 END) AS double) / COUNT(r)
            ELSE 0.0 END
        FROM CancellationRequest r WHERE r.status IN ('SAVED', 'COMPLETED')
    """)
    fun getRetentionRate(): Double
}

@Repository
class JpaCancellationRequestRepository(
    private val springDataRepository: SpringDataCancellationRequestRepository
) : CancellationRequestRepository {

    override fun save(request: CancellationRequest): CancellationRequest =
        springDataRepository.save(request)

    override fun findById(id: UUID): Optional<CancellationRequest> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<CancellationRequest> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findBySubscriptionId(subscriptionId: UUID): Optional<CancellationRequest> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findPendingBySubscriptionId(subscriptionId: UUID): Optional<CancellationRequest> =
        springDataRepository.findPendingBySubscriptionId(subscriptionId)

    override fun findByStatus(status: CancellationRequestStatus, pageable: Pageable): Page<CancellationRequest> =
        springDataRepository.findByStatus(status, pageable)

    override fun findAll(pageable: Pageable): Page<CancellationRequest> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findRequestsDueForCompletion(asOfDate: LocalDate, pageable: Pageable): Page<CancellationRequest> =
        springDataRepository.findRequestsDueForCompletion(asOfDate, pageable)

    override fun findByAssignedTo(userId: UUID, pageable: Pageable): Page<CancellationRequest> =
        springDataRepository.findByAssignedTo(userId, pageable)

    override fun countByStatus(status: CancellationRequestStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countSaved(): Long =
        springDataRepository.countSaved()

    override fun getRetentionRate(): Double =
        springDataRepository.getRetentionRate()
}
