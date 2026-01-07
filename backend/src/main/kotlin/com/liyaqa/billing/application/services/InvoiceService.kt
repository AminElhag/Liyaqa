package com.liyaqa.billing.application.services

import com.liyaqa.billing.application.commands.CreateInvoiceCommand
import com.liyaqa.billing.application.commands.CreateSubscriptionInvoiceCommand
import com.liyaqa.billing.application.commands.IssueInvoiceCommand
import com.liyaqa.billing.application.commands.RecordPaymentCommand
import com.liyaqa.billing.application.commands.UpdateInvoiceCommand
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.InvoiceSequence
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.billing.domain.ports.InvoiceSequenceRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class InvoiceService(
    private val invoiceRepository: InvoiceRepository,
    private val invoiceSequenceRepository: InvoiceSequenceRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val membershipPlanRepository: MembershipPlanRepository
) {
    /**
     * Creates a new invoice with the specified line items.
     */
    fun createInvoice(command: CreateInvoiceCommand): Invoice {
        // Validate member exists
        if (!memberRepository.existsById(command.memberId)) {
            throw NoSuchElementException("Member not found: ${command.memberId}")
        }

        // Generate invoice number
        val organizationId = TenantContext.getCurrentOrganizationOrNull()?.value
            ?: throw IllegalStateException("Organization context is required")

        val invoiceNumber = generateInvoiceNumber(organizationId)

        // Convert line item commands to entities
        val lineItems = command.lineItems.mapIndexed { index, cmd ->
            InvoiceLineItem(
                description = cmd.description,
                quantity = cmd.quantity,
                unitPrice = cmd.unitPrice,
                itemType = cmd.itemType,
                sortOrder = index
            )
        }

        // Create invoice
        val invoice = Invoice.create(
            invoiceNumber = invoiceNumber,
            memberId = command.memberId,
            subscriptionId = command.subscriptionId,
            lineItems = lineItems,
            vatRate = command.vatRate,
            notes = command.notes
        )

        // Set organization context
        invoice.setTenantAndOrganization(
            TenantContext.getCurrentTenant().value,
            organizationId
        )

        return invoiceRepository.save(invoice)
    }

    /**
     * Creates an invoice from a subscription.
     */
    fun createInvoiceFromSubscription(command: CreateSubscriptionInvoiceCommand): Invoice {
        val subscription = subscriptionRepository.findById(command.subscriptionId)
            .orElseThrow { NoSuchElementException("Subscription not found: ${command.subscriptionId}") }

        val plan = membershipPlanRepository.findById(subscription.planId)
            .orElseThrow { NoSuchElementException("Membership plan not found: ${subscription.planId}") }

        val member = memberRepository.findById(subscription.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${subscription.memberId}") }

        // Generate invoice number
        val organizationId = TenantContext.getCurrentOrganizationOrNull()?.value
            ?: throw IllegalStateException("Organization context is required")

        val invoiceNumber = generateInvoiceNumber(organizationId)

        // Create line item for subscription
        val lineItem = InvoiceLineItem(
            description = LocalizedText(
                en = "${plan.name.en} - Membership Subscription",
                ar = plan.name.ar?.let { "$it - اشتراك العضوية" }
            ),
            quantity = 1,
            unitPrice = plan.price,
            itemType = LineItemType.SUBSCRIPTION,
            sortOrder = 0
        )

        // Create invoice
        val invoice = Invoice.create(
            invoiceNumber = invoiceNumber,
            memberId = subscription.memberId,
            subscriptionId = subscription.id,
            lineItems = listOf(lineItem),
            notes = command.notes
        )

        // Set organization context
        invoice.setTenantAndOrganization(
            TenantContext.getCurrentTenant().value,
            organizationId
        )

        return invoiceRepository.save(invoice)
    }

    /**
     * Generates a unique invoice number for the organization.
     */
    private fun generateInvoiceNumber(organizationId: UUID): String {
        val currentYear = LocalDate.now().year

        val sequence = invoiceSequenceRepository.findByOrganizationId(organizationId)
            .orElseGet {
                InvoiceSequence(
                    organizationId = organizationId,
                    currentYear = currentYear,
                    currentSequence = 0
                )
            }

        val invoiceNumber = sequence.getNextInvoiceNumber(currentYear)
        invoiceSequenceRepository.save(sequence)

        return invoiceNumber
    }

    /**
     * Gets an invoice by ID.
     */
    @Transactional(readOnly = true)
    fun getInvoice(id: UUID): Invoice {
        return invoiceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Invoice not found: $id") }
    }

    /**
     * Gets an invoice by invoice number.
     */
    @Transactional(readOnly = true)
    fun getInvoiceByNumber(invoiceNumber: String): Invoice {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
            .orElseThrow { NoSuchElementException("Invoice not found: $invoiceNumber") }
    }

    /**
     * Gets all invoices with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllInvoices(pageable: Pageable): Page<Invoice> {
        return invoiceRepository.findAll(pageable)
    }

    /**
     * Gets invoices for a member.
     */
    @Transactional(readOnly = true)
    fun getInvoicesByMember(memberId: UUID, pageable: Pageable): Page<Invoice> {
        return invoiceRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets invoices by status.
     */
    @Transactional(readOnly = true)
    fun getInvoicesByStatus(status: InvoiceStatus, pageable: Pageable): Page<Invoice> {
        return invoiceRepository.findByStatus(status, pageable)
    }

    /**
     * Gets pending (unpaid) invoices.
     */
    @Transactional(readOnly = true)
    fun getPendingInvoices(pageable: Pageable): Page<Invoice> {
        return invoiceRepository.findByStatus(InvoiceStatus.ISSUED, pageable)
    }

    /**
     * Gets overdue invoices.
     */
    @Transactional(readOnly = true)
    fun getOverdueInvoices(pageable: Pageable): Page<Invoice> {
        return invoiceRepository.findOverdueInvoices(pageable)
    }

    /**
     * Issues a draft invoice.
     */
    fun issueInvoice(id: UUID, command: IssueInvoiceCommand): Invoice {
        val invoice = invoiceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Invoice not found: $id") }

        invoice.issue(command.issueDate, command.paymentDueDays)
        return invoiceRepository.save(invoice)
    }

    /**
     * Records a payment on an invoice.
     */
    fun recordPayment(id: UUID, command: RecordPaymentCommand): Invoice {
        val invoice = invoiceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Invoice not found: $id") }

        invoice.recordPayment(command.amount, command.paymentMethod, command.reference)
        return invoiceRepository.save(invoice)
    }

    /**
     * Cancels an invoice.
     */
    fun cancelInvoice(id: UUID): Invoice {
        val invoice = invoiceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Invoice not found: $id") }

        invoice.cancel()
        return invoiceRepository.save(invoice)
    }

    /**
     * Updates invoice notes.
     */
    fun updateInvoice(id: UUID, command: UpdateInvoiceCommand): Invoice {
        val invoice = invoiceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Invoice not found: $id") }

        command.notes?.let { invoice.notes = it }
        return invoiceRepository.save(invoice)
    }

    /**
     * Marks overdue invoices. Called by scheduled job.
     */
    fun markOverdueInvoices(): Int {
        val today = LocalDate.now()
        var count = 0

        val overdueInvoices = invoiceRepository.findIssuedInvoicesPastDueDate(today, Pageable.unpaged())

        for (invoice in overdueInvoices) {
            invoice.markOverdue()
            invoiceRepository.save(invoice)
            count++
        }

        return count
    }

    /**
     * Counts pending invoices.
     */
    @Transactional(readOnly = true)
    fun countPendingInvoices(): Long {
        return invoiceRepository.countByStatus(InvoiceStatus.ISSUED) +
            invoiceRepository.countByStatus(InvoiceStatus.OVERDUE)
    }

    /**
     * Counts invoices by status.
     */
    @Transactional(readOnly = true)
    fun countByStatus(status: InvoiceStatus): Long {
        return invoiceRepository.countByStatus(status)
    }
}
