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

    @Query("SELECT COUNT(s) > 0 FROM Subscription s WHERE s.memberId = :memberId AND s.status = 'ACTIVE' AND s.endDate >= CURRENT_DATE")
    fun existsActiveByMemberId(@Param("memberId") memberId: UUID): Boolean

    fun countByMemberId(memberId: UUID): Long
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
}