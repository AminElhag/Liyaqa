package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataMembershipPlanRepository : JpaRepository<MembershipPlan, UUID> {
    @Query("SELECT p FROM MembershipPlan p WHERE p.isActive = true ORDER BY p.sortOrder")
    fun findAllActive(): List<MembershipPlan>
}

@Repository
class JpaMembershipPlanRepository(
    private val springDataRepository: SpringDataMembershipPlanRepository
) : MembershipPlanRepository {

    override fun save(plan: MembershipPlan): MembershipPlan {
        return springDataRepository.save(plan)
    }

    override fun findById(id: UUID): Optional<MembershipPlan> {
        return springDataRepository.findById(id)
    }

    override fun findAll(): List<MembershipPlan> {
        return springDataRepository.findAll()
    }

    override fun findAllActive(): List<MembershipPlan> {
        return springDataRepository.findAllActive()
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }
}
