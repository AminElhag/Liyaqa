package com.liyaqa.platform.application.commands

import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Command for creating a new client subscription.
 */
data class CreateClientSubscriptionCommand(
    val organizationId: UUID,
    val clientPlanId: UUID,
    val agreedPrice: Money,
    val billingCycle: BillingCycle = BillingCycle.MONTHLY,
    val contractMonths: Int = 12,
    val startWithTrial: Boolean = false,
    val trialDays: Int = 14,
    val discountPercentage: BigDecimal? = null,
    val autoRenew: Boolean = true,
    val salesRepId: UUID? = null,
    val dealId: UUID? = null,
    val notes: LocalizedText? = null
)

/**
 * Command for updating a client subscription.
 */
data class UpdateClientSubscriptionCommand(
    val agreedPrice: Money? = null,
    val billingCycle: BillingCycle? = null,
    val discountPercentage: BigDecimal? = null,
    val autoRenew: Boolean? = null,
    val notes: LocalizedText? = null
)

/**
 * Command for changing the plan of a subscription.
 */
data class ChangeSubscriptionPlanCommand(
    val newPlanId: UUID,
    val newAgreedPrice: Money,
    val newContractMonths: Int? = null
)

/**
 * Command for renewing a subscription.
 */
data class RenewSubscriptionCommand(
    val newEndDate: LocalDate,
    val newAgreedPrice: Money? = null
)
