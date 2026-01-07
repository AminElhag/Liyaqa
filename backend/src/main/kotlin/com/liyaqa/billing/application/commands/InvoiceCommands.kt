package com.liyaqa.billing.application.commands

import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Command to create a new invoice.
 */
data class CreateInvoiceCommand(
    val memberId: UUID,
    val subscriptionId: UUID? = null,
    val lineItems: List<LineItemCommand>,
    val vatRate: BigDecimal = BigDecimal("15.00"),
    val notes: LocalizedText? = null,
    val dueDate: LocalDate? = null
)

/**
 * Command to create an invoice line item.
 */
data class LineItemCommand(
    val description: LocalizedText,
    val quantity: Int = 1,
    val unitPrice: Money,
    val itemType: LineItemType = LineItemType.OTHER
)

/**
 * Command to generate an invoice from a subscription.
 */
data class CreateSubscriptionInvoiceCommand(
    val subscriptionId: UUID,
    val notes: LocalizedText? = null
)

/**
 * Command to record a payment on an invoice.
 */
data class RecordPaymentCommand(
    val amount: Money,
    val paymentMethod: PaymentMethod,
    val reference: String? = null
)

/**
 * Command to update invoice notes.
 */
data class UpdateInvoiceCommand(
    val notes: LocalizedText? = null
)

/**
 * Command to issue an invoice.
 */
data class IssueInvoiceCommand(
    val issueDate: LocalDate = LocalDate.now(),
    val paymentDueDays: Int = 7
)
