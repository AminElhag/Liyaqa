package com.liyaqa.membership.api

import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.UUID

/**
 * DTOs for bulk subscription operations.
 */

/**
 * Action to perform on subscriptions in bulk.
 */
enum class BulkSubscriptionAction {
    FREEZE,
    UNFREEZE,
    CANCEL
}

/**
 * Request for bulk subscription status change.
 */
data class BulkSubscriptionStatusRequest(
    @field:NotEmpty(message = "At least one subscription ID is required")
    @field:Size(max = 1000, message = "Maximum 1000 subscriptions per request")
    val subscriptionIds: List<UUID>,

    val action: BulkSubscriptionAction,

    val reason: String? = null,

    val sendNotifications: Boolean = true
)

/**
 * Request for bulk subscription renewal.
 */
data class BulkSubscriptionRenewRequest(
    @field:NotEmpty(message = "At least one subscription ID is required")
    @field:Size(max = 1000, message = "Maximum 1000 subscriptions per request")
    val subscriptionIds: List<UUID>,

    val newEndDate: LocalDate? = null,

    val paidAmount: Money? = null,

    val sendNotifications: Boolean = true
)
