package com.liyaqa.membership.application.commands

import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TaxableFee
import java.time.LocalDate

/**
 * Command for creating a new membership plan.
 */
data class CreateMembershipPlanCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,

    // Date restrictions
    val availableFrom: LocalDate? = null,
    val availableUntil: LocalDate? = null,

    // Age restrictions
    val minimumAge: Int? = null,
    val maximumAge: Int? = null,

    // Fee structure
    val membershipFee: TaxableFee = TaxableFee(),
    val administrationFee: TaxableFee = TaxableFee(),
    val joinFee: TaxableFee = TaxableFee(),

    // Active status
    val isActive: Boolean = true,

    // Billing & duration
    val billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,
    val durationDays: Int? = null,
    val maxClassesPerPeriod: Int? = null,

    // Features
    val hasGuestPasses: Boolean = false,
    val guestPassesCount: Int = 0,
    val hasLockerAccess: Boolean = false,
    val hasSaunaAccess: Boolean = false,
    val hasPoolAccess: Boolean = false,
    val freezeDaysAllowed: Int = 0,
    val sortOrder: Int = 0
)

/**
 * Command for updating a membership plan.
 */
data class UpdateMembershipPlanCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,

    // Date restrictions
    val availableFrom: LocalDate? = null,
    val availableUntil: LocalDate? = null,
    val clearAvailableFrom: Boolean = false,
    val clearAvailableUntil: Boolean = false,

    // Age restrictions
    val minimumAge: Int? = null,
    val maximumAge: Int? = null,
    val clearMinimumAge: Boolean = false,
    val clearMaximumAge: Boolean = false,

    // Fee structure
    val membershipFee: TaxableFee? = null,
    val administrationFee: TaxableFee? = null,
    val joinFee: TaxableFee? = null,

    // Billing & duration
    val billingPeriod: BillingPeriod? = null,
    val durationDays: Int? = null,
    val maxClassesPerPeriod: Int? = null,

    // Features
    val hasGuestPasses: Boolean? = null,
    val guestPassesCount: Int? = null,
    val hasLockerAccess: Boolean? = null,
    val hasSaunaAccess: Boolean? = null,
    val hasPoolAccess: Boolean? = null,
    val freezeDaysAllowed: Int? = null,
    val sortOrder: Int? = null
)
