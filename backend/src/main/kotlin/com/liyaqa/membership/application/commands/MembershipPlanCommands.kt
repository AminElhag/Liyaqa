package com.liyaqa.membership.application.commands

import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money

/**
 * Command for creating a new membership plan.
 */
data class CreateMembershipPlanCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val price: Money,
    val billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,
    val durationDays: Int? = null,
    val maxClassesPerPeriod: Int? = null,
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
    val price: Money? = null,
    val billingPeriod: BillingPeriod? = null,
    val durationDays: Int? = null,
    val maxClassesPerPeriod: Int? = null,
    val hasGuestPasses: Boolean? = null,
    val guestPassesCount: Int? = null,
    val hasLockerAccess: Boolean? = null,
    val hasSaunaAccess: Boolean? = null,
    val hasPoolAccess: Boolean? = null,
    val freezeDaysAllowed: Int? = null,
    val sortOrder: Int? = null
)