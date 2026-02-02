package com.liyaqa.billing.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.OrganizationAwareEntity
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.UUID

/**
 * Invoice entity for billing members.
 * Uses OrganizationAwareEntity for cross-club queries at organization level.
 */
@Entity
@Table(name = "invoices")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Filter(name = "organizationFilter", condition = "organization_id = :organizationId")
class Invoice(
    id: UUID = UUID.randomUUID(),

    @Column(name = "invoice_number", nullable = false, unique = true)
    val invoiceNumber: String,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "subscription_id")
    val subscriptionId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: InvoiceStatus = InvoiceStatus.DRAFT,

    @Column(name = "issue_date")
    var issueDate: LocalDate? = null,

    @Column(name = "due_date")
    var dueDate: LocalDate? = null,

    @Column(name = "paid_date")
    var paidDate: LocalDate? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "subtotal_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "subtotal_currency", nullable = false))
    )
    var subtotal: Money,

    @Column(name = "vat_rate", nullable = false)
    var vatRate: BigDecimal = BigDecimal("15.00"),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "vat_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "vat_currency", nullable = false))
    )
    var vatAmount: Money,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "total_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "total_currency", nullable = false))
    )
    var totalAmount: Money,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "paid_amount")),
        AttributeOverride(name = "currency", column = Column(name = "paid_currency"))
    )
    var paidAmount: Money? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "notes_en")),
        AttributeOverride(name = "ar", column = Column(name = "notes_ar"))
    )
    var notes: LocalizedText? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    var paymentMethod: PaymentMethod? = null,

    @Column(name = "payment_reference")
    var paymentReference: String? = null,

    @Column(name = "zatca_invoice_hash")
    var zatcaInvoiceHash: String? = null,

    @Column(name = "zatca_qr_code", columnDefinition = "TEXT")
    var zatcaQrCode: String? = null,

    // ==================== STC PAY FIELDS ====================
    @Column(name = "stcpay_transaction_id")
    var stcpayTransactionId: String? = null,

    @Column(name = "stcpay_otp_reference")
    var stcpayOtpReference: String? = null,

    @Column(name = "stcpay_payment_reference")
    var stcpayPaymentReference: String? = null,

    // ==================== SADAD FIELDS ====================
    @Column(name = "sadad_bill_number")
    var sadadBillNumber: String? = null,

    @Column(name = "sadad_bill_account")
    var sadadBillAccount: String? = null,

    @Column(name = "sadad_due_date")
    var sadadDueDate: LocalDate? = null,

    @Column(name = "sadad_status")
    var sadadStatus: String? = null,

    // ==================== TAMARA FIELDS ====================
    @Column(name = "tamara_order_id")
    var tamaraOrderId: String? = null,

    @Column(name = "tamara_checkout_id")
    var tamaraCheckoutId: String? = null,

    @Column(name = "tamara_status")
    var tamaraStatus: String? = null,

    @Column(name = "tamara_instalments")
    var tamaraInstalments: Int? = null,

    // ==================== PAYMENT RETRY TRACKING ====================
    @Column(name = "payment_retry_count")
    var paymentRetryCount: Int? = 0,

    @Column(name = "last_payment_retry_at")
    var lastPaymentRetryAt: java.time.Instant? = null,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "invoice_line_items",
        joinColumns = [JoinColumn(name = "invoice_id")]
    )
    @OrderBy("line_sort_order ASC")
    var lineItems: MutableList<InvoiceLineItem> = mutableListOf()

) : OrganizationAwareEntity(id) {

    /**
     * Issues the invoice to the member.
     */
    fun issue(issueDate: LocalDate = LocalDate.now(), paymentDueDays: Int = 7) {
        require(status == InvoiceStatus.DRAFT) { "Only draft invoices can be issued" }
        require(lineItems.isNotEmpty()) { "Invoice must have at least one line item" }

        this.issueDate = issueDate
        this.dueDate = issueDate.plusDays(paymentDueDays.toLong())
        this.status = InvoiceStatus.ISSUED
    }

    /**
     * Records a payment on the invoice.
     */
    fun recordPayment(amount: Money, method: PaymentMethod, reference: String? = null) {
        require(status in listOf(InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID)) {
            "Cannot record payment on invoice with status: $status"
        }

        val currentPaid = paidAmount ?: Money.of(BigDecimal.ZERO, totalAmount.currency)
        val newPaidAmount = currentPaid + amount

        this.paidAmount = newPaidAmount
        this.paymentMethod = method
        this.paymentReference = reference

        when {
            newPaidAmount >= totalAmount -> {
                this.status = InvoiceStatus.PAID
                this.paidDate = LocalDate.now()
            }
            newPaidAmount.isPositive() -> {
                this.status = InvoiceStatus.PARTIALLY_PAID
            }
        }
    }

    /**
     * Cancels the invoice.
     */
    fun cancel() {
        require(status in listOf(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE)) {
            "Cannot cancel invoice with status: $status"
        }
        this.status = InvoiceStatus.CANCELLED
    }

    /**
     * Marks the invoice as overdue.
     */
    fun markOverdue() {
        require(status == InvoiceStatus.ISSUED) { "Only issued invoices can be marked overdue" }
        require(dueDate != null && LocalDate.now().isAfter(dueDate)) { "Invoice is not past due date" }
        this.status = InvoiceStatus.OVERDUE
    }

    /**
     * Adds a line item to the invoice.
     */
    fun addLineItem(item: InvoiceLineItem) {
        require(status == InvoiceStatus.DRAFT) { "Cannot modify non-draft invoice" }
        lineItems.add(item)
        recalculateTotals()
    }

    /**
     * Removes a line item from the invoice.
     */
    fun removeLineItem(itemId: UUID) {
        require(status == InvoiceStatus.DRAFT) { "Cannot modify non-draft invoice" }
        lineItems.removeIf { it.id == itemId }
        recalculateTotals()
    }

    /**
     * Recalculates subtotal, VAT, and total from line items.
     * Uses per-line-item tax rates for multi-fee invoicing.
     */
    fun recalculateTotals() {
        if (lineItems.isEmpty()) {
            val currency = subtotal.currency
            subtotal = Money.of(BigDecimal.ZERO, currency)
            vatAmount = Money.of(BigDecimal.ZERO, currency)
            totalAmount = Money.of(BigDecimal.ZERO, currency)
            return
        }

        val currency = lineItems.first().unitPrice.currency
        var newSubtotal = Money.of(BigDecimal.ZERO, currency)
        var newTaxTotal = Money.of(BigDecimal.ZERO, currency)

        for (item in lineItems) {
            newSubtotal = newSubtotal + item.lineTotal()
            newTaxTotal = newTaxTotal + item.lineTaxAmount()
        }

        subtotal = newSubtotal
        vatAmount = newTaxTotal  // Now sum of per-item taxes
        totalAmount = subtotal + vatAmount
    }

    /**
     * Gets the remaining balance to be paid.
     */
    fun remainingBalance(): Money {
        val paid = paidAmount ?: Money.of(BigDecimal.ZERO, totalAmount.currency)
        return totalAmount - paid
    }

    /**
     * Checks if the invoice is fully paid.
     */
    fun isFullyPaid(): Boolean = status == InvoiceStatus.PAID

    /**
     * Checks if the invoice is overdue.
     */
    fun isOverdue(): Boolean {
        return status == InvoiceStatus.ISSUED &&
            dueDate != null &&
            LocalDate.now().isAfter(dueDate)
    }

    companion object {
        /**
         * Creates an invoice with calculated VAT (15% Saudi Arabia default).
         */
        fun create(
            invoiceNumber: String,
            memberId: UUID,
            subscriptionId: UUID? = null,
            lineItems: List<InvoiceLineItem>,
            vatRate: BigDecimal = BigDecimal("15.00"),
            notes: LocalizedText? = null
        ): Invoice {
            require(lineItems.isNotEmpty()) { "Invoice must have at least one line item" }

            val currency = lineItems.first().unitPrice.currency
            var subtotal = Money.of(BigDecimal.ZERO, currency)

            for (item in lineItems) {
                subtotal = subtotal + item.lineTotal()
            }

            val vatAmount = Money.of(
                subtotal.amount.multiply(vatRate).divide(BigDecimal("100"), 2, RoundingMode.HALF_UP),
                currency
            )
            val totalAmount = subtotal + vatAmount

            return Invoice(
                invoiceNumber = invoiceNumber,
                memberId = memberId,
                subscriptionId = subscriptionId,
                subtotal = subtotal,
                vatRate = vatRate,
                vatAmount = vatAmount,
                totalAmount = totalAmount,
                notes = notes,
                lineItems = lineItems.toMutableList()
            )
        }
    }
}
