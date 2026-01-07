package com.liyaqa.membership.api

import com.liyaqa.membership.application.commands.CreateMembershipPlanCommand
import com.liyaqa.membership.application.commands.UpdateMembershipPlanCommand
import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.organization.api.LocalizedTextResponse
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// === Request DTOs ===

data class CreateMembershipPlanRequest(
    @field:NotBlank(message = "Plan name (English) is required")
    val nameEn: String,

    val nameAr: String? = null,

    val descriptionEn: String? = null,

    val descriptionAr: String? = null,

    @field:NotNull(message = "Price is required")
    @field:Positive(message = "Price must be positive")
    val priceAmount: BigDecimal,

    val priceCurrency: String = "SAR",

    val billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,

    @field:Positive(message = "Duration days must be positive")
    val durationDays: Int? = null,

    @field:Positive(message = "Max classes must be positive")
    val maxClassesPerPeriod: Int? = null,

    val hasGuestPasses: Boolean = false,

    @field:PositiveOrZero(message = "Guest passes count must be zero or positive")
    val guestPassesCount: Int = 0,

    val hasLockerAccess: Boolean = false,

    val hasSaunaAccess: Boolean = false,

    val hasPoolAccess: Boolean = false,

    @field:PositiveOrZero(message = "Freeze days must be zero or positive")
    val freezeDaysAllowed: Int = 0,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int = 0
) {
    fun toCommand() = CreateMembershipPlanCommand(
        name = LocalizedText(en = nameEn, ar = nameAr),
        description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null,
        price = Money(priceAmount, priceCurrency),
        billingPeriod = billingPeriod,
        durationDays = durationDays,
        maxClassesPerPeriod = maxClassesPerPeriod,
        hasGuestPasses = hasGuestPasses,
        guestPassesCount = guestPassesCount,
        hasLockerAccess = hasLockerAccess,
        hasSaunaAccess = hasSaunaAccess,
        hasPoolAccess = hasPoolAccess,
        freezeDaysAllowed = freezeDaysAllowed,
        sortOrder = sortOrder
    )
}

data class UpdateMembershipPlanRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,

    @field:Positive(message = "Price must be positive")
    val priceAmount: BigDecimal? = null,

    val priceCurrency: String? = null,
    val billingPeriod: BillingPeriod? = null,

    @field:Positive(message = "Duration days must be positive")
    val durationDays: Int? = null,

    @field:Positive(message = "Max classes must be positive")
    val maxClassesPerPeriod: Int? = null,

    val hasGuestPasses: Boolean? = null,

    @field:PositiveOrZero(message = "Guest passes count must be zero or positive")
    val guestPassesCount: Int? = null,

    val hasLockerAccess: Boolean? = null,
    val hasSaunaAccess: Boolean? = null,
    val hasPoolAccess: Boolean? = null,

    @field:PositiveOrZero(message = "Freeze days must be zero or positive")
    val freezeDaysAllowed: Int? = null,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int? = null
) {
    fun toCommand(): UpdateMembershipPlanCommand {
        val name = if (nameEn != null) LocalizedText(en = nameEn, ar = nameAr) else null
        val description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null
        val price = if (priceAmount != null) Money(priceAmount, priceCurrency ?: "SAR") else null

        return UpdateMembershipPlanCommand(
            name = name,
            description = description,
            price = price,
            billingPeriod = billingPeriod,
            durationDays = durationDays,
            maxClassesPerPeriod = maxClassesPerPeriod,
            hasGuestPasses = hasGuestPasses,
            guestPassesCount = guestPassesCount,
            hasLockerAccess = hasLockerAccess,
            hasSaunaAccess = hasSaunaAccess,
            hasPoolAccess = hasPoolAccess,
            freezeDaysAllowed = freezeDaysAllowed,
            sortOrder = sortOrder
        )
    }
}

// === Response DTOs ===

data class MembershipPlanResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val price: MoneyResponse,
    val billingPeriod: BillingPeriod,
    val durationDays: Int?,
    val effectiveDurationDays: Int,
    val maxClassesPerPeriod: Int?,
    val hasUnlimitedClasses: Boolean,
    val hasGuestPasses: Boolean,
    val guestPassesCount: Int,
    val hasLockerAccess: Boolean,
    val hasSaunaAccess: Boolean,
    val hasPoolAccess: Boolean,
    val freezeDaysAllowed: Int,
    val isActive: Boolean,
    val sortOrder: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(plan: MembershipPlan) = MembershipPlanResponse(
            id = plan.id,
            name = LocalizedTextResponse.from(plan.name),
            description = plan.description?.let { LocalizedTextResponse.from(it) },
            price = MoneyResponse.from(plan.price),
            billingPeriod = plan.billingPeriod,
            durationDays = plan.durationDays,
            effectiveDurationDays = plan.getEffectiveDurationDays(),
            maxClassesPerPeriod = plan.maxClassesPerPeriod,
            hasUnlimitedClasses = plan.hasUnlimitedClasses(),
            hasGuestPasses = plan.hasGuestPasses,
            guestPassesCount = plan.guestPassesCount,
            hasLockerAccess = plan.hasLockerAccess,
            hasSaunaAccess = plan.hasSaunaAccess,
            hasPoolAccess = plan.hasPoolAccess,
            freezeDaysAllowed = plan.freezeDaysAllowed,
            isActive = plan.isActive,
            sortOrder = plan.sortOrder,
            createdAt = plan.createdAt,
            updatedAt = plan.updatedAt
        )
    }
}