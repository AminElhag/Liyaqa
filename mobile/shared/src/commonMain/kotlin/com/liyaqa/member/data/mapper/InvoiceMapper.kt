package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.InvoiceDetailDto
import com.liyaqa.member.data.dto.InvoiceLiteDto
import com.liyaqa.member.data.dto.InvoiceLineItemDto
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceLineItem
import com.liyaqa.member.domain.model.InvoiceStatus

/**
 * Mappers for invoice-related DTOs to domain models.
 */

/**
 * Maps invoice lite DTO to domain Invoice.
 */
fun InvoiceLiteDto.toDomain(): Invoice = Invoice(
    id = id,
    invoiceNumber = invoiceNumber,
    totalAmount = totalAmount,
    currency = currency,
    status = InvoiceStatus.valueOf(status),
    issueDate = issueDate.toLocalDateOrNull(),
    dueDate = dueDate.toLocalDateOrNull(),
    isOverdue = isOverdue,
    lineItems = null, // Not in lite response
    subtotal = null, // Not in lite response
    vatAmount = null, // Not in lite response
    discount = null // Not in lite response
)

/**
 * Maps invoice detail DTO to domain Invoice.
 */
fun InvoiceDetailDto.toDomain(): Invoice = Invoice(
    id = id,
    invoiceNumber = invoiceNumber,
    totalAmount = totalAmount.amount,
    currency = totalAmount.currency,
    status = InvoiceStatus.valueOf(status),
    issueDate = issueDate.toLocalDateOrNull(),
    dueDate = dueDate.toLocalDateOrNull(),
    isOverdue = isOverdue,
    lineItems = lineItems.map { it.toDomain() },
    subtotal = subtotal.amount,
    vatAmount = vatAmount.amount,
    discount = null // Calculate from subtotal and total if needed
)

/**
 * Maps invoice line item DTO to domain model.
 */
fun InvoiceLineItemDto.toDomain(): InvoiceLineItem = InvoiceLineItem(
    description = description.toDomain(),
    quantity = quantity,
    unitPrice = unitPrice,
    total = total
)
