package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MembershipPlan
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for membership plan persistence operations.
 */
interface MembershipPlanRepository {
    fun save(plan: MembershipPlan): MembershipPlan
    fun findById(id: UUID): Optional<MembershipPlan>
    fun findAll(): List<MembershipPlan>
    fun findAllActive(): List<MembershipPlan>
    fun deleteById(id: UUID)
}
