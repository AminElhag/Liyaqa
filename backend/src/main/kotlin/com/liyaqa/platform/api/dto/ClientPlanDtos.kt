package com.liyaqa.platform.api.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.platform.application.commands.CreateClientPlanCommand
import com.liyaqa.platform.application.commands.UpdateClientPlanCommand
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.ClientPlan
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ============================================
// Common DTOs
// ============================================

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(text.en, text.ar)
        fun fromNullable(text: LocalizedText?) = text?.let { from(it) }
    }
}

data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String
) {
    companion object {
        fun from(money: Money) = MoneyResponse(
            amount = money.amount,
            currency = money.currency
        )

        fun fromNullable(money: Money?) = money?.let { from(it) }
    }
}

// ============================================
// Request DTOs
// ============================================

data class CreateClientPlanRequest(
    @field:NotBlank(message = "Plan name (English) is required")
    val nameEn: String,

    val nameAr: String? = null,

    val descriptionEn: String? = null,

    val descriptionAr: String? = null,

    @field:NotNull(message = "Monthly price is required")
    @field:Positive(message = "Monthly price must be positive")
    val monthlyPriceAmount: BigDecimal,

    val monthlyPriceCurrency: String = "SAR",

    @field:NotNull(message = "Annual price is required")
    @field:Positive(message = "Annual price must be positive")
    val annualPriceAmount: BigDecimal,

    val annualPriceCurrency: String = "SAR",

    val billingCycle: BillingCycle? = null,

    @field:Positive(message = "Max clubs must be positive")
    val maxClubs: Int? = null,

    @field:Positive(message = "Max locations per club must be positive")
    val maxLocationsPerClub: Int? = null,

    @field:Positive(message = "Max members must be positive")
    val maxMembers: Int? = null,

    @field:Positive(message = "Max staff users must be positive")
    val maxStaffUsers: Int? = null,

    val hasAdvancedReporting: Boolean? = null,

    val hasApiAccess: Boolean? = null,

    val hasPrioritySupport: Boolean? = null,

    val hasWhiteLabeling: Boolean? = null,

    val hasCustomIntegrations: Boolean? = null,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int? = null
) {
    fun toCommand() = CreateClientPlanCommand(
        name = LocalizedText(en = nameEn, ar = nameAr),
        description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null,
        monthlyPrice = Money(monthlyPriceAmount, monthlyPriceCurrency),
        annualPrice = Money(annualPriceAmount, annualPriceCurrency),
        billingCycle = billingCycle ?: BillingCycle.MONTHLY,
        maxClubs = maxClubs ?: 1,
        maxLocationsPerClub = maxLocationsPerClub ?: 1,
        maxMembers = maxMembers ?: 100,
        maxStaffUsers = maxStaffUsers ?: 5,
        hasAdvancedReporting = hasAdvancedReporting ?: false,
        hasApiAccess = hasApiAccess ?: false,
        hasPrioritySupport = hasPrioritySupport ?: false,
        hasWhiteLabeling = hasWhiteLabeling ?: false,
        hasCustomIntegrations = hasCustomIntegrations ?: false,
        sortOrder = sortOrder ?: 0
    )
}

data class UpdateClientPlanRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,

    @field:Positive(message = "Monthly price must be positive")
    val monthlyPriceAmount: BigDecimal? = null,

    val monthlyPriceCurrency: String? = null,

    @field:Positive(message = "Annual price must be positive")
    val annualPriceAmount: BigDecimal? = null,

    val annualPriceCurrency: String? = null,

    val billingCycle: BillingCycle? = null,

    @field:Positive(message = "Max clubs must be positive")
    val maxClubs: Int? = null,

    @field:Positive(message = "Max locations per club must be positive")
    val maxLocationsPerClub: Int? = null,

    @field:Positive(message = "Max members must be positive")
    val maxMembers: Int? = null,

    @field:Positive(message = "Max staff users must be positive")
    val maxStaffUsers: Int? = null,

    val hasAdvancedReporting: Boolean? = null,
    val hasApiAccess: Boolean? = null,
    val hasPrioritySupport: Boolean? = null,
    val hasWhiteLabeling: Boolean? = null,
    val hasCustomIntegrations: Boolean? = null,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int? = null
) {
    fun toCommand(): UpdateClientPlanCommand {
        val name = if (nameEn != null) LocalizedText(en = nameEn, ar = nameAr) else null
        val description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null
        val monthlyPrice = if (monthlyPriceAmount != null) Money(monthlyPriceAmount, monthlyPriceCurrency ?: "SAR") else null
        val annualPrice = if (annualPriceAmount != null) Money(annualPriceAmount, annualPriceCurrency ?: "SAR") else null

        return UpdateClientPlanCommand(
            name = name,
            description = description,
            monthlyPrice = monthlyPrice,
            annualPrice = annualPrice,
            billingCycle = billingCycle,
            maxClubs = maxClubs,
            maxLocationsPerClub = maxLocationsPerClub,
            maxMembers = maxMembers,
            maxStaffUsers = maxStaffUsers,
            hasAdvancedReporting = hasAdvancedReporting,
            hasApiAccess = hasApiAccess,
            hasPrioritySupport = hasPrioritySupport,
            hasWhiteLabeling = hasWhiteLabeling,
            hasCustomIntegrations = hasCustomIntegrations,
            sortOrder = sortOrder
        )
    }
}

// ============================================
// Response DTOs
// ============================================

data class ClientPlanResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val monthlyPrice: MoneyResponse,
    val annualPrice: MoneyResponse,
    val billingCycle: BillingCycle,

    // Usage limits
    val maxClubs: Int,
    val maxLocationsPerClub: Int,
    val maxMembers: Int,
    val maxStaffUsers: Int,

    // Feature flags
    val hasAdvancedReporting: Boolean,
    val hasApiAccess: Boolean,
    val hasPrioritySupport: Boolean,
    val hasWhiteLabeling: Boolean,
    val hasCustomIntegrations: Boolean,

    // Status
    @get:JsonProperty("isActive")
    val isActive: Boolean,
    val sortOrder: Int,

    // Calculated fields
    val annualSavingsAmount: BigDecimal,
    val effectiveMonthlyPriceAnnual: MoneyResponse,

    // Timestamps
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(plan: ClientPlan) = ClientPlanResponse(
            id = plan.id,
            name = LocalizedTextResponse.from(plan.name),
            description = plan.description?.let { LocalizedTextResponse.from(it) },
            monthlyPrice = MoneyResponse.from(plan.monthlyPrice),
            annualPrice = MoneyResponse.from(plan.annualPrice),
            billingCycle = plan.billingCycle,
            maxClubs = plan.maxClubs,
            maxLocationsPerClub = plan.maxLocationsPerClub,
            maxMembers = plan.maxMembers,
            maxStaffUsers = plan.maxStaffUsers,
            hasAdvancedReporting = plan.hasAdvancedReporting,
            hasApiAccess = plan.hasApiAccess,
            hasPrioritySupport = plan.hasPrioritySupport,
            hasWhiteLabeling = plan.hasWhiteLabeling,
            hasCustomIntegrations = plan.hasCustomIntegrations,
            isActive = plan.isActive,
            sortOrder = plan.sortOrder,
            annualSavingsAmount = plan.getAnnualSavings().amount,
            effectiveMonthlyPriceAnnual = MoneyResponse.from(plan.getEffectiveMonthlyPrice(BillingCycle.ANNUAL)),
            createdAt = plan.createdAt,
            updatedAt = plan.updatedAt
        )
    }
}

/**
 * Simplified response for listing plans (used in dropdowns, etc.)
 */
data class ClientPlanSummaryResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val monthlyPrice: MoneyResponse,
    val annualPrice: MoneyResponse,
    @get:JsonProperty("isActive")
    val isActive: Boolean
) {
    companion object {
        fun from(plan: ClientPlan) = ClientPlanSummaryResponse(
            id = plan.id,
            name = LocalizedTextResponse.from(plan.name),
            monthlyPrice = MoneyResponse.from(plan.monthlyPrice),
            annualPrice = MoneyResponse.from(plan.annualPrice),
            isActive = plan.isActive
        )
    }
}

// ============================================
// Page Response
// ============================================

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
