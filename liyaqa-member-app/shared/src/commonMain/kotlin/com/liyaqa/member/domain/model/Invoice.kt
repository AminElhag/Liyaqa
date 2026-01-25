package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Invoice information
 */
@Serializable
data class Invoice(
    val id: String,
    val invoiceNumber: String,
    val totalAmount: Money,
    val paidAmount: Money? = null,
    val remainingBalance: Money,
    val status: InvoiceStatus,
    val issueDate: String? = null,
    val dueDate: String? = null,
    val paidDate: String? = null,
    val isOverdue: Boolean = false
) {
    val isPaid: Boolean get() = status == InvoiceStatus.PAID

    val isPending: Boolean get() = status in listOf(
        InvoiceStatus.ISSUED,
        InvoiceStatus.PARTIALLY_PAID,
        InvoiceStatus.OVERDUE
    )

    val canPay: Boolean get() = remainingBalance.amount > 0 && status !in listOf(
        InvoiceStatus.PAID,
        InvoiceStatus.CANCELLED,
        InvoiceStatus.REFUNDED
    )
}

/**
 * Invoice line item
 */
@Serializable
data class InvoiceLineItem(
    val id: String,
    val description: LocalizedText,
    val quantity: Int,
    val unitPrice: Money,
    val lineTotal: Money
)

/**
 * Detailed invoice with line items
 */
@Serializable
data class InvoiceDetail(
    val id: String,
    val invoiceNumber: String,
    val lineItems: List<InvoiceLineItem>,
    val subtotal: Money,
    val vatAmount: Money,
    val vatRate: Double,
    val totalAmount: Money,
    val paidAmount: Money?,
    val remainingBalance: Money,
    val status: InvoiceStatus,
    val issueDate: String?,
    val dueDate: String?,
    val paidDate: String?,
    val notes: LocalizedText? = null,
    val paymentMethod: PaymentMethod? = null,
    val paymentReference: String? = null
)

/**
 * Payment initiation request
 */
@Serializable
data class PaymentInitiateRequest(
    val invoiceId: String,
    val returnUrl: String
)

/**
 * Payment initiation response
 */
@Serializable
data class PaymentInitiateResponse(
    val paymentUrl: String,
    val paymentReference: String
)

/**
 * Payment verification result
 */
@Serializable
data class PaymentVerifyResult(
    val success: Boolean,
    val message: String? = null,
    val messageAr: String? = null,
    val invoiceId: String? = null,
    val amountPaid: Money? = null
)
