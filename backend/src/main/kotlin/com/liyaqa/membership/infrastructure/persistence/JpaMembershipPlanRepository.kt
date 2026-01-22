package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataMembershipPlanRepository : JpaRepository<MembershipPlan, UUID> {
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<MembershipPlan>
    fun existsByNameEn(nameEn: String): Boolean

    /**
     * Find plans that are currently available:
     * - Active (isActive = true)
     * - Either no start date or start date is on or before today
     * - Either no end date or end date is on or after today
     */
    @Query("""
        SELECT p FROM MembershipPlan p
        WHERE p.isActive = true
        AND (p.availableFrom IS NULL OR p.availableFrom <= :today)
        AND (p.availableUntil IS NULL OR p.availableUntil >= :today)
    """)
    fun findAvailablePlans(@Param("today") today: LocalDate, pageable: Pageable): Page<MembershipPlan>

    /**
     * Find plans that have passed their availability end date.
     */
    fun findByAvailableUntilBeforeAndIsActive(date: LocalDate, isActive: Boolean): List<MembershipPlan>
}

@Repository
class JpaMembershipPlanRepository(
    private val springDataRepository: SpringDataMembershipPlanRepository
) : MembershipPlanRepository {

    override fun save(plan: MembershipPlan): MembershipPlan =
        springDataRepository.save(plan)

    override fun findById(id: UUID): Optional<MembershipPlan> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<MembershipPlan> =
        springDataRepository.findAll(pageable)

    override fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<MembershipPlan> =
        springDataRepository.findByIsActive(isActive, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsByNameEn(nameEn: String): Boolean =
        springDataRepository.existsByNameEn(nameEn)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findAvailablePlans(today: LocalDate, pageable: Pageable): Page<MembershipPlan> =
        springDataRepository.findAvailablePlans(today, pageable)

    override fun findByAvailableUntilBeforeAndIsActive(date: LocalDate, isActive: Boolean): List<MembershipPlan> =
        springDataRepository.findByAvailableUntilBeforeAndIsActive(date, isActive)
}
