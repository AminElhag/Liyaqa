package com.liyaqa.platform.subscription.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.UUID

@Entity(name = "SubscriptionInvoice")
@Table(name = "subscription_invoices")
class Invoice(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "subscription_id")
    val subscriptionId: UUID? = null,

    @Column(name = "invoice_number", nullable = false, unique = true)
    val invoiceNumber: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: InvoiceStatus = InvoiceStatus.DRAFT,

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    var subtotal: BigDecimal,

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    var vatRate: BigDecimal = BigDecimal("15.00"),

    @Column(name = "vat_amount", nullable = false, precision = 12, scale = 2)
    var vatAmount: BigDecimal,

    @Column(name = "total", nullable = false, precision = 12, scale = 2)
    var total: BigDecimal,

    @Column(name = "issued_at")
    var issuedAt: LocalDate? = null,

    @Column(name = "due_date")
    var dueDate: LocalDate? = null,

    @Column(name = "paid_at")
    var paidAt: LocalDate? = null,

    @Column(name = "payment_method")
    var paymentMethod: String? = null,

    @Column(name = "notes")
    var notes: String? = null,

    @Column(name = "billing_period_start")
    var billingPeriodStart: LocalDate? = null,

    @Column(name = "billing_period_end")
    var billingPeriodEnd: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "zatca_status")
    var zatcaStatus: ZatcaStatus? = null,

    @Column(name = "zatca_invoice_hash")
    var zatcaInvoiceHash: String? = null

) : OrganizationLevelEntity(id) {

    fun issue(issueDate: LocalDate = LocalDate.now(), dueDays: Int = 30) {
        require(status == InvoiceStatus.DRAFT) {
            "Can only issue invoices in DRAFT status, current: $status"
        }
        status = InvoiceStatus.ISSUED
        issuedAt = issueDate
        dueDate = issueDate.plusDays(dueDays.toLong())
    }

    fun markPaid(paymentMethod: String? = null) {
        require(status == InvoiceStatus.ISSUED || status == InvoiceStatus.OVERDUE) {
            "Can only mark ISSUED or OVERDUE invoices as paid, current: $status"
        }
        status = InvoiceStatus.PAID
        paidAt = LocalDate.now()
        this.paymentMethod = paymentMethod
    }

    fun markOverdue() {
        require(status == InvoiceStatus.ISSUED) {
            "Can only mark ISSUED invoices as overdue, current: $status"
        }
        require(dueDate != null && LocalDate.now().isAfter(dueDate)) {
            "Invoice is not past due date"
        }
        status = InvoiceStatus.OVERDUE
    }

    fun cancel() {
        require(status == InvoiceStatus.DRAFT || status == InvoiceStatus.ISSUED || status == InvoiceStatus.OVERDUE) {
            "Cannot cancel invoice in status: $status"
        }
        status = InvoiceStatus.CANCELLED
    }

    fun refund() {
        require(status == InvoiceStatus.PAID) {
            "Can only refund PAID invoices, current: $status"
        }
        status = InvoiceStatus.REFUNDED
    }

    companion object {
        fun create(
            invoiceNumber: String,
            tenantId: UUID,
            subscriptionId: UUID?,
            subtotal: BigDecimal,
            vatRate: BigDecimal = BigDecimal("15.00")
        ): Invoice {
            val vatAmount = subtotal.multiply(vatRate).divide(BigDecimal("100"), 2, RoundingMode.HALF_UP)
            val total = subtotal.add(vatAmount)
            return Invoice(
                invoiceNumber = invoiceNumber,
                tenantId = tenantId,
                subscriptionId = subscriptionId,
                subtotal = subtotal,
                vatRate = vatRate,
                vatAmount = vatAmount,
                total = total
            )
        }
    }
}
