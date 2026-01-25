package com.liyaqa.membership.application.commands

import com.liyaqa.shared.domain.Money
import java.time.LocalDate
import java.util.UUID

/**
 * Command for creating a new subscription.
 */
data class CreateSubscriptionCommand(
    val memberId: UUID,
    val planId: UUID,
    val startDate: LocalDate = LocalDate.now(),
    val autoRenew: Boolean = false,
    val paidAmount: Money? = null,
    val notes: String? = null,
    // Voucher support
    val voucherCode: String? = null
)

/**
 * Command for updating a subscription.
 */
data class UpdateSubscriptionCommand(
    val autoRenew: Boolean? = null,
    val notes: String? = null
)

/**
 * Command for renewing a subscription.
 */
data class RenewSubscriptionCommand(
    val newEndDate: LocalDate? = null, // If null, will calculate based on plan
    val paidAmount: Money? = null
)