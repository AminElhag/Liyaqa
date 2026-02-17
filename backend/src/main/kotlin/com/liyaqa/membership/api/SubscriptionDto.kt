package com.liyaqa.membership.api

import com.liyaqa.membership.application.commands.CreateSubscriptionCommand
import com.liyaqa.membership.application.commands.RenewSubscriptionCommand
import com.liyaqa.membership.application.commands.TransferSubscriptionCommand
import com.liyaqa.membership.application.commands.UpdateSubscriptionCommand
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.organization.api.LocalizedTextResponse
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// === Request DTOs ===

data class CreateSubscriptionRequest(
    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    @field:NotNull(message = "Plan ID is required")
    val planId: UUID,

    val startDate: LocalDate? = null,

    val autoRenew: Boolean = false,

    @field:Positive(message = "Amount must be positive")
    val paidAmount: BigDecimal? = null,

    val paidCurrency: String = "SAR",

    val notes: String? = null
) {
    fun toCommand() = CreateSubscriptionCommand(
        memberId = memberId,
        planId = planId,
        startDate = startDate ?: LocalDate.now(),
        autoRenew = autoRenew,
        paidAmount = paidAmount?.let { Money(it, paidCurrency) },
        notes = notes
    )
}

data class UpdateSubscriptionRequest(
    val autoRenew: Boolean? = null,
    val notes: String? = null
) {
    fun toCommand() = UpdateSubscriptionCommand(
        autoRenew = autoRenew,
        notes = notes
    )
}

data class RenewSubscriptionRequest(
    val newEndDate: LocalDate? = null,

    @field:Positive(message = "Amount must be positive")
    val paidAmount: BigDecimal? = null,

    val paidCurrency: String = "SAR"
) {
    fun toCommand() = RenewSubscriptionCommand(
        newEndDate = newEndDate,
        paidAmount = paidAmount?.let { Money(it, paidCurrency) }
    )
}

data class TransferSubscriptionRequest(
    @field:NotNull(message = "Target member ID is required")
    val targetMemberId: UUID,
    val reason: String? = null
) {
    fun toCommand() = TransferSubscriptionCommand(
        targetMemberId = targetMemberId,
        reason = reason
    )
}

// === Response DTOs ===

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

data class SubscriptionResponse(
    val id: UUID,
    val memberId: UUID,
    val planId: UUID,
    val planName: LocalizedTextResponse?,
    val status: SubscriptionStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val autoRenew: Boolean,
    val paidAmount: MoneyResponse?,
    val classesRemaining: Int?,
    val guestPassesRemaining: Int,
    val freezeDaysRemaining: Int,
    val frozenAt: LocalDate?,
    val notes: String?,
    val isActive: Boolean,
    val daysRemaining: Long,
    val invoiceId: UUID? = null,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(subscription: Subscription, plan: MembershipPlan? = null, invoiceId: UUID? = null) = SubscriptionResponse(
            id = subscription.id,
            memberId = subscription.memberId,
            planId = subscription.planId,
            planName = plan?.let { LocalizedTextResponse.from(it.name) },
            status = subscription.status,
            startDate = subscription.startDate,
            endDate = subscription.endDate,
            autoRenew = subscription.autoRenew,
            paidAmount = MoneyResponse.fromNullable(subscription.paidAmount),
            classesRemaining = subscription.classesRemaining,
            guestPassesRemaining = subscription.guestPassesRemaining,
            freezeDaysRemaining = subscription.freezeDaysRemaining,
            frozenAt = subscription.frozenAt,
            notes = subscription.notes,
            isActive = subscription.isActive(),
            daysRemaining = subscription.daysRemaining(),
            invoiceId = invoiceId,
            createdAt = subscription.createdAt,
            updatedAt = subscription.updatedAt
        )
    }
}