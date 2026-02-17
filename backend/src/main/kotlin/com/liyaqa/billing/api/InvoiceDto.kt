package com.liyaqa.billing.api

import com.liyaqa.billing.application.commands.CreateInvoiceCommand
import com.liyaqa.billing.application.commands.CreateSubscriptionInvoiceCommand
import com.liyaqa.billing.application.commands.IssueInvoiceCommand
import com.liyaqa.billing.application.commands.LineItemCommand
import com.liyaqa.billing.application.commands.RecordPaymentCommand
import com.liyaqa.billing.application.commands.UpdateInvoiceCommand
import com.liyaqa.billing.application.services.CatalogItem
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.model.InvoiceTypeCode
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.model.Payment
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.billing.domain.model.VatCategoryCode
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.Valid
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
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
    val notesAr: String? = null,

    val invoiceTypeCode: InvoiceTypeCode = InvoiceTypeCode.SIMPLIFIED
) {
    fun toCommand() = CreateInvoiceCommand(
        memberId = memberId,
        subscriptionId = subscriptionId,
        lineItems = lineItems.map { it.toCommand() },
        vatRate = vatRate,
        notes = if (notesEn != null || notesAr != null) LocalizedText(notesEn ?: "", notesAr) else null,
        invoiceTypeCode = invoiceTypeCode
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

    val itemType: LineItemType = LineItemType.OTHER,

    val taxRate: BigDecimal = BigDecimal("15.00"),

    val vatCategoryCode: VatCategoryCode = VatCategoryCode.S
) {
    fun toCommand() = LineItemCommand(
        description = LocalizedText(descriptionEn, descriptionAr),
        quantity = quantity,
        unitPrice = Money.of(unitPrice, currency),
        itemType = itemType,
        taxRate = taxRate,
        vatCategoryCode = vatCategoryCode
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

    val currency: String? = null,  // Nullable for Jackson 3.0 compatibility

    @field:NotNull(message = "Payment method is required")
    val paymentMethod: PaymentMethod,

    val paymentReference: String? = null,

    val notes: String? = null
) {
    fun toCommand() = RecordPaymentCommand(
        amount = Money.of(amount, currency ?: "SAR"),  // Default applied here
        paymentMethod = paymentMethod,
        reference = paymentReference,
        notes = notes
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
    val memberName: LocalizedTextResponse?,
    val memberEmail: String?,
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
    val invoiceTypeCode: InvoiceTypeCode,
    val lineItems: List<LineItemResponse>,
    val payments: List<PaymentResponse>,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(
            invoice: Invoice,
            memberName: LocalizedTextResponse? = null,
            memberEmail: String? = null,
            payments: List<Payment> = emptyList()
        ) = InvoiceResponse(
            id = invoice.id,
            invoiceNumber = invoice.invoiceNumber,
            memberId = invoice.memberId,
            memberName = memberName,
            memberEmail = memberEmail,
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
            invoiceTypeCode = invoice.invoiceTypeCode,
            lineItems = invoice.lineItems.map { LineItemResponse.from(it) },
            payments = payments.map { PaymentResponse.from(it) },
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
    val lineTaxAmount: MoneyResponse,
    val lineGrossTotal: MoneyResponse,
    val itemType: LineItemType,
    val taxRate: BigDecimal,
    val vatCategoryCode: VatCategoryCode
) {
    companion object {
        fun from(item: InvoiceLineItem) = LineItemResponse(
            id = item.id,
            description = LocalizedTextResponse.from(item.description),
            quantity = item.quantity,
            unitPrice = MoneyResponse.from(item.unitPrice),
            lineTotal = MoneyResponse.from(item.lineTotal()),
            lineTaxAmount = MoneyResponse.from(item.lineTaxAmount()),
            lineGrossTotal = MoneyResponse.from(item.lineGrossTotal()),
            itemType = item.itemType,
            taxRate = item.taxRate,
            vatCategoryCode = item.vatCategoryCode
        )
    }
}

data class PaymentResponse(
    val id: UUID,
    val invoiceId: UUID,
    val amount: MoneyResponse,
    val paymentMethod: PaymentMethod,
    val paymentReference: String?,
    val notes: String?,
    val paidAt: LocalDateTime,
    val createdBy: UUID?,
    val gatewayTransactionId: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(payment: Payment) = PaymentResponse(
            id = payment.id,
            invoiceId = payment.invoiceId,
            amount = MoneyResponse.from(payment.amount),
            paymentMethod = payment.paymentMethod,
            paymentReference = payment.paymentReference,
            notes = payment.notes,
            paidAt = payment.paidAt,
            createdBy = payment.createdBy,
            gatewayTransactionId = payment.gatewayTransactionId,
            createdAt = payment.createdAt
        )
    }
}

data class CatalogItemResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val price: MoneyResponse,
    val taxRate: BigDecimal,
    val itemType: LineItemType,
    val description: LocalizedTextResponse?
) {
    companion object {
        fun from(item: CatalogItem) = CatalogItemResponse(
            id = item.id,
            name = LocalizedTextResponse.from(item.name),
            price = MoneyResponse.from(item.price),
            taxRate = item.taxRate,
            itemType = item.itemType,
            description = item.description?.let { LocalizedTextResponse.from(it) }
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
    val draftCount: Long,
    val pendingCount: Long,
    val overdueCount: Long,
    val paidCount: Long,
    val partiallyPaidCount: Long
)
