package com.liyaqa.platform.api.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.platform.application.commands.ChangeSubscriptionPlanCommand
import com.liyaqa.platform.application.commands.CreateClientSubscriptionCommand
import com.liyaqa.platform.application.commands.RenewSubscriptionCommand
import com.liyaqa.platform.application.commands.UpdateClientSubscriptionCommand
import com.liyaqa.platform.application.services.SubscriptionStats
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.ClientSubscription
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.Future
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

data class CreateClientSubscriptionRequest(
    @field:NotNull(message = "Organization ID is required")
    val organizationId: UUID,

    @field:NotNull(message = "Client plan ID is required")
    val clientPlanId: UUID,

    @field:NotNull(message = "Agreed price is required")
    @field:Positive(message = "Agreed price must be positive")
    val agreedPriceAmount: BigDecimal,

    val agreedPriceCurrency: String = "SAR",

    val billingCycle: BillingCycle = BillingCycle.MONTHLY,

    @field:Positive(message = "Contract months must be positive")
    val contractMonths: Int? = 12,

    val startWithTrial: Boolean? = false,

    @field:Positive(message = "Trial days must be positive")
    val trialDays: Int? = 14,

    @field:PositiveOrZero(message = "Discount percentage must be zero or positive")
    @field:Max(value = 100, message = "Discount percentage cannot exceed 100")
    val discountPercentage: BigDecimal? = null,

    val autoRenew: Boolean = true,

    val salesRepId: UUID? = null,

    val dealId: UUID? = null,

    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand() = CreateClientSubscriptionCommand(
        organizationId = organizationId,
        clientPlanId = clientPlanId,
        agreedPrice = Money(agreedPriceAmount, agreedPriceCurrency),
        billingCycle = billingCycle,
        contractMonths = contractMonths ?: 12,
        startWithTrial = startWithTrial ?: false,
        trialDays = trialDays ?: 14,
        discountPercentage = discountPercentage,
        autoRenew = autoRenew,
        salesRepId = salesRepId,
        dealId = dealId,
        notes = if (notesEn != null) LocalizedText(en = notesEn, ar = notesAr) else null
    )
}

data class UpdateClientSubscriptionRequest(
    @field:Positive(message = "Agreed price must be positive")
    val agreedPriceAmount: BigDecimal? = null,

    val agreedPriceCurrency: String? = null,

    val billingCycle: BillingCycle? = null,

    @field:PositiveOrZero(message = "Discount percentage must be zero or positive")
    @field:Max(value = 100, message = "Discount percentage cannot exceed 100")
    val discountPercentage: BigDecimal? = null,

    val autoRenew: Boolean? = null,

    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand(): UpdateClientSubscriptionCommand {
        val agreedPrice = if (agreedPriceAmount != null) {
            Money(agreedPriceAmount, agreedPriceCurrency ?: "SAR")
        } else null

        val notes = if (notesEn != null) {
            LocalizedText(en = notesEn, ar = notesAr)
        } else null

        return UpdateClientSubscriptionCommand(
            agreedPrice = agreedPrice,
            billingCycle = billingCycle,
            discountPercentage = discountPercentage,
            autoRenew = autoRenew,
            notes = notes
        )
    }
}

data class ChangeSubscriptionPlanRequest(
    @field:NotNull(message = "New plan ID is required")
    val newPlanId: UUID,

    @field:NotNull(message = "New agreed price is required")
    @field:Positive(message = "New agreed price must be positive")
    val newAgreedPriceAmount: BigDecimal,

    val newAgreedPriceCurrency: String = "SAR",

    @field:Positive(message = "Contract months must be positive")
    val newContractMonths: Int? = null
) {
    fun toCommand() = ChangeSubscriptionPlanCommand(
        newPlanId = newPlanId,
        newAgreedPrice = Money(newAgreedPriceAmount, newAgreedPriceCurrency),
        newContractMonths = newContractMonths
    )
}

data class RenewSubscriptionRequest(
    @field:NotNull(message = "New end date is required")
    @field:Future(message = "New end date must be in the future")
    val newEndDate: LocalDate,

    @field:Positive(message = "New agreed price must be positive")
    val newAgreedPriceAmount: BigDecimal? = null,

    val newAgreedPriceCurrency: String? = null
) {
    fun toCommand(): RenewSubscriptionCommand {
        val newAgreedPrice = if (newAgreedPriceAmount != null) {
            Money(newAgreedPriceAmount, newAgreedPriceCurrency ?: "SAR")
        } else null

        return RenewSubscriptionCommand(
            newEndDate = newEndDate,
            newAgreedPrice = newAgreedPrice
        )
    }
}

// ============================================
// Response DTOs
// ============================================

data class ClientSubscriptionResponse(
    val id: UUID,
    val organizationId: UUID,
    val clientPlanId: UUID,
    val status: ClientSubscriptionStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val trialEndsAt: LocalDate?,
    val agreedPrice: MoneyResponse,
    val effectiveMonthlyPrice: MoneyResponse,
    val discountPercentage: BigDecimal?,
    val contractMonths: Int,
    val billingCycle: BillingCycle,
    val autoRenew: Boolean,
    val salesRepId: UUID?,
    val dealId: UUID?,
    val notes: LocalizedTextResponse?,

    // Calculated fields
    @get:JsonProperty("isActive")
    val isActive: Boolean,
    @get:JsonProperty("isInTrial")
    val isInTrial: Boolean,
    @get:JsonProperty("isExpired")
    val isExpired: Boolean,
    val remainingDays: Long,
    val remainingTrialDays: Long?,

    // Timestamps
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(subscription: ClientSubscription) = ClientSubscriptionResponse(
            id = subscription.id,
            organizationId = subscription.organizationId,
            clientPlanId = subscription.clientPlanId,
            status = subscription.status,
            startDate = subscription.startDate,
            endDate = subscription.endDate,
            trialEndsAt = subscription.trialEndsAt,
            agreedPrice = MoneyResponse.from(subscription.agreedPrice),
            effectiveMonthlyPrice = MoneyResponse.from(subscription.getEffectiveMonthlyPrice()),
            discountPercentage = subscription.discountPercentage,
            contractMonths = subscription.contractMonths,
            billingCycle = subscription.billingCycle,
            autoRenew = subscription.autoRenew,
            salesRepId = subscription.salesRepId,
            dealId = subscription.dealId,
            notes = subscription.notes?.let { LocalizedTextResponse.from(it) },
            isActive = subscription.isActive(),
            isInTrial = subscription.isInTrial(),
            isExpired = subscription.isExpired(),
            remainingDays = subscription.getRemainingDays(),
            remainingTrialDays = subscription.getRemainingTrialDays(),
            createdAt = subscription.createdAt,
            updatedAt = subscription.updatedAt
        )
    }
}

/**
 * Simplified subscription response for listings.
 */
data class ClientSubscriptionSummaryResponse(
    val id: UUID,
    val organizationId: UUID,
    val clientPlanId: UUID,
    val status: ClientSubscriptionStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val agreedPrice: MoneyResponse,
    val remainingDays: Long
) {
    companion object {
        fun from(subscription: ClientSubscription) = ClientSubscriptionSummaryResponse(
            id = subscription.id,
            organizationId = subscription.organizationId,
            clientPlanId = subscription.clientPlanId,
            status = subscription.status,
            startDate = subscription.startDate,
            endDate = subscription.endDate,
            agreedPrice = MoneyResponse.from(subscription.agreedPrice),
            remainingDays = subscription.getRemainingDays()
        )
    }
}

/**
 * Response for subscription statistics.
 */
data class SubscriptionStatsResponse(
    val total: Long,
    val active: Long,
    val trial: Long,
    val suspended: Long,
    val cancelled: Long,
    val expired: Long
) {
    companion object {
        fun from(stats: SubscriptionStats) = SubscriptionStatsResponse(
            total = stats.total,
            active = stats.active,
            trial = stats.trial,
            suspended = stats.suspended,
            cancelled = stats.cancelled,
            expired = stats.expired
        )
    }
}
