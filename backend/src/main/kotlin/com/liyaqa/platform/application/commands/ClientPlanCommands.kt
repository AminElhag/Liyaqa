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
    // Legacy features
    val hasAdvancedReporting: Boolean = false,
    val hasApiAccess: Boolean = false,
    val hasPrioritySupport: Boolean = false,
    val hasWhiteLabeling: Boolean = false,
    val hasCustomIntegrations: Boolean = false,
    // Member Engagement features
    val hasMemberPortal: Boolean = false,
    val hasMobileApp: Boolean = false,
    val hasWearablesIntegration: Boolean = false,
    // Marketing & Loyalty features
    val hasMarketingAutomation: Boolean = false,
    val hasLoyaltyProgram: Boolean = false,
    // Operations features
    val hasAccessControl: Boolean = false,
    val hasFacilityBooking: Boolean = false,
    val hasPersonalTraining: Boolean = false,
    // Accounts & Payments features
    val hasCorporateAccounts: Boolean = false,
    val hasFamilyGroups: Boolean = false,
    val hasOnlinePayments: Boolean = false,
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
    // Legacy features
    val hasAdvancedReporting: Boolean? = null,
    val hasApiAccess: Boolean? = null,
    val hasPrioritySupport: Boolean? = null,
    val hasWhiteLabeling: Boolean? = null,
    val hasCustomIntegrations: Boolean? = null,
    // Member Engagement features
    val hasMemberPortal: Boolean? = null,
    val hasMobileApp: Boolean? = null,
    val hasWearablesIntegration: Boolean? = null,
    // Marketing & Loyalty features
    val hasMarketingAutomation: Boolean? = null,
    val hasLoyaltyProgram: Boolean? = null,
    // Operations features
    val hasAccessControl: Boolean? = null,
    val hasFacilityBooking: Boolean? = null,
    val hasPersonalTraining: Boolean? = null,
    // Accounts & Payments features
    val hasCorporateAccounts: Boolean? = null,
    val hasFamilyGroups: Boolean? = null,
    val hasOnlinePayments: Boolean? = null,
    val sortOrder: Int? = null
)
