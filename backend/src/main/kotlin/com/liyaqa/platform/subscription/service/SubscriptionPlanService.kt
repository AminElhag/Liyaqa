package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.CreateSubscriptionPlanCommand
import com.liyaqa.platform.subscription.dto.SubscriptionPlanResponse
import com.liyaqa.platform.subscription.dto.UpdateSubscriptionPlanCommand
import com.liyaqa.platform.subscription.exception.DuplicatePlanTierException
import com.liyaqa.platform.subscription.exception.SubscriptionPlanNotFoundException
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class SubscriptionPlanService(
    private val subscriptionPlanRepository: SubscriptionPlanRepository
) {

    fun createPlan(cmd: CreateSubscriptionPlanCommand): SubscriptionPlan {
        if (subscriptionPlanRepository.existsByTier(cmd.tier)) {
            throw DuplicatePlanTierException(cmd.tier)
        }

        val plan = SubscriptionPlan.create(
            name = cmd.name,
            tier = cmd.tier,
            monthlyPriceAmount = cmd.monthlyPriceAmount,
            annualPriceAmount = cmd.annualPriceAmount
        ).apply {
            nameAr = cmd.nameAr
            description = cmd.description
            descriptionAr = cmd.descriptionAr
            monthlyPriceCurrency = cmd.monthlyPriceCurrency
            annualPriceCurrency = cmd.annualPriceCurrency
            maxClubs = cmd.maxClubs
            maxLocationsPerClub = cmd.maxLocationsPerClub
            maxMembers = cmd.maxMembers
            maxStaffUsers = cmd.maxStaffUsers
            features = cmd.features.toMutableMap()
            sortOrder = cmd.sortOrder
        }

        return subscriptionPlanRepository.save(plan)
    }

    fun updatePlan(id: UUID, cmd: UpdateSubscriptionPlanCommand): SubscriptionPlan {
        val plan = subscriptionPlanRepository.findById(id)
            .orElseThrow { SubscriptionPlanNotFoundException(id) }

        cmd.name?.let { plan.name = it }
        cmd.nameAr?.let { plan.nameAr = it }
        cmd.description?.let { plan.description = it }
        cmd.descriptionAr?.let { plan.descriptionAr = it }
        cmd.monthlyPriceAmount?.let { plan.monthlyPriceAmount = it }
        cmd.monthlyPriceCurrency?.let { plan.monthlyPriceCurrency = it }
        cmd.annualPriceAmount?.let { plan.annualPriceAmount = it }
        cmd.annualPriceCurrency?.let { plan.annualPriceCurrency = it }
        cmd.maxClubs?.let { plan.maxClubs = it }
        cmd.maxLocationsPerClub?.let { plan.maxLocationsPerClub = it }
        cmd.maxMembers?.let { plan.maxMembers = it }
        cmd.maxStaffUsers?.let { plan.maxStaffUsers = it }
        cmd.features?.let { plan.updateFeatures(it) }
        cmd.sortOrder?.let { plan.sortOrder = it }

        return subscriptionPlanRepository.save(plan)
    }

    @Transactional(readOnly = true)
    fun getPlan(id: UUID): SubscriptionPlan =
        subscriptionPlanRepository.findById(id)
            .orElseThrow { SubscriptionPlanNotFoundException(id) }

    @Transactional(readOnly = true)
    fun listPlans(activeOnly: Boolean): List<SubscriptionPlan> =
        if (activeOnly) subscriptionPlanRepository.findByIsActiveTrue()
        else subscriptionPlanRepository.findAll()

    fun deletePlan(id: UUID): SubscriptionPlan {
        val plan = subscriptionPlanRepository.findById(id)
            .orElseThrow { SubscriptionPlanNotFoundException(id) }
        plan.deactivate()
        return subscriptionPlanRepository.save(plan)
    }

    @Transactional(readOnly = true)
    fun comparePlans(planIds: List<UUID>): List<SubscriptionPlan> =
        planIds.map { id ->
            subscriptionPlanRepository.findById(id)
                .orElseThrow { SubscriptionPlanNotFoundException(id) }
        }
}
