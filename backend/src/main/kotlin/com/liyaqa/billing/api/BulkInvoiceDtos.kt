package com.liyaqa.billing.api

import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.UUID

/**
 * DTOs for bulk invoice operations.
 */

/**
 * Action to perform on invoices in bulk.
 */
enum class BulkInvoiceAction {
    ISSUE,
    CANCEL
}

/**
 * Request for bulk invoice status change.
 */
data class BulkInvoiceStatusRequest(
    @field:NotEmpty(message = "At least one invoice ID is required")
    @field:Size(max = 1000, message = "Maximum 1000 invoices per request")
    val invoiceIds: List<UUID>,

    val action: BulkInvoiceAction,

    val issueDate: LocalDate = LocalDate.now(),

    val paymentDueDays: Int = 14,

    val sendNotifications: Boolean = true
)

/**
 * Request for bulk invoice payment recording.
 */
data class BulkRecordPaymentRequest(
    @field:NotEmpty(message = "At least one payment is required")
    @field:Size(max = 1000, message = "Maximum 1000 payments per request")
    val payments: List<BulkPaymentItem>
)

/**
 * Individual payment item in bulk payment request.
 */
data class BulkPaymentItem(
    val invoiceId: UUID,

    val amount: Money,

    val paymentMethod: PaymentMethod,

    val paymentReference: String? = null
)

/**
 * Request for bulk invoice creation from subscriptions.
 */
data class BulkCreateInvoicesFromSubscriptionsRequest(
    @field:NotEmpty(message = "At least one subscription ID is required")
    @field:Size(max = 1000, message = "Maximum 1000 subscriptions per request")
    val subscriptionIds: List<UUID>,

    val notes: LocalizedText? = null
)
