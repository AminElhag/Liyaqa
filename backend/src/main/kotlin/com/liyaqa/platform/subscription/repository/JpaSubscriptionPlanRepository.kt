package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataSubscriptionPlanRepository : JpaRepository<SubscriptionPlan, UUID> {
    fun findByTier(tier: PlanTier): Optional<SubscriptionPlan>
    fun findByIsActiveTrue(): List<SubscriptionPlan>
    fun existsByTier(tier: PlanTier): Boolean
}

@Repository
class JpaSubscriptionPlanRepository(
    private val springDataRepository: SpringDataSubscriptionPlanRepository
) : SubscriptionPlanRepository {

    override fun save(plan: SubscriptionPlan): SubscriptionPlan =
        springDataRepository.save(plan)

    override fun findById(id: UUID): Optional<SubscriptionPlan> =
        springDataRepository.findById(id)

    override fun findAll(): List<SubscriptionPlan> =
        springDataRepository.findAll()

    override fun findByTier(tier: PlanTier): Optional<SubscriptionPlan> =
        springDataRepository.findByTier(tier)

    override fun findByIsActiveTrue(): List<SubscriptionPlan> =
        springDataRepository.findByIsActiveTrue()

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsByTier(tier: PlanTier): Boolean =
        springDataRepository.existsByTier(tier)
}
