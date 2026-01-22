package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.OrganizationLevelEntity
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
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.UUID

/**
 * Represents a B2B invoice for a client organization.
 * Used to bill clients for their platform subscriptions.
 *
 * This is a platform-level entity (no tenant_id) managed by the Liyaqa internal team.
 */
@Entity
@Table(name = "client_invoices")
class ClientInvoice(
    id: UUID = UUID.randomUUID(),

    /**
     * Unique invoice number (e.g., CINV-2026-00001).
     */
    @Column(name = "invoice_number", nullable = false, unique = true)
    val invoiceNumber: String,

    /**
     * The organization (client) being billed.
     */
    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    /**
     * The client subscription this invoice is for (if subscription-based).
     */
    @Column(name = "client_subscription_id")
    val subscriptionId: UUID? = null,

    /**
     * Current status of the invoice.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ClientInvoiceStatus = ClientInvoiceStatus.DRAFT,

    /**
     * Date the invoice was issued to the client.
     */
    @Column(name = "issue_date")
    var issueDate: LocalDate? = null,

    /**
     * Payment due date.
     */
    @Column(name = "due_date")
    var dueDate: LocalDate? = null,

    /**
     * Date the invoice was paid.
     */
    @Column(name = "paid_date")
    var paidDate: LocalDate? = null,

    /**
     * Start of the billing period (for recurring invoices).
     */
    @Column(name = "billing_period_start")
    var billingPeriodStart: LocalDate? = null,

    /**
     * End of the billing period (for recurring invoices).
     */
    @Column(name = "billing_period_end")
    var billingPeriodEnd: LocalDate? = null,

    /**
     * Invoice subtotal (before VAT).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "subtotal_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "subtotal_currency", nullable = false))
    )
    var subtotal: Money,

    /**
     * VAT rate percentage (default 15% for Saudi Arabia).
     */
    @Column(name = "vat_rate", nullable = false)
    var vatRate: BigDecimal = BigDecimal("15.00"),

    /**
     * Calculated VAT amount.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "vat_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "vat_currency", nullable = false))
    )
    var vatAmount: Money,

    /**
     * Total amount including VAT.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "total_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "total_currency", nullable = false))
    )
    var totalAmount: Money,

    /**
     * Amount paid (may be partial).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "paid_amount")),
        AttributeOverride(name = "currency", column = Column(name = "paid_currency"))
    )
    var paidAmount: Money? = null,

    /**
     * Notes (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "notes_en")),
        AttributeOverride(name = "ar", column = Column(name = "notes_ar"))
    )
    var notes: LocalizedText? = null,

    /**
     * Payment method used.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    var paymentMethod: ClientPaymentMethod? = null,

    /**
     * Payment reference (transaction ID, check number, etc.).
     */
    @Column(name = "payment_reference")
    var paymentReference: String? = null,

    /**
     * Sales rep attributed to this invoice.
     */
    @Column(name = "sales_rep_id")
    val salesRepId: UUID? = null,

    /**
     * Invoice line items.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "client_invoice_line_items",
        joinColumns = [JoinColumn(name = "invoice_id")]
    )
    @OrderBy("line_sort_order ASC")
    var lineItems: MutableList<ClientInvoiceLineItem> = mutableListOf()

) : OrganizationLevelEntity(id) {

    // ============================================
    // Domain Methods - Status Transitions
    // ============================================

    /**
     * Issues the invoice to the client.
     */
    fun issue(issueDate: LocalDate = LocalDate.now(), paymentDueDays: Int = 30) {
        require(status == ClientInvoiceStatus.DRAFT) { "Only draft invoices can be issued" }
        require(lineItems.isNotEmpty()) { "Invoice must have at least one line item" }

        this.issueDate = issueDate
        this.dueDate = issueDate.plusDays(paymentDueDays.toLong())
        this.status = ClientInvoiceStatus.ISSUED
    }

    /**
     * Records a payment on the invoice.
     */
    fun recordPayment(amount: Money, method: ClientPaymentMethod, reference: String? = null) {
        require(status in listOf(
            ClientInvoiceStatus.ISSUED,
            ClientInvoiceStatus.OVERDUE,
            ClientInvoiceStatus.PARTIALLY_PAID
        )) {
            "Cannot record payment on invoice with status: $status"
        }

        val currentPaid = paidAmount ?: Money.of(BigDecimal.ZERO, totalAmount.currency)
        val newPaidAmount = currentPaid + amount

        this.paidAmount = newPaidAmount
        this.paymentMethod = method
        this.paymentReference = reference

        when {
            newPaidAmount >= totalAmount -> {
                this.status = ClientInvoiceStatus.PAID
                this.paidDate = LocalDate.now()
            }
            newPaidAmount.isPositive() -> {
                this.status = ClientInvoiceStatus.PARTIALLY_PAID
            }
        }
    }

    /**
     * Cancels the invoice.
     */
    fun cancel() {
        require(status in listOf(
            ClientInvoiceStatus.DRAFT,
            ClientInvoiceStatus.ISSUED,
            ClientInvoiceStatus.OVERDUE
        )) {
            "Cannot cancel invoice with status: $status"
        }
        this.status = ClientInvoiceStatus.CANCELLED
    }

    /**
     * Marks the invoice as overdue.
     */
    fun markOverdue() {
        require(status == ClientInvoiceStatus.ISSUED) { "Only issued invoices can be marked overdue" }
        require(dueDate != null && LocalDate.now().isAfter(dueDate)) { "Invoice is not past due date" }
        this.status = ClientInvoiceStatus.OVERDUE
    }

    // ============================================
    // Domain Methods - Line Items
    // ============================================

    /**
     * Adds a line item to the invoice.
     */
    fun addLineItem(item: ClientInvoiceLineItem) {
        require(status == ClientInvoiceStatus.DRAFT) { "Cannot modify non-draft invoice" }
        lineItems.add(item)
        recalculateTotals()
    }

    /**
     * Removes a line item from the invoice.
     */
    fun removeLineItem(itemId: UUID) {
        require(status == ClientInvoiceStatus.DRAFT) { "Cannot modify non-draft invoice" }
        lineItems.removeIf { it.id == itemId }
        recalculateTotals()
    }

    /**
     * Recalculates subtotal, VAT, and total from line items.
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

        for (item in lineItems) {
            newSubtotal = newSubtotal + item.lineTotal()
        }

        subtotal = newSubtotal
        vatAmount = Money.of(
            newSubtotal.amount.multiply(vatRate).divide(BigDecimal("100"), 2, RoundingMode.HALF_UP),
            currency
        )
        totalAmount = subtotal + vatAmount
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

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
    fun isFullyPaid(): Boolean = status == ClientInvoiceStatus.PAID

    /**
     * Checks if the invoice is overdue.
     */
    fun isOverdue(): Boolean {
        return status == ClientInvoiceStatus.ISSUED &&
            dueDate != null &&
            LocalDate.now().isAfter(dueDate)
    }

    // ============================================
    // Factory Methods
    // ============================================

    companion object {
        /**
         * Creates a client invoice with calculated VAT (15% Saudi Arabia default).
         */
        fun create(
            invoiceNumber: String,
            organizationId: UUID,
            subscriptionId: UUID? = null,
            lineItems: List<ClientInvoiceLineItem>,
            vatRate: BigDecimal = BigDecimal("15.00"),
            notes: LocalizedText? = null,
            billingPeriodStart: LocalDate? = null,
            billingPeriodEnd: LocalDate? = null,
            salesRepId: UUID? = null
        ): ClientInvoice {
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

            return ClientInvoice(
                invoiceNumber = invoiceNumber,
                organizationId = organizationId,
                subscriptionId = subscriptionId,
                subtotal = subtotal,
                vatRate = vatRate,
                vatAmount = vatAmount,
                totalAmount = totalAmount,
                notes = notes,
                billingPeriodStart = billingPeriodStart,
                billingPeriodEnd = billingPeriodEnd,
                salesRepId = salesRepId,
                lineItems = lineItems.toMutableList()
            )
        }

        /**
         * Creates a client invoice from a subscription.
         * Generates a single line item for the subscription fee.
         */
        fun createFromSubscription(
            invoiceNumber: String,
            subscription: ClientSubscription,
            plan: ClientPlan,
            billingPeriodStart: LocalDate,
            billingPeriodEnd: LocalDate,
            vatRate: BigDecimal = BigDecimal("15.00")
        ): ClientInvoice {
            val lineItem = ClientInvoiceLineItem(
                description = LocalizedText(
                    en = "${plan.name.en} - Platform Subscription (${subscription.billingCycle})",
                    ar = plan.name.ar?.let { "$it - اشتراك المنصة (${subscription.billingCycle})" }
                ),
                quantity = 1,
                unitPrice = subscription.agreedPrice,
                itemType = ClientInvoiceLineItemType.SUBSCRIPTION,
                sortOrder = 0
            )

            return create(
                invoiceNumber = invoiceNumber,
                organizationId = subscription.organizationId,
                subscriptionId = subscription.id,
                lineItems = listOf(lineItem),
                vatRate = vatRate,
                billingPeriodStart = billingPeriodStart,
                billingPeriodEnd = billingPeriodEnd,
                salesRepId = subscription.salesRepId
            )
        }
    }
}
