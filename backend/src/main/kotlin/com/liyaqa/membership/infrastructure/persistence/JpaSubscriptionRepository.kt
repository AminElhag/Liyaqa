package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataSubscriptionRepository : JpaRepository<Subscription, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Subscription>

    @Query("SELECT s FROM Subscription s WHERE s.memberId = :memberId AND s.status = 'ACTIVE' AND s.endDate >= CURRENT_DATE")
    fun findActiveByMemberId(@Param("memberId") memberId: UUID): Optional<Subscription>

    fun findByPlanId(planId: UUID, pageable: Pageable): Page<Subscription>

    fun findByStatus(status: SubscriptionStatus, pageable: Pageable): Page<Subscription>

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate <= :date")
    fun findExpiringBefore(@Param("date") date: LocalDate, pageable: Pageable): Page<Subscription>

    @Query("SELECT s FROM Subscription s WHERE s.status = :status AND s.endDate BETWEEN :startDate AND :endDate")
    fun findByStatusAndEndDateBetween(
        @Param("status") status: SubscriptionStatus,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        pageable: Pageable
    ): Page<Subscription>

    @Query("SELECT COUNT(s) > 0 FROM Subscription s WHERE s.memberId = :memberId AND s.status = 'ACTIVE' AND s.endDate >= CURRENT_DATE")
    fun existsActiveByMemberId(@Param("memberId") memberId: UUID): Boolean

    fun countByMemberId(memberId: UUID): Long

    fun findByMemberIdAndStatus(memberId: UUID, status: SubscriptionStatus): List<Subscription>

    @Query("""
        SELECT s FROM Subscription s
        WHERE (:planId IS NULL OR s.planId = :planId)
        AND (:status IS NULL OR s.status = :status)
        AND (:expiringBefore IS NULL OR (s.status = 'ACTIVE' AND s.endDate <= :expiringBefore))
    """)
    fun search(
        @Param("planId") planId: UUID?,
        @Param("status") status: SubscriptionStatus?,
        @Param("expiringBefore") expiringBefore: LocalDate?,
        pageable: Pageable
    ): Page<Subscription>

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status IN ('CANCELLED', 'EXPIRED') AND s.endDate BETWEEN :startDate AND :endDate")
    fun countChurnedBetween(@Param("startDate") startDate: LocalDate, @Param("endDate") endDate: LocalDate): Long

    @Query("""
        SELECT s.planId as planId, COUNT(s) as total,
        SUM(CASE WHEN s.status IN ('CANCELLED', 'EXPIRED') THEN 1 ELSE 0 END) as churned
        FROM Subscription s
        WHERE s.endDate BETWEEN :startDate AND :endDate
        GROUP BY s.planId
    """)
    fun getChurnStatsByPlan(@Param("startDate") startDate: LocalDate, @Param("endDate") endDate: LocalDate): List<Array<Any>>

    /**
     * Find active subscriptions due for billing within the date range.
     * Checks currentBillingPeriodEnd falling within the range.
     */
    @Query("""
        SELECT s FROM Subscription s
        WHERE s.status = 'ACTIVE'
        AND s.currentBillingPeriodEnd BETWEEN :fromDate AND :toDate
        ORDER BY s.currentBillingPeriodEnd ASC
    """)
    fun findDueForBilling(
        @Param("fromDate") fromDate: LocalDate,
        @Param("toDate") toDate: LocalDate
    ): List<Subscription>
}

@Repository
class JpaSubscriptionRepository(
    private val springDataRepository: SpringDataSubscriptionRepository
) : SubscriptionRepository {

    override fun save(subscription: Subscription): Subscription =
        springDataRepository.save(subscription)

    override fun findById(id: UUID): Optional<Subscription> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Subscription> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findActiveByMemberId(memberId: UUID): Optional<Subscription> =
        springDataRepository.findActiveByMemberId(memberId)

    override fun findByPlanId(planId: UUID, pageable: Pageable): Page<Subscription> =
        springDataRepository.findByPlanId(planId, pageable)

    override fun findByStatus(status: SubscriptionStatus, pageable: Pageable): Page<Subscription> =
        springDataRepository.findByStatus(status, pageable)

    override fun findAll(pageable: Pageable): Page<Subscription> =
        springDataRepository.findAll(pageable)

    override fun findExpiringBefore(date: LocalDate, pageable: Pageable): Page<Subscription> =
        springDataRepository.findExpiringBefore(date, pageable)

    override fun findByStatusAndEndDateBetween(
        status: SubscriptionStatus,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<Subscription> =
        springDataRepository.findByStatusAndEndDateBetween(status, startDate, endDate, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsActiveByMemberId(memberId: UUID): Boolean =
        springDataRepository.existsActiveByMemberId(memberId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByMemberId(memberId: UUID): Long =
        springDataRepository.countByMemberId(memberId)

    override fun findByMemberIdAndStatus(memberId: UUID, status: SubscriptionStatus): List<Subscription> =
        springDataRepository.findByMemberIdAndStatus(memberId, status)

    override fun search(
        planId: UUID?,
        status: SubscriptionStatus?,
        expiringBefore: LocalDate?,
        pageable: Pageable
    ): Page<Subscription> =
        springDataRepository.search(planId, status, expiringBefore, pageable)

    override fun countChurnedBetween(startDate: LocalDate, endDate: LocalDate): Long =
        springDataRepository.countChurnedBetween(startDate, endDate)

    override fun getChurnByPlan(startDate: LocalDate, endDate: LocalDate): List<Map<String, Any>> {
        val results = springDataRepository.getChurnStatsByPlan(startDate, endDate)
        return results.map { row ->
            mapOf(
                "planId" to row[0] as UUID,
                "planName" to "Plan", // Would need to join with plans table for actual name
                "totalMembers" to (row[1] as Number).toLong(),
                "churnedMembers" to (row[2] as Number).toLong()
            )
        }
    }

    override fun findDueForBilling(fromDate: LocalDate, toDate: LocalDate): List<Subscription> =
        springDataRepository.findDueForBilling(fromDate, toDate)
}