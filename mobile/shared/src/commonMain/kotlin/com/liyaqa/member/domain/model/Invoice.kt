package com.liyaqa.member.domain.model

import com.liyaqa.member.core.localization.LocalizedText
import kotlinx.datetime.LocalDate

/**
 * Invoice domain model representing a member's invoice.
 * Aligned with backend InvoiceLiteResponse and InvoiceDetailResponse.
 *
 * Note: Uses Double instead of BigDecimal for KMP compatibility.
 * Double provides sufficient precision for currency display.
 */
data class Invoice(
    val id: String,
    val invoiceNumber: String,
    val totalAmount: Double,
    val currency: String,
    val status: InvoiceStatus,
    val issueDate: LocalDate?,
    val dueDate: LocalDate?,
    val isOverdue: Boolean,
    val lineItems: List<InvoiceLineItem>?,
    val subtotal: Double?,
    val vatAmount: Double?,
    val discount: Double?
) {
    /**
     * Returns true if this invoice is payable.
     */
    val isPayable: Boolean
        get() = status == InvoiceStatus.ISSUED ||
                status == InvoiceStatus.OVERDUE ||
                status == InvoiceStatus.PARTIALLY_PAID

    /**
     * Returns true if this invoice has been fully paid.
     */
    val isPaid: Boolean
        get() = status == InvoiceStatus.PAID
}

/**
 * Line item within an invoice.
 */
data class InvoiceLineItem(
    val description: LocalizedText,
    val quantity: Int,
    val unitPrice: Double,
    val total: Double
)
