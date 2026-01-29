package com.liyaqa.membership.api

import com.liyaqa.membership.application.commands.CreateMembershipPlanCommand
import com.liyaqa.membership.application.commands.UpdateMembershipPlanCommand
import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.organization.api.LocalizedTextResponse
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TaxableFee
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// === Fee DTOs ===

/**
 * Request DTO for a fee with tax rate.
 */
data class TaxableFeeRequest(
    @field:PositiveOrZero(message = "Fee amount must be zero or positive")
    val amount: BigDecimal = BigDecimal.ZERO,

    val currency: String = "SAR",

    @field:PositiveOrZero(message = "Tax rate must be zero or positive")
    @field:Max(value = 100, message = "Tax rate cannot exceed 100%")
    val taxRate: BigDecimal = BigDecimal("15.00")
) {
    fun toValueObject() = TaxableFee(amount, currency, taxRate)
}

/**
 * Response DTO for a fee with computed tax amounts.
 */
data class TaxableFeeResponse(
    val amount: BigDecimal,
    val currency: String,
    val taxRate: BigDecimal,
    val taxAmount: BigDecimal,
    val grossAmount: BigDecimal
) {
    companion object {
        fun from(fee: TaxableFee) = TaxableFeeResponse(
            amount = fee.amount,
            currency = fee.currency,
            taxRate = fee.taxRate,
            taxAmount = fee.getTaxAmount().amount,
            grossAmount = fee.getGrossAmount().amount
        )
    }
}

// === Request DTOs ===

data class CreateMembershipPlanRequest(
    @field:NotBlank(message = "Plan name (English) is required")
    val nameEn: String,

    val nameAr: String? = null,

    val descriptionEn: String? = null,

    val descriptionAr: String? = null,

    // === DATE RESTRICTIONS ===
    val availableFrom: LocalDate? = null,

    val availableUntil: LocalDate? = null,

    // === AGE RESTRICTIONS ===
    @field:Min(value = 0, message = "Minimum age cannot be negative")
    val minimumAge: Int? = null,

    @field:Min(value = 0, message = "Maximum age cannot be negative")
    val maximumAge: Int? = null,

    // === FEE STRUCTURE ===
    @field:Valid
    val membershipFee: TaxableFeeRequest = TaxableFeeRequest(),

    @field:Valid
    val administrationFee: TaxableFeeRequest = TaxableFeeRequest(),

    @field:Valid
    val joinFee: TaxableFeeRequest = TaxableFeeRequest(),

    // === ACTIVE STATUS ===
    val isActive: Boolean = true,

    // === BILLING & DURATION ===
    val billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,

    @field:Positive(message = "Duration days must be positive")
    val durationDays: Int? = null,

    @field:PositiveOrZero(message = "Max classes must be zero or positive")
    val maxClassesPerPeriod: Int? = null,

    // === FEATURES ===
    val hasGuestPasses: Boolean = false,

    @field:PositiveOrZero(message = "Guest passes count must be zero or positive")
    val guestPassesCount: Int = 0,

    val hasLockerAccess: Boolean = false,

    val hasSaunaAccess: Boolean = false,

    val hasPoolAccess: Boolean = false,

    @field:PositiveOrZero(message = "Freeze days must be zero or positive")
    val freezeDaysAllowed: Int = 0,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int = 0,

    // === CONTRACT CONFIGURATION ===
    val categoryId: UUID? = null,

    val contractType: String = "MONTH_TO_MONTH",

    val supportedTerms: List<String> = listOf("MONTHLY"),

    @field:Min(value = 1, message = "Default commitment must be at least 1 month")
    @field:Max(value = 60, message = "Default commitment cannot exceed 60 months")
    val defaultCommitmentMonths: Int = 1,

    @field:Min(value = 0, message = "Minimum commitment cannot be negative")
    @field:Max(value = 60, message = "Minimum commitment cannot exceed 60 months")
    val minimumCommitmentMonths: Int? = null,

    @field:Min(value = 0, message = "Notice period cannot be negative")
    @field:Max(value = 90, message = "Notice period cannot exceed 90 days")
    val defaultNoticePeriodDays: Int = 30,

    val earlyTerminationFeeType: String = "NONE",

    @field:PositiveOrZero(message = "Termination fee value must be zero or positive")
    val earlyTerminationFeeValue: BigDecimal? = null,

    @field:Min(value = 0, message = "Cooling-off days cannot be negative")
    @field:Max(value = 30, message = "Cooling-off days cannot exceed 30")
    val coolingOffDays: Int = 14
) {
    fun toCommand() = CreateMembershipPlanCommand(
        name = LocalizedText(en = nameEn, ar = nameAr),
        description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null,
        availableFrom = availableFrom,
        availableUntil = availableUntil,
        minimumAge = minimumAge,
        maximumAge = maximumAge,
        membershipFee = membershipFee.toValueObject(),
        administrationFee = administrationFee.toValueObject(),
        joinFee = joinFee.toValueObject(),
        isActive = isActive,
        billingPeriod = billingPeriod,
        durationDays = durationDays,
        maxClassesPerPeriod = maxClassesPerPeriod,
        hasGuestPasses = hasGuestPasses,
        guestPassesCount = guestPassesCount,
        hasLockerAccess = hasLockerAccess,
        hasSaunaAccess = hasSaunaAccess,
        hasPoolAccess = hasPoolAccess,
        freezeDaysAllowed = freezeDaysAllowed,
        sortOrder = sortOrder,
        // Contract configuration
        categoryId = categoryId,
        contractType = contractType,
        supportedTerms = supportedTerms,
        defaultCommitmentMonths = defaultCommitmentMonths,
        minimumCommitmentMonths = minimumCommitmentMonths,
        defaultNoticePeriodDays = defaultNoticePeriodDays,
        earlyTerminationFeeType = earlyTerminationFeeType,
        earlyTerminationFeeValue = earlyTerminationFeeValue,
        coolingOffDays = coolingOffDays
    )
}

data class UpdateMembershipPlanRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,

    // === DATE RESTRICTIONS ===
    val availableFrom: LocalDate? = null,
    val availableUntil: LocalDate? = null,
    val clearAvailableFrom: Boolean = false,
    val clearAvailableUntil: Boolean = false,

    // === AGE RESTRICTIONS ===
    @field:Min(value = 0, message = "Minimum age cannot be negative")
    val minimumAge: Int? = null,

    @field:Min(value = 0, message = "Maximum age cannot be negative")
    val maximumAge: Int? = null,

    val clearMinimumAge: Boolean = false,
    val clearMaximumAge: Boolean = false,

    // === FEE STRUCTURE ===
    @field:Valid
    val membershipFee: TaxableFeeRequest? = null,

    @field:Valid
    val administrationFee: TaxableFeeRequest? = null,

    @field:Valid
    val joinFee: TaxableFeeRequest? = null,

    // === BILLING & DURATION ===
    val billingPeriod: BillingPeriod? = null,

    @field:Positive(message = "Duration days must be positive")
    val durationDays: Int? = null,

    @field:PositiveOrZero(message = "Max classes must be zero or positive")
    val maxClassesPerPeriod: Int? = null,

    // === FEATURES ===
    val hasGuestPasses: Boolean? = null,

    @field:PositiveOrZero(message = "Guest passes count must be zero or positive")
    val guestPassesCount: Int? = null,

    val hasLockerAccess: Boolean? = null,
    val hasSaunaAccess: Boolean? = null,
    val hasPoolAccess: Boolean? = null,

    @field:PositiveOrZero(message = "Freeze days must be zero or positive")
    val freezeDaysAllowed: Int? = null,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int? = null,

    // === CONTRACT CONFIGURATION ===
    val categoryId: UUID? = null,

    val contractType: String? = null,

    val supportedTerms: List<String>? = null,

    @field:Min(value = 1, message = "Default commitment must be at least 1 month")
    @field:Max(value = 60, message = "Default commitment cannot exceed 60 months")
    val defaultCommitmentMonths: Int? = null,

    @field:Min(value = 0, message = "Minimum commitment cannot be negative")
    @field:Max(value = 60, message = "Minimum commitment cannot exceed 60 months")
    val minimumCommitmentMonths: Int? = null,

    @field:Min(value = 0, message = "Notice period cannot be negative")
    @field:Max(value = 90, message = "Notice period cannot exceed 90 days")
    val defaultNoticePeriodDays: Int? = null,

    val earlyTerminationFeeType: String? = null,

    @field:PositiveOrZero(message = "Termination fee value must be zero or positive")
    val earlyTerminationFeeValue: BigDecimal? = null,

    @field:Min(value = 0, message = "Cooling-off days cannot be negative")
    @field:Max(value = 30, message = "Cooling-off days cannot exceed 30")
    val coolingOffDays: Int? = null,

    val clearCategoryId: Boolean = false
) {
    fun toCommand(): UpdateMembershipPlanCommand {
        val name = if (nameEn != null) LocalizedText(en = nameEn, ar = nameAr) else null
        val description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null

        return UpdateMembershipPlanCommand(
            name = name,
            description = description,
            availableFrom = availableFrom,
            availableUntil = availableUntil,
            clearAvailableFrom = clearAvailableFrom,
            clearAvailableUntil = clearAvailableUntil,
            minimumAge = minimumAge,
            maximumAge = maximumAge,
            clearMinimumAge = clearMinimumAge,
            clearMaximumAge = clearMaximumAge,
            membershipFee = membershipFee?.toValueObject(),
            administrationFee = administrationFee?.toValueObject(),
            joinFee = joinFee?.toValueObject(),
            billingPeriod = billingPeriod,
            durationDays = durationDays,
            maxClassesPerPeriod = maxClassesPerPeriod,
            hasGuestPasses = hasGuestPasses,
            guestPassesCount = guestPassesCount,
            hasLockerAccess = hasLockerAccess,
            hasSaunaAccess = hasSaunaAccess,
            hasPoolAccess = hasPoolAccess,
            freezeDaysAllowed = freezeDaysAllowed,
            sortOrder = sortOrder,
            // Contract configuration
            categoryId = categoryId,
            contractType = contractType,
            supportedTerms = supportedTerms,
            defaultCommitmentMonths = defaultCommitmentMonths,
            minimumCommitmentMonths = minimumCommitmentMonths,
            defaultNoticePeriodDays = defaultNoticePeriodDays,
            earlyTerminationFeeType = earlyTerminationFeeType,
            earlyTerminationFeeValue = earlyTerminationFeeValue,
            coolingOffDays = coolingOffDays,
            clearCategoryId = clearCategoryId
        )
    }
}

// === Response DTOs ===

data class MembershipPlanResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,

    // === DATE RESTRICTIONS ===
    val availableFrom: LocalDate?,
    val availableUntil: LocalDate?,
    val isCurrentlyAvailable: Boolean,
    val hasDateRestriction: Boolean,

    // === AGE RESTRICTIONS ===
    val minimumAge: Int?,
    val maximumAge: Int?,
    val hasAgeRestriction: Boolean,

    // === FEE STRUCTURE ===
    val membershipFee: TaxableFeeResponse,
    val administrationFee: TaxableFeeResponse,
    val joinFee: TaxableFeeResponse,
    val recurringTotal: MoneyResponse,
    val totalWithJoinFee: MoneyResponse,

    // === BACKWARD COMPATIBILITY ===
    val price: MoneyResponse,

    // === BILLING & DURATION ===
    val billingPeriod: BillingPeriod,
    val durationDays: Int?,
    val effectiveDurationDays: Int,
    val maxClassesPerPeriod: Int?,
    val hasUnlimitedClasses: Boolean,

    // === FEATURES ===
    val hasGuestPasses: Boolean,
    val guestPassesCount: Int,
    val hasLockerAccess: Boolean,
    val hasSaunaAccess: Boolean,
    val hasPoolAccess: Boolean,
    val freezeDaysAllowed: Int,

    // === STATUS & ORDER ===
    val isActive: Boolean,
    val sortOrder: Int,

    // === CONTRACT CONFIGURATION ===
    val categoryId: UUID?,
    val contractType: String,
    val supportedTerms: List<String>,
    val defaultCommitmentMonths: Int,
    val minimumCommitmentMonths: Int?,
    val defaultNoticePeriodDays: Int,
    val earlyTerminationFeeType: String,
    val earlyTerminationFeeValue: BigDecimal?,
    val coolingOffDays: Int,

    // === AUDIT ===
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(plan: MembershipPlan) = MembershipPlanResponse(
            id = plan.id,
            name = LocalizedTextResponse.from(plan.name),
            description = plan.description?.let { LocalizedTextResponse.from(it) },
            // Date restrictions
            availableFrom = plan.availableFrom,
            availableUntil = plan.availableUntil,
            isCurrentlyAvailable = plan.isCurrentlyAvailable(),
            hasDateRestriction = plan.hasDateRestriction(),
            // Age restrictions
            minimumAge = plan.minimumAge,
            maximumAge = plan.maximumAge,
            hasAgeRestriction = plan.hasAgeRestriction(),
            // Fee structure
            membershipFee = TaxableFeeResponse.from(plan.membershipFee),
            administrationFee = TaxableFeeResponse.from(plan.administrationFee),
            joinFee = TaxableFeeResponse.from(plan.joinFee),
            recurringTotal = MoneyResponse.from(plan.getRecurringTotal()),
            totalWithJoinFee = MoneyResponse.from(plan.getTotalPrice()),
            // Backward compatibility
            price = MoneyResponse.from(plan.getLegacyPrice()),
            // Billing & duration
            billingPeriod = plan.billingPeriod,
            durationDays = plan.durationDays,
            effectiveDurationDays = plan.getEffectiveDurationDays(),
            maxClassesPerPeriod = plan.maxClassesPerPeriod,
            hasUnlimitedClasses = plan.hasUnlimitedClasses(),
            // Features
            hasGuestPasses = plan.hasGuestPasses,
            guestPassesCount = plan.guestPassesCount,
            hasLockerAccess = plan.hasLockerAccess,
            hasSaunaAccess = plan.hasSaunaAccess,
            hasPoolAccess = plan.hasPoolAccess,
            freezeDaysAllowed = plan.freezeDaysAllowed,
            // Status & order
            isActive = plan.isActive,
            sortOrder = plan.sortOrder,
            // Contract configuration
            categoryId = plan.categoryId,
            contractType = plan.contractType,
            supportedTerms = plan.getSupportedTermsList(),
            defaultCommitmentMonths = plan.defaultCommitmentMonths,
            minimumCommitmentMonths = plan.minimumCommitmentMonths,
            defaultNoticePeriodDays = plan.defaultNoticePeriodDays,
            earlyTerminationFeeType = plan.earlyTerminationFeeType,
            earlyTerminationFeeValue = plan.earlyTerminationFeeValue,
            coolingOffDays = plan.coolingOffDays,
            // Audit
            createdAt = plan.createdAt,
            updatedAt = plan.updatedAt
        )
    }
}
