package com.liyaqa.platform.subscription.dto

import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ── Commands ────────────────────────────────────────────────────────────────

data class CreateSubscriptionPlanCommand(
    val name: String,
    val nameAr: String?,
    val description: String?,
    val descriptionAr: String?,
    val tier: PlanTier,
    val monthlyPriceAmount: BigDecimal,
    val monthlyPriceCurrency: String,
    val annualPriceAmount: BigDecimal,
    val annualPriceCurrency: String,
    val maxClubs: Int,
    val maxLocationsPerClub: Int,
    val maxMembers: Int,
    val maxStaffUsers: Int,
    val features: Map<String, Boolean>,
    val sortOrder: Int
)

data class UpdateSubscriptionPlanCommand(
    val name: String?,
    val nameAr: String?,
    val description: String?,
    val descriptionAr: String?,
    val monthlyPriceAmount: BigDecimal?,
    val monthlyPriceCurrency: String?,
    val annualPriceAmount: BigDecimal?,
    val annualPriceCurrency: String?,
    val maxClubs: Int?,
    val maxLocationsPerClub: Int?,
    val maxMembers: Int?,
    val maxStaffUsers: Int?,
    val features: Map<String, Boolean>?,
    val sortOrder: Int?
)

// ── Requests ────────────────────────────────────────────────────────────────

data class CreateSubscriptionPlanRequest(
    val name: String,
    val nameAr: String? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val tier: PlanTier,
    val monthlyPriceAmount: BigDecimal,
    val monthlyPriceCurrency: String = "SAR",
    val annualPriceAmount: BigDecimal,
    val annualPriceCurrency: String = "SAR",
    val maxClubs: Int = 1,
    val maxLocationsPerClub: Int = 1,
    val maxMembers: Int = 100,
    val maxStaffUsers: Int = 5,
    val features: Map<String, Boolean> = emptyMap(),
    val sortOrder: Int = 0
) {
    fun toCommand() = CreateSubscriptionPlanCommand(
        name = name,
        nameAr = nameAr,
        description = description,
        descriptionAr = descriptionAr,
        tier = tier,
        monthlyPriceAmount = monthlyPriceAmount,
        monthlyPriceCurrency = monthlyPriceCurrency,
        annualPriceAmount = annualPriceAmount,
        annualPriceCurrency = annualPriceCurrency,
        maxClubs = maxClubs,
        maxLocationsPerClub = maxLocationsPerClub,
        maxMembers = maxMembers,
        maxStaffUsers = maxStaffUsers,
        features = features,
        sortOrder = sortOrder
    )
}

data class UpdateSubscriptionPlanRequest(
    val name: String? = null,
    val nameAr: String? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val monthlyPriceAmount: BigDecimal? = null,
    val monthlyPriceCurrency: String? = null,
    val annualPriceAmount: BigDecimal? = null,
    val annualPriceCurrency: String? = null,
    val maxClubs: Int? = null,
    val maxLocationsPerClub: Int? = null,
    val maxMembers: Int? = null,
    val maxStaffUsers: Int? = null,
    val features: Map<String, Boolean>? = null,
    val sortOrder: Int? = null
) {
    fun toCommand() = UpdateSubscriptionPlanCommand(
        name = name,
        nameAr = nameAr,
        description = description,
        descriptionAr = descriptionAr,
        monthlyPriceAmount = monthlyPriceAmount,
        monthlyPriceCurrency = monthlyPriceCurrency,
        annualPriceAmount = annualPriceAmount,
        annualPriceCurrency = annualPriceCurrency,
        maxClubs = maxClubs,
        maxLocationsPerClub = maxLocationsPerClub,
        maxMembers = maxMembers,
        maxStaffUsers = maxStaffUsers,
        features = features,
        sortOrder = sortOrder
    )
}

// ── Responses ───────────────────────────────────────────────────────────────

data class SubscriptionPlanResponse(
    val id: UUID,
    val name: String,
    val nameAr: String?,
    val description: String?,
    val descriptionAr: String?,
    val tier: PlanTier,
    val monthlyPriceAmount: BigDecimal,
    val monthlyPriceCurrency: String,
    val annualPriceAmount: BigDecimal,
    val annualPriceCurrency: String,
    val maxClubs: Int,
    val maxLocationsPerClub: Int,
    val maxMembers: Int,
    val maxStaffUsers: Int,
    val features: Map<String, Boolean>,
    val isActive: Boolean,
    val sortOrder: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(plan: SubscriptionPlan) = SubscriptionPlanResponse(
            id = plan.id,
            name = plan.name,
            nameAr = plan.nameAr,
            description = plan.description,
            descriptionAr = plan.descriptionAr,
            tier = plan.tier,
            monthlyPriceAmount = plan.monthlyPriceAmount,
            monthlyPriceCurrency = plan.monthlyPriceCurrency,
            annualPriceAmount = plan.annualPriceAmount,
            annualPriceCurrency = plan.annualPriceCurrency,
            maxClubs = plan.maxClubs,
            maxLocationsPerClub = plan.maxLocationsPerClub,
            maxMembers = plan.maxMembers,
            maxStaffUsers = plan.maxStaffUsers,
            features = plan.getAllFeatures(),
            isActive = plan.isActive,
            sortOrder = plan.sortOrder,
            createdAt = plan.createdAt,
            updatedAt = plan.updatedAt
        )
    }
}

data class PlanComparisonResponse(
    val plans: List<SubscriptionPlanResponse>
)
