package com.liyaqa.platform.application.commands

import com.liyaqa.platform.domain.model.ClientInvoiceLineItemType
import com.liyaqa.platform.domain.model.ClientPaymentMethod
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Command for creating a new client invoice with line items.
 */
data class CreateClientInvoiceCommand(
    val organizationId: UUID,
    val subscriptionId: UUID? = null,
    val lineItems: List<CreateLineItemCommand>,
    val vatRate: BigDecimal = BigDecimal("15.00"),
    val notes: LocalizedText? = null,
    val billingPeriodStart: LocalDate? = null,
    val billingPeriodEnd: LocalDate? = null,
    val salesRepId: UUID? = null
)

/**
 * Command for creating an invoice line item.
 */
data class CreateLineItemCommand(
    val description: LocalizedText,
    val quantity: Int = 1,
    val unitPrice: Money,
    val itemType: ClientInvoiceLineItemType = ClientInvoiceLineItemType.OTHER
)

/**
 * Command for generating an invoice from a subscription.
 */
data class GenerateFromSubscriptionCommand(
    val subscriptionId: UUID,
    val billingPeriodStart: LocalDate,
    val billingPeriodEnd: LocalDate
)

/**
 * Command for issuing an invoice.
 */
data class IssueClientInvoiceCommand(
    val issueDate: LocalDate = LocalDate.now(),
    val paymentDueDays: Int = 30
)

/**
 * Command for recording a payment on an invoice.
 */
data class RecordClientPaymentCommand(
    val amount: Money,
    val paymentMethod: ClientPaymentMethod,
    val reference: String? = null
)

/**
 * Command for updating an invoice (notes only for non-draft).
 */
data class UpdateClientInvoiceCommand(
    val notes: LocalizedText? = null
)
