package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Invoice DTOs matching backend invoice-related responses.
 */

/**
 * Invoice summary response.
 * Matches backend InvoiceLiteResponse from /api/me/invoices.
 */
@Serializable
data class InvoiceLiteDto(
    val id: String,
    val invoiceNumber: String,
    val totalAmount: Double,
    val currency: String,
    val status: String, // InvoiceStatus enum as string
    val issueDate: String? = null, // ISO-8601 LocalDate
    val dueDate: String? = null, // ISO-8601 LocalDate
    val isOverdue: Boolean
)

/**
 * Detailed invoice response.
 * Matches backend InvoiceDetailResponse from /api/invoices/{id}.
 */
@Serializable
data class InvoiceDetailDto(
    val id: String,
    val invoiceNumber: String,
    val memberId: String,
    val status: String, // InvoiceStatus enum as string
    val issueDate: String? = null, // ISO-8601 LocalDate
    val dueDate: String? = null, // ISO-8601 LocalDate
    val subtotal: MoneyDto,
    val vatRate: Double,
    val vatAmount: MoneyDto,
    val totalAmount: MoneyDto,
    val paidAmount: MoneyDto? = null,
    val remainingBalance: MoneyDto,
    val lineItems: List<InvoiceLineItemDto>,
    val isOverdue: Boolean
)

/**
 * Line item within an invoice.
 */
@Serializable
data class InvoiceLineItemDto(
    val description: LocalizedTextDto,
    val quantity: Int,
    val unitPrice: Double,
    val total: Double
)
