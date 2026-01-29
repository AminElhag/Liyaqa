package com.liyaqa.platform.api.dto

import com.liyaqa.platform.domain.model.ClientPlan
import java.util.UUID

/**
 * Public DTO for displaying client plans on the landing page.
 * Contains only the information needed for public pricing display.
 * No sensitive or internal data is exposed.
 */
data class PublicClientPlanDto(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val monthlyPrice: MoneyResponse,
    val annualPrice: MoneyResponse,
    val maxMembers: Int,
    val maxLocationsPerClub: Int,
    val maxClubs: Int,
    val maxStaffUsers: Int,
    val sortOrder: Int,
    val features: Map<String, Boolean>,
    val effectiveMonthlyPriceAnnual: MoneyResponse,
    val annualSavingsPercent: Int
) {
    companion object {
        fun from(plan: ClientPlan): PublicClientPlanDto {
            // Calculate annual savings percentage
            val monthlyTotal = plan.monthlyPrice.amount * 12.toBigDecimal()
            val savingsPercent = if (monthlyTotal > java.math.BigDecimal.ZERO) {
                ((monthlyTotal - plan.annualPrice.amount) * 100.toBigDecimal() / monthlyTotal)
                    .toInt()
            } else {
                0
            }

            return PublicClientPlanDto(
                id = plan.id,
                name = LocalizedTextResponse.from(plan.name),
                description = plan.description?.let { LocalizedTextResponse.from(it) },
                monthlyPrice = MoneyResponse.from(plan.monthlyPrice),
                annualPrice = MoneyResponse.from(plan.annualPrice),
                maxMembers = plan.maxMembers,
                maxLocationsPerClub = plan.maxLocationsPerClub,
                maxClubs = plan.maxClubs,
                maxStaffUsers = plan.maxStaffUsers,
                sortOrder = plan.sortOrder,
                features = plan.getAllFeatures(),
                effectiveMonthlyPriceAnnual = MoneyResponse.from(
                    plan.getEffectiveMonthlyPrice(com.liyaqa.platform.domain.model.BillingCycle.ANNUAL)
                ),
                annualSavingsPercent = savingsPercent
            )
        }
    }
}
