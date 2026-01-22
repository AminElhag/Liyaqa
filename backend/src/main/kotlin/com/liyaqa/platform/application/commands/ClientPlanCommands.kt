package com.liyaqa.platform.application.commands

import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money

/**
 * Command for creating a new client plan (B2B pricing tier).
 */
data class CreateClientPlanCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val monthlyPrice: Money,
    val annualPrice: Money,
    val billingCycle: BillingCycle = BillingCycle.MONTHLY,
    val maxClubs: Int = 1,
    val maxLocationsPerClub: Int = 1,
    val maxMembers: Int = 100,
    val maxStaffUsers: Int = 5,
    val hasAdvancedReporting: Boolean = false,
    val hasApiAccess: Boolean = false,
    val hasPrioritySupport: Boolean = false,
    val hasWhiteLabeling: Boolean = false,
    val hasCustomIntegrations: Boolean = false,
    val sortOrder: Int = 0
)

/**
 * Command for updating a client plan.
 */
data class UpdateClientPlanCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val monthlyPrice: Money? = null,
    val annualPrice: Money? = null,
    val billingCycle: BillingCycle? = null,
    val maxClubs: Int? = null,
    val maxLocationsPerClub: Int? = null,
    val maxMembers: Int? = null,
    val maxStaffUsers: Int? = null,
    val hasAdvancedReporting: Boolean? = null,
    val hasApiAccess: Boolean? = null,
    val hasPrioritySupport: Boolean? = null,
    val hasWhiteLabeling: Boolean? = null,
    val hasCustomIntegrations: Boolean? = null,
    val sortOrder: Int? = null
)
