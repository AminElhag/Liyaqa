package com.liyaqa.platform.application.commands

import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Command for creating a new deal.
 */
data class CreateDealCommand(
    val title: LocalizedText,
    val source: DealSource = DealSource.WEBSITE,
    val contactName: String,
    val contactEmail: String,
    val contactPhone: String? = null,
    val companyName: String? = null,
    val estimatedValue: Money = Money.ZERO,
    val probability: Int = 10,
    val expectedCloseDate: LocalDate? = null,
    val interestedPlanId: UUID? = null,
    val salesRepId: UUID,
    val notes: LocalizedText? = null
)

/**
 * Command for updating a deal.
 */
data class UpdateDealCommand(
    val title: LocalizedText? = null,
    val source: DealSource? = null,
    val contactName: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val companyName: String? = null,
    val estimatedValue: Money? = null,
    val probability: Int? = null,
    val expectedCloseDate: LocalDate? = null,
    val interestedPlanId: UUID? = null,
    val notes: LocalizedText? = null
)

/**
 * Command for converting a deal to a client.
 * Includes all details needed to create an organization, club, admin user, and subscription.
 */
data class ConvertDealCommand(
    // Organization details
    val organizationName: LocalizedText,
    val organizationTradeName: LocalizedText? = null,
    val organizationType: OrganizationType = OrganizationType.LLC,
    val organizationEmail: String? = null,
    val organizationPhone: String? = null,
    val organizationWebsite: String? = null,
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null,

    // First club details
    val clubName: LocalizedText,
    val clubDescription: LocalizedText? = null,

    // Admin user details
    val adminEmail: String,
    val adminPassword: String,
    val adminDisplayName: LocalizedText,

    // Subscription details (optional - may convert without immediate subscription)
    val clientPlanId: UUID? = null,
    val agreedPrice: Money? = null,
    val billingCycle: BillingCycle = BillingCycle.MONTHLY,
    val contractMonths: Int = 12,
    val startWithTrial: Boolean = true,
    val trialDays: Int = 14,
    val discountPercentage: BigDecimal? = null
)

/**
 * Command for marking a deal as lost.
 */
data class LoseDealCommand(
    val reason: LocalizedText
)

/**
 * Command for reassigning a deal to another sales rep.
 */
data class ReassignDealCommand(
    val newSalesRepId: UUID
)
