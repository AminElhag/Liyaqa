package com.liyaqa.platform.api.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.platform.application.commands.CreateClientInvoiceCommand
import com.liyaqa.platform.application.commands.CreateLineItemCommand
import com.liyaqa.platform.application.commands.GenerateFromSubscriptionCommand
import com.liyaqa.platform.application.commands.IssueClientInvoiceCommand
import com.liyaqa.platform.application.commands.RecordClientPaymentCommand
import com.liyaqa.platform.application.commands.UpdateClientInvoiceCommand
import com.liyaqa.platform.application.services.ClientInvoiceStats
import com.liyaqa.platform.domain.model.ClientInvoice
import com.liyaqa.platform.domain.model.ClientInvoiceLineItem
import com.liyaqa.platform.domain.model.ClientInvoiceLineItemType
import com.liyaqa.platform.domain.model.ClientInvoiceStatus
import com.liyaqa.platform.domain.model.ClientPaymentMethod
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

/**
 * Request for creating a manual invoice with line items.
 */
data class CreateClientInvoiceRequest(
    @field:NotNull(message = "Organization ID is required")
    val organizationId: UUID,

    val subscriptionId: UUID? = null,

    @field:NotEmpty(message = "At least one line item is required")
    @field:Valid
    val lineItems: List<CreateLineItemRequest>,

    @field:Positive(message = "VAT rate must be positive")
    val vatRate: BigDecimal = BigDecimal("15.00"),

    val notesEn: String? = null,
    val notesAr: String? = null,

    val billingPeriodStart: LocalDate? = null,
    val billingPeriodEnd: LocalDate? = null,
    val salesRepId: UUID? = null
) {
    fun toCommand() = CreateClientInvoiceCommand(
        organizationId = organizationId,
        subscriptionId = subscriptionId,
        lineItems = lineItems.map { it.toCommand() },
        vatRate = vatRate,
        notes = if (notesEn != null) LocalizedText(en = notesEn, ar = notesAr) else null,
        billingPeriodStart = billingPeriodStart,
        billingPeriodEnd = billingPeriodEnd,
        salesRepId = salesRepId
    )
}

/**
 * Request for creating a line item.
 */
data class CreateLineItemRequest(
    @field:NotBlank(message = "Description (English) is required")
    val descriptionEn: String,

    val descriptionAr: String? = null,

    @field:Positive(message = "Quantity must be positive")
    val quantity: Int = 1,

    @field:NotNull(message = "Unit price is required")
    @field:Positive(message = "Unit price must be positive")
    val unitPriceAmount: BigDecimal,

    val unitPriceCurrency: String = "SAR",

    val itemType: ClientInvoiceLineItemType = ClientInvoiceLineItemType.OTHER
) {
    fun toCommand() = CreateLineItemCommand(
        description = LocalizedText(en = descriptionEn, ar = descriptionAr),
        quantity = quantity,
        unitPrice = Money(unitPriceAmount, unitPriceCurrency),
        itemType = itemType
    )
}

/**
 * Request for generating an invoice from a subscription.
 */
data class GenerateFromSubscriptionRequest(
    @field:NotNull(message = "Subscription ID is required")
    val subscriptionId: UUID,

    @field:NotNull(message = "Billing period start is required")
    val billingPeriodStart: LocalDate,

    @field:NotNull(message = "Billing period end is required")
    val billingPeriodEnd: LocalDate
) {
    fun toCommand() = GenerateFromSubscriptionCommand(
        subscriptionId = subscriptionId,
        billingPeriodStart = billingPeriodStart,
        billingPeriodEnd = billingPeriodEnd
    )
}

/**
 * Request for issuing an invoice.
 */
data class IssueClientInvoiceRequest(
    val issueDate: LocalDate = LocalDate.now(),

    @field:Positive(message = "Payment due days must be positive")
    val paymentDueDays: Int = 30
) {
    fun toCommand() = IssueClientInvoiceCommand(
        issueDate = issueDate,
        paymentDueDays = paymentDueDays
    )
}

/**
 * Request for recording a payment on an invoice.
 */
data class RecordClientPaymentRequest(
    @field:NotNull(message = "Amount is required")
    @field:Positive(message = "Amount must be positive")
    val amountValue: BigDecimal,

    val amountCurrency: String = "SAR",

    @field:NotNull(message = "Payment method is required")
    val paymentMethod: ClientPaymentMethod,

    val reference: String? = null
) {
    fun toCommand() = RecordClientPaymentCommand(
        amount = Money(amountValue, amountCurrency),
        paymentMethod = paymentMethod,
        reference = reference
    )
}

/**
 * Request for updating an invoice.
 */
data class UpdateClientInvoiceRequest(
    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand() = UpdateClientInvoiceCommand(
        notes = if (notesEn != null) LocalizedText(en = notesEn, ar = notesAr) else null
    )
}

// ============================================
// Response DTOs
// ============================================

/**
 * Full invoice response with all details.
 */
data class ClientInvoiceResponse(
    val id: UUID,
    val invoiceNumber: String,
    val organizationId: UUID,
    val subscriptionId: UUID?,
    val status: ClientInvoiceStatus,
    val issueDate: LocalDate?,
    val dueDate: LocalDate?,
    val paidDate: LocalDate?,
    val billingPeriodStart: LocalDate?,
    val billingPeriodEnd: LocalDate?,
    val subtotal: MoneyResponse,
    val vatRate: BigDecimal,
    val vatAmount: MoneyResponse,
    val totalAmount: MoneyResponse,
    val paidAmount: MoneyResponse?,
    val remainingBalance: MoneyResponse,
    val notes: LocalizedTextResponse?,
    val paymentMethod: ClientPaymentMethod?,
    val paymentReference: String?,
    val salesRepId: UUID?,
    val lineItems: List<ClientInvoiceLineItemResponse>,

    // Calculated fields
    @get:JsonProperty("isFullyPaid")
    val isFullyPaid: Boolean,
    @get:JsonProperty("isOverdue")
    val isOverdue: Boolean,

    // Timestamps
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(invoice: ClientInvoice) = ClientInvoiceResponse(
            id = invoice.id,
            invoiceNumber = invoice.invoiceNumber,
            organizationId = invoice.organizationId,
            subscriptionId = invoice.subscriptionId,
            status = invoice.status,
            issueDate = invoice.issueDate,
            dueDate = invoice.dueDate,
            paidDate = invoice.paidDate,
            billingPeriodStart = invoice.billingPeriodStart,
            billingPeriodEnd = invoice.billingPeriodEnd,
            subtotal = MoneyResponse.from(invoice.subtotal),
            vatRate = invoice.vatRate,
            vatAmount = MoneyResponse.from(invoice.vatAmount),
            totalAmount = MoneyResponse.from(invoice.totalAmount),
            paidAmount = invoice.paidAmount?.let { MoneyResponse.from(it) },
            remainingBalance = MoneyResponse.from(invoice.remainingBalance()),
            notes = invoice.notes?.let { LocalizedTextResponse.from(it) },
            paymentMethod = invoice.paymentMethod,
            paymentReference = invoice.paymentReference,
            salesRepId = invoice.salesRepId,
            lineItems = invoice.lineItems.map { ClientInvoiceLineItemResponse.from(it) },
            isFullyPaid = invoice.isFullyPaid(),
            isOverdue = invoice.isOverdue(),
            createdAt = invoice.createdAt,
            updatedAt = invoice.updatedAt
        )
    }
}

/**
 * Line item response.
 */
data class ClientInvoiceLineItemResponse(
    val id: UUID,
    val description: LocalizedTextResponse,
    val quantity: Int,
    val unitPrice: MoneyResponse,
    val lineTotal: MoneyResponse,
    val itemType: ClientInvoiceLineItemType,
    val sortOrder: Int
) {
    companion object {
        fun from(item: ClientInvoiceLineItem) = ClientInvoiceLineItemResponse(
            id = item.id,
            description = LocalizedTextResponse.from(item.description),
            quantity = item.quantity,
            unitPrice = MoneyResponse.from(item.unitPrice),
            lineTotal = MoneyResponse.from(item.lineTotal()),
            itemType = item.itemType,
            sortOrder = item.sortOrder
        )
    }
}

/**
 * Simplified invoice response for listings.
 */
data class ClientInvoiceSummaryResponse(
    val id: UUID,
    val invoiceNumber: String,
    val organizationId: UUID,
    val status: ClientInvoiceStatus,
    val issueDate: LocalDate?,
    val dueDate: LocalDate?,
    val totalAmount: MoneyResponse,
    @get:JsonProperty("isOverdue")
    val isOverdue: Boolean
) {
    companion object {
        fun from(invoice: ClientInvoice) = ClientInvoiceSummaryResponse(
            id = invoice.id,
            invoiceNumber = invoice.invoiceNumber,
            organizationId = invoice.organizationId,
            status = invoice.status,
            issueDate = invoice.issueDate,
            dueDate = invoice.dueDate,
            totalAmount = MoneyResponse.from(invoice.totalAmount),
            isOverdue = invoice.isOverdue()
        )
    }
}

/**
 * Response for invoice statistics.
 */
data class ClientInvoiceStatsResponse(
    val total: Long,
    val draft: Long,
    val issued: Long,
    val paid: Long,
    val partiallyPaid: Long,
    val overdue: Long,
    val cancelled: Long
) {
    companion object {
        fun from(stats: ClientInvoiceStats) = ClientInvoiceStatsResponse(
            total = stats.total,
            draft = stats.draft,
            issued = stats.issued,
            paid = stats.paid,
            partiallyPaid = stats.partiallyPaid,
            overdue = stats.overdue,
            cancelled = stats.cancelled
        )
    }
}
