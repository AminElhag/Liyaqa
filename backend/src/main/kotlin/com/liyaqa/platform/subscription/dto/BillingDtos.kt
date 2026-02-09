package com.liyaqa.platform.subscription.dto

import com.liyaqa.platform.subscription.model.Invoice
import com.liyaqa.platform.subscription.model.InvoiceStatus
import com.liyaqa.platform.subscription.model.PaymentMethod
import com.liyaqa.platform.subscription.model.PaymentRecord
import com.liyaqa.platform.subscription.model.PaymentStatus
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.ZatcaStatus
import com.liyaqa.platform.tenant.model.Tenant
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

// --- Commands ---

data class MarkPaidCommand(
    val paymentMethod: PaymentMethod,
    val referenceNumber: String?,
    val amount: BigDecimal
)

// --- Requests ---

data class MarkPaidRequest(
    val paymentMethod: PaymentMethod,
    val referenceNumber: String? = null,
    val amount: BigDecimal
) {
    fun toCommand() = MarkPaidCommand(
        paymentMethod = paymentMethod,
        referenceNumber = referenceNumber,
        amount = amount
    )
}

// --- Responses ---

data class InvoiceResponse(
    val id: UUID,
    val tenantId: UUID,
    val subscriptionId: UUID?,
    val invoiceNumber: String,
    val status: InvoiceStatus,
    val subtotal: BigDecimal,
    val vatRate: BigDecimal,
    val vatAmount: BigDecimal,
    val total: BigDecimal,
    val issuedAt: LocalDate?,
    val dueDate: LocalDate?,
    val paidAt: LocalDate?,
    val paymentMethod: String?,
    val notes: String?,
    val billingPeriodStart: LocalDate?,
    val billingPeriodEnd: LocalDate?,
    val zatcaStatus: ZatcaStatus?,
    val zatcaInvoiceHash: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(invoice: Invoice) = InvoiceResponse(
            id = invoice.id,
            tenantId = invoice.tenantId,
            subscriptionId = invoice.subscriptionId,
            invoiceNumber = invoice.invoiceNumber,
            status = invoice.status,
            subtotal = invoice.subtotal,
            vatRate = invoice.vatRate,
            vatAmount = invoice.vatAmount,
            total = invoice.total,
            issuedAt = invoice.issuedAt,
            dueDate = invoice.dueDate,
            paidAt = invoice.paidAt,
            paymentMethod = invoice.paymentMethod,
            notes = invoice.notes,
            billingPeriodStart = invoice.billingPeriodStart,
            billingPeriodEnd = invoice.billingPeriodEnd,
            zatcaStatus = invoice.zatcaStatus,
            zatcaInvoiceHash = invoice.zatcaInvoiceHash,
            createdAt = invoice.createdAt,
            updatedAt = invoice.updatedAt
        )
    }
}

data class PaymentRecordResponse(
    val id: UUID,
    val invoiceId: UUID,
    val tenantId: UUID,
    val amount: BigDecimal,
    val method: PaymentMethod,
    val referenceNumber: String?,
    val processedAt: Instant,
    val status: PaymentStatus,
    val createdAt: Instant
) {
    companion object {
        fun from(record: PaymentRecord) = PaymentRecordResponse(
            id = record.id,
            invoiceId = record.invoiceId,
            tenantId = record.tenantId,
            amount = record.amount,
            method = record.method,
            referenceNumber = record.referenceNumber,
            processedAt = record.processedAt,
            status = record.status,
            createdAt = record.createdAt
        )
    }
}

data class RevenueMetricsResponse(
    val mrr: BigDecimal,
    val arr: BigDecimal,
    val mrrGrowthPercent: BigDecimal,
    val totalOutstanding: BigDecimal
)

data class PlanRevenueResponse(
    val planId: UUID,
    val planName: String,
    val tier: PlanTier,
    val activeSubscriptions: Int,
    val monthlyRevenue: BigDecimal
)

data class OutstandingInvoiceResponse(
    val invoiceId: UUID,
    val tenantId: UUID,
    val facilityName: String,
    val invoiceNumber: String,
    val total: BigDecimal,
    val dueDate: LocalDate?,
    val daysPastDue: Long,
    val status: InvoiceStatus
) {
    companion object {
        fun from(invoice: Invoice, tenant: Tenant) = OutstandingInvoiceResponse(
            invoiceId = invoice.id,
            tenantId = invoice.tenantId,
            facilityName = tenant.facilityName,
            invoiceNumber = invoice.invoiceNumber,
            total = invoice.total,
            dueDate = invoice.dueDate,
            daysPastDue = if (invoice.dueDate != null) ChronoUnit.DAYS.between(invoice.dueDate, LocalDate.now()).coerceAtLeast(0) else 0,
            status = invoice.status
        )
    }
}
