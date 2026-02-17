package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.MembershipPlanStatus
import com.liyaqa.membership.domain.model.MembershipPlanType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for MembershipPlan entity.
 * MembershipPlans are tenant-scoped (belong to a club).
 */
interface MembershipPlanRepository {
    fun save(plan: MembershipPlan): MembershipPlan
    fun findById(id: UUID): Optional<MembershipPlan>
    fun findAll(pageable: Pageable): Page<MembershipPlan>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<MembershipPlan>
    fun findByStatus(status: MembershipPlanStatus, pageable: Pageable): Page<MembershipPlan>
    fun findByPlanType(planType: MembershipPlanType, pageable: Pageable): Page<MembershipPlan>
    fun countByStatus(status: MembershipPlanStatus): Long
    fun existsById(id: UUID): Boolean
    fun existsByNameEn(nameEn: String): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find plans that are currently available (active and within date range).
     */
    fun findAvailablePlans(today: LocalDate, pageable: Pageable): Page<MembershipPlan>

    /**
     * Find plans that have passed their availability end date and are still active.
     * Used by the scheduled job to auto-deactivate expired plans.
     */
    fun findByAvailableUntilBeforeAndIsActive(date: LocalDate, isActive: Boolean): List<MembershipPlan>
}