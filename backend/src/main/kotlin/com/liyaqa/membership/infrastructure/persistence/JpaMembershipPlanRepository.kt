package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataMembershipPlanRepository : JpaRepository<MembershipPlan, UUID> {
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<MembershipPlan>
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

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()
}