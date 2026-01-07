package com.liyaqa.billing.api

import com.liyaqa.billing.application.commands.CreateInvoiceCommand
import com.liyaqa.billing.application.commands.CreateSubscriptionInvoiceCommand
import com.liyaqa.billing.application.commands.IssueInvoiceCommand
import com.liyaqa.billing.application.commands.LineItemCommand
import com.liyaqa.billing.application.commands.RecordPaymentCommand
import com.liyaqa.billing.application.commands.UpdateInvoiceCommand
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.Valid
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// Request DTOs

data class CreateInvoiceRequest(
    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    val subscriptionId: UUID? = null,

    @field:NotEmpty(message = "At least one line item is required")
    @field:Valid
    val lineItems: List<LineItemRequest>,

    val vatRate: BigDecimal = BigDecimal("15.00"),

    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand() = CreateInvoiceCommand(
        memberId = memberId,
        subscriptionId = subscriptionId,
        lineItems = lineItems.map { it.toCommand() },
        vatRate = vatRate,
        notes = if (notesEn != null || notesAr != null) LocalizedText(notesEn ?: "", notesAr) else null
    )
}

data class LineItemRequest(
    @field:NotNull(message = "Description (English) is required")
    val descriptionEn: String,

    val descriptionAr: String? = null,

    @field:Positive(message = "Quantity must be positive")
    val quantity: Int = 1,

    @field:NotNull(message = "Unit price is required")
    @field:Positive(message = "Unit price must be positive")
    val unitPrice: BigDecimal,

    val currency: String = "SAR",

    val itemType: LineItemType = LineItemType.OTHER
) {
    fun toCommand() = LineItemCommand(
        description = LocalizedText(descriptionEn, descriptionAr),
        quantity = quantity,
        unitPrice = Money.of(unitPrice, currency),
        itemType = itemType
    )
}

data class CreateSubscriptionInvoiceRequest(
    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand(subscriptionId: UUID) = CreateSubscriptionInvoiceCommand(
        subscriptionId = subscriptionId,
        notes = if (notesEn != null || notesAr != null) LocalizedText(notesEn ?: "", notesAr) else null
    )
}

data class IssueInvoiceRequest(
    val issueDate: LocalDate = LocalDate.now(),
    val paymentDueDays: Int = 7
) {
    fun toCommand() = IssueInvoiceCommand(
        issueDate = issueDate,
        paymentDueDays = paymentDueDays
    )
}

data class RecordPaymentRequest(
    @field:NotNull(message = "Amount is required")
    @field:Positive(message = "Amount must be positive")
    val amount: BigDecimal,

    val currency: String = "SAR",

    @field:NotNull(message = "Payment method is required")
    val paymentMethod: PaymentMethod,

    val reference: String? = null
) {
    fun toCommand() = RecordPaymentCommand(
        amount = Money.of(amount, currency),
        paymentMethod = paymentMethod,
        reference = reference
    )
}

data class UpdateInvoiceRequest(
    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand() = UpdateInvoiceCommand(
        notes = if (notesEn != null || notesAr != null) LocalizedText(notesEn ?: "", notesAr) else null
    )
}

// Response DTOs

data class InvoiceResponse(
    val id: UUID,
    val invoiceNumber: String,
    val memberId: UUID,
    val subscriptionId: UUID?,
    val status: InvoiceStatus,
    val issueDate: LocalDate?,
    val dueDate: LocalDate?,
    val paidDate: LocalDate?,
    val subtotal: MoneyResponse,
    val vatRate: BigDecimal,
    val vatAmount: MoneyResponse,
    val totalAmount: MoneyResponse,
    val paidAmount: MoneyResponse?,
    val remainingBalance: MoneyResponse,
    val notes: LocalizedTextResponse?,
    val paymentMethod: PaymentMethod?,
    val paymentReference: String?,
    val lineItems: List<LineItemResponse>,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(invoice: Invoice) = InvoiceResponse(
            id = invoice.id,
            invoiceNumber = invoice.invoiceNumber,
            memberId = invoice.memberId,
            subscriptionId = invoice.subscriptionId,
            status = invoice.status,
            issueDate = invoice.issueDate,
            dueDate = invoice.dueDate,
            paidDate = invoice.paidDate,
            subtotal = MoneyResponse.from(invoice.subtotal),
            vatRate = invoice.vatRate,
            vatAmount = MoneyResponse.from(invoice.vatAmount),
            totalAmount = MoneyResponse.from(invoice.totalAmount),
            paidAmount = invoice.paidAmount?.let { MoneyResponse.from(it) },
            remainingBalance = MoneyResponse.from(invoice.remainingBalance()),
            notes = invoice.notes?.let { LocalizedTextResponse.from(it) },
            paymentMethod = invoice.paymentMethod,
            paymentReference = invoice.paymentReference,
            lineItems = invoice.lineItems.map { LineItemResponse.from(it) },
            createdAt = invoice.createdAt,
            updatedAt = invoice.updatedAt
        )
    }
}

data class LineItemResponse(
    val id: UUID,
    val description: LocalizedTextResponse,
    val quantity: Int,
    val unitPrice: MoneyResponse,
    val lineTotal: MoneyResponse,
    val itemType: LineItemType
) {
    companion object {
        fun from(item: InvoiceLineItem) = LineItemResponse(
            id = item.id,
            description = LocalizedTextResponse.from(item.description),
            quantity = item.quantity,
            unitPrice = MoneyResponse.from(item.unitPrice),
            lineTotal = MoneyResponse.from(item.lineTotal()),
            itemType = item.itemType
        )
    }
}

data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String
) {
    companion object {
        fun from(money: Money) = MoneyResponse(
            amount = money.amount,
            currency = money.currency
        )
    }
}

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(
            en = text.en,
            ar = text.ar
        )
    }
}

data class InvoicePageResponse(
    val content: List<InvoiceResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)

data class InvoiceSummaryResponse(
    val totalInvoices: Long,
    val pendingCount: Long,
    val overdueCount: Long,
    val paidCount: Long
)
