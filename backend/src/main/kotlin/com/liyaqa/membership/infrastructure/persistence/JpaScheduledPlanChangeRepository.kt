package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.ScheduledChangeStatus
import com.liyaqa.membership.domain.model.ScheduledPlanChange
import com.liyaqa.membership.domain.ports.ScheduledPlanChangeRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataScheduledPlanChangeRepository : JpaRepository<ScheduledPlanChange, UUID> {
    fun findBySubscriptionId(subscriptionId: UUID): Optional<ScheduledPlanChange>

    @Query("SELECT s FROM ScheduledPlanChange s WHERE s.subscriptionId = :subscriptionId AND s.status = 'PENDING'")
    fun findPendingBySubscriptionId(@Param("subscriptionId") subscriptionId: UUID): Optional<ScheduledPlanChange>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ScheduledPlanChange>

    fun findByStatus(status: ScheduledChangeStatus, pageable: Pageable): Page<ScheduledPlanChange>

    @Query("SELECT s FROM ScheduledPlanChange s WHERE s.status = 'PENDING' AND s.scheduledDate <= :asOfDate")
    fun findPendingDueForProcessing(
        @Param("asOfDate") asOfDate: LocalDate,
        pageable: Pageable
    ): Page<ScheduledPlanChange>

    @Query("SELECT s FROM ScheduledPlanChange s WHERE s.status = 'PENDING'")
    fun findAllPending(pageable: Pageable): Page<ScheduledPlanChange>

    @Query("SELECT COUNT(s) > 0 FROM ScheduledPlanChange s WHERE s.subscriptionId = :subscriptionId AND s.status = 'PENDING'")
    fun existsPendingBySubscriptionId(@Param("subscriptionId") subscriptionId: UUID): Boolean
}

@Repository
class JpaScheduledPlanChangeRepository(
    private val springDataRepository: SpringDataScheduledPlanChangeRepository
) : ScheduledPlanChangeRepository {

    override fun save(change: ScheduledPlanChange): ScheduledPlanChange =
        springDataRepository.save(change)

    override fun findById(id: UUID): Optional<ScheduledPlanChange> =
        springDataRepository.findById(id)

    override fun findBySubscriptionId(subscriptionId: UUID): Optional<ScheduledPlanChange> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findPendingBySubscriptionId(subscriptionId: UUID): Optional<ScheduledPlanChange> =
        springDataRepository.findPendingBySubscriptionId(subscriptionId)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ScheduledPlanChange> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByStatus(status: ScheduledChangeStatus, pageable: Pageable): Page<ScheduledPlanChange> =
        springDataRepository.findByStatus(status, pageable)

    override fun findAll(pageable: Pageable): Page<ScheduledPlanChange> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findPendingDueForProcessing(asOfDate: LocalDate, pageable: Pageable): Page<ScheduledPlanChange> =
        springDataRepository.findPendingDueForProcessing(asOfDate, pageable)

    override fun findAllPending(pageable: Pageable): Page<ScheduledPlanChange> =
        springDataRepository.findAllPending(pageable)

    override fun existsPendingBySubscriptionId(subscriptionId: UUID): Boolean =
        springDataRepository.existsPendingBySubscriptionId(subscriptionId)
}
