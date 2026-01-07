package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MembershipPlan
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
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
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
}