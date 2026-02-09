package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import java.util.Optional
import java.util.UUID

interface SubscriptionPlanRepository {
    fun save(plan: SubscriptionPlan): SubscriptionPlan
    fun findById(id: UUID): Optional<SubscriptionPlan>
    fun findAll(): List<SubscriptionPlan>
    fun findByTier(tier: PlanTier): Optional<SubscriptionPlan>
    fun findByIsActiveTrue(): List<SubscriptionPlan>
    fun deleteById(id: UUID)
    fun existsByTier(tier: PlanTier): Boolean
}
