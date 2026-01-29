package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.PlanChangeHistory
import com.liyaqa.membership.domain.model.PlanChangeType
import com.liyaqa.membership.domain.ports.PlanChangeHistoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataPlanChangeHistoryRepository : JpaRepository<PlanChangeHistory, UUID> {
    fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<PlanChangeHistory>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PlanChangeHistory>

    fun findByChangeType(type: PlanChangeType, pageable: Pageable): Page<PlanChangeHistory>

    @Query("SELECT h FROM PlanChangeHistory h WHERE h.effectiveDate BETWEEN :startDate AND :endDate")
    fun findByEffectiveDateBetween(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        pageable: Pageable
    ): Page<PlanChangeHistory>

    @Query("SELECT COUNT(h) FROM PlanChangeHistory h WHERE h.changeType = :type AND h.effectiveDate BETWEEN :startDate AND :endDate")
    fun countByChangeTypeAndEffectiveDateBetween(
        @Param("type") type: PlanChangeType,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): Long

    @Query("SELECT h FROM PlanChangeHistory h WHERE h.subscriptionId = :subscriptionId ORDER BY h.requestedAt DESC LIMIT 1")
    fun findLatestBySubscriptionId(@Param("subscriptionId") subscriptionId: UUID): Optional<PlanChangeHistory>
}

@Repository
class JpaPlanChangeHistoryRepository(
    private val springDataRepository: SpringDataPlanChangeHistoryRepository
) : PlanChangeHistoryRepository {

    override fun save(history: PlanChangeHistory): PlanChangeHistory =
        springDataRepository.save(history)

    override fun findById(id: UUID): Optional<PlanChangeHistory> =
        springDataRepository.findById(id)

    override fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<PlanChangeHistory> =
        springDataRepository.findBySubscriptionId(subscriptionId, pageable)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PlanChangeHistory> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByChangeType(type: PlanChangeType, pageable: Pageable): Page<PlanChangeHistory> =
        springDataRepository.findByChangeType(type, pageable)

    override fun findAll(pageable: Pageable): Page<PlanChangeHistory> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findByEffectiveDateBetween(
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<PlanChangeHistory> =
        springDataRepository.findByEffectiveDateBetween(startDate, endDate, pageable)

    override fun countByChangeTypeAndEffectiveDateBetween(
        type: PlanChangeType,
        startDate: LocalDate,
        endDate: LocalDate
    ): Long =
        springDataRepository.countByChangeTypeAndEffectiveDateBetween(type, startDate, endDate)

    override fun findLatestBySubscriptionId(subscriptionId: UUID): Optional<PlanChangeHistory> =
        springDataRepository.findLatestBySubscriptionId(subscriptionId)
}
