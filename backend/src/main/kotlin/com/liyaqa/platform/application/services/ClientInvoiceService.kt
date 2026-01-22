package com.liyaqa.platform.application.services

import com.liyaqa.platform.application.commands.CreateClientInvoiceCommand
import com.liyaqa.platform.application.commands.CreateLineItemCommand
import com.liyaqa.platform.application.commands.GenerateFromSubscriptionCommand
import com.liyaqa.platform.application.commands.IssueClientInvoiceCommand
import com.liyaqa.platform.application.commands.RecordClientPaymentCommand
import com.liyaqa.platform.application.commands.UpdateClientInvoiceCommand
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.ClientInvoice
import com.liyaqa.platform.domain.model.ClientInvoiceLineItem
import com.liyaqa.platform.domain.model.ClientInvoiceSequence
import com.liyaqa.platform.domain.model.ClientInvoiceStatus
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.platform.domain.ports.ClientInvoiceRepository
import com.liyaqa.platform.domain.ports.ClientInvoiceSequenceRepository
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service for managing client invoices (B2B billing).
 * Only accessible by platform users (internal Liyaqa team).
 */
@Service
@Transactional
class ClientInvoiceService(
    private val invoiceRepository: ClientInvoiceRepository,
    private val sequenceRepository: ClientInvoiceSequenceRepository,
    private val subscriptionRepository: ClientSubscriptionRepository,
    private val planRepository: ClientPlanRepository
) {
    private val logger = LoggerFactory.getLogger(ClientInvoiceService::class.java)

    // ============================================
    // Create Operations
    // ============================================

    /**
     * Creates a new client invoice with manual line items.
     */
    fun createInvoice(command: CreateClientInvoiceCommand): ClientInvoice {
        require(command.lineItems.isNotEmpty()) { "Invoice must have at least one line item" }

        val invoiceNumber = generateInvoiceNumber()

        val lineItems = command.lineItems.mapIndexed { index, cmd ->
            ClientInvoiceLineItem(
                description = cmd.description,
                quantity = cmd.quantity,
                unitPrice = cmd.unitPrice,
                itemType = cmd.itemType,
                sortOrder = index
            )
        }

        val invoice = ClientInvoice.create(
            invoiceNumber = invoiceNumber,
            organizationId = command.organizationId,
            subscriptionId = command.subscriptionId,
            lineItems = lineItems,
            vatRate = command.vatRate,
            notes = command.notes,
            billingPeriodStart = command.billingPeriodStart,
            billingPeriodEnd = command.billingPeriodEnd,
            salesRepId = command.salesRepId
        )

        return invoiceRepository.save(invoice)
    }

    /**
     * Generates an invoice from a subscription for a specific billing period.
     */
    fun generateFromSubscription(command: GenerateFromSubscriptionCommand): ClientInvoice {
        // Check for duplicate invoice
        val existing = invoiceRepository.findBySubscriptionIdAndBillingPeriod(
            command.subscriptionId,
            command.billingPeriodStart,
            command.billingPeriodEnd
        )
        if (existing.isPresent) {
            throw IllegalStateException(
                "Invoice already exists for subscription ${command.subscriptionId} " +
                    "and billing period ${command.billingPeriodStart} to ${command.billingPeriodEnd}"
            )
        }

        val subscription = subscriptionRepository.findById(command.subscriptionId)
            .orElseThrow { NoSuchElementException("Subscription not found: ${command.subscriptionId}") }

        val plan = planRepository.findById(subscription.clientPlanId)
            .orElseThrow { NoSuchElementException("Plan not found: ${subscription.clientPlanId}") }

        val invoiceNumber = generateInvoiceNumber()

        val invoice = ClientInvoice.createFromSubscription(
            invoiceNumber = invoiceNumber,
            subscription = subscription,
            plan = plan,
            billingPeriodStart = command.billingPeriodStart,
            billingPeriodEnd = command.billingPeriodEnd
        )

        return invoiceRepository.save(invoice)
    }

    /**
     * Generates monthly invoices for all active subscriptions with monthly billing.
     * Called by scheduled job.
     *
     * @return Number of invoices generated
     */
    fun generateMonthlyInvoices(): Int {
        val today = LocalDate.now()
        val billingPeriodStart = today.withDayOfMonth(1)
        val billingPeriodEnd = today.withDayOfMonth(today.lengthOfMonth())

        // Get all active monthly subscriptions
        val activeSubscriptions = subscriptionRepository.findByStatus(
            ClientSubscriptionStatus.ACTIVE,
            Pageable.unpaged()
        ).content.filter { it.billingCycle == BillingCycle.MONTHLY }

        var count = 0
        for (subscription in activeSubscriptions) {
            try {
                generateFromSubscription(
                    GenerateFromSubscriptionCommand(
                        subscriptionId = subscription.id,
                        billingPeriodStart = billingPeriodStart,
                        billingPeriodEnd = billingPeriodEnd
                    )
                )
                count++
                logger.info("Generated invoice for subscription ${subscription.id}")
            } catch (e: IllegalStateException) {
                // Invoice already exists for this period, skip
                logger.debug("Skipping invoice generation for subscription ${subscription.id}: ${e.message}")
            } catch (e: Exception) {
                logger.error("Failed to generate invoice for subscription ${subscription.id}: ${e.message}", e)
            }
        }

        return count
    }

    // ============================================
    // Read Operations
    // ============================================

    /**
     * Gets an invoice by ID.
     */
    @Transactional(readOnly = true)
    fun getInvoice(id: UUID): ClientInvoice {
        return invoiceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Client invoice not found: $id") }
    }

    /**
     * Gets an invoice by invoice number.
     */
    @Transactional(readOnly = true)
    fun getInvoiceByNumber(invoiceNumber: String): ClientInvoice {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
            .orElseThrow { NoSuchElementException("Client invoice not found: $invoiceNumber") }
    }

    /**
     * Gets all invoices with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllInvoices(pageable: Pageable): Page<ClientInvoice> {
        return invoiceRepository.findAll(pageable)
    }

    /**
     * Gets invoices for an organization.
     */
    @Transactional(readOnly = true)
    fun getInvoicesByOrganization(organizationId: UUID, pageable: Pageable): Page<ClientInvoice> {
        return invoiceRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Gets invoices for a subscription.
     */
    @Transactional(readOnly = true)
    fun getInvoicesBySubscription(subscriptionId: UUID, pageable: Pageable): Page<ClientInvoice> {
        return invoiceRepository.findBySubscriptionId(subscriptionId, pageable)
    }

    /**
     * Gets invoices by status.
     */
    @Transactional(readOnly = true)
    fun getInvoicesByStatus(status: ClientInvoiceStatus, pageable: Pageable): Page<ClientInvoice> {
        return invoiceRepository.findByStatus(status, pageable)
    }

    /**
     * Gets overdue invoices.
     */
    @Transactional(readOnly = true)
    fun getOverdueInvoices(pageable: Pageable): Page<ClientInvoice> {
        return invoiceRepository.findOverdueInvoices(pageable)
    }

    /**
     * Searches invoices with filters.
     */
    @Transactional(readOnly = true)
    fun searchInvoices(
        search: String?,
        status: ClientInvoiceStatus?,
        organizationId: UUID?,
        dateFrom: LocalDate?,
        dateTo: LocalDate?,
        pageable: Pageable
    ): Page<ClientInvoice> {
        return invoiceRepository.search(search, status, organizationId, dateFrom, dateTo, pageable)
    }

    /**
     * Gets invoice statistics.
     */
    @Transactional(readOnly = true)
    fun getInvoiceStats(): ClientInvoiceStats {
        return ClientInvoiceStats(
            total = invoiceRepository.count(),
            draft = invoiceRepository.countByStatus(ClientInvoiceStatus.DRAFT),
            issued = invoiceRepository.countByStatus(ClientInvoiceStatus.ISSUED),
            paid = invoiceRepository.countByStatus(ClientInvoiceStatus.PAID),
            partiallyPaid = invoiceRepository.countByStatus(ClientInvoiceStatus.PARTIALLY_PAID),
            overdue = invoiceRepository.countByStatus(ClientInvoiceStatus.OVERDUE),
            cancelled = invoiceRepository.countByStatus(ClientInvoiceStatus.CANCELLED)
        )
    }

    // ============================================
    // Update Operations
    // ============================================

    /**
     * Issues an invoice to the client.
     */
    fun issueInvoice(id: UUID, command: IssueClientInvoiceCommand): ClientInvoice {
        val invoice = getInvoice(id)
        invoice.issue(command.issueDate, command.paymentDueDays)
        return invoiceRepository.save(invoice)
    }

    /**
     * Records a payment on an invoice.
     */
    fun recordPayment(id: UUID, command: RecordClientPaymentCommand): ClientInvoice {
        val invoice = getInvoice(id)
        invoice.recordPayment(command.amount, command.paymentMethod, command.reference)
        return invoiceRepository.save(invoice)
    }

    /**
     * Cancels an invoice.
     */
    fun cancelInvoice(id: UUID): ClientInvoice {
        val invoice = getInvoice(id)
        invoice.cancel()
        return invoiceRepository.save(invoice)
    }

    /**
     * Updates an invoice (notes only for non-draft).
     */
    fun updateInvoice(id: UUID, command: UpdateClientInvoiceCommand): ClientInvoice {
        val invoice = getInvoice(id)
        command.notes?.let { invoice.notes = it }
        return invoiceRepository.save(invoice)
    }

    /**
     * Deletes a draft invoice.
     */
    fun deleteInvoice(id: UUID) {
        val invoice = getInvoice(id)
        require(invoice.status == ClientInvoiceStatus.DRAFT) {
            "Only draft invoices can be deleted"
        }
        invoiceRepository.deleteById(id)
    }

    // ============================================
    // Batch Operations
    // ============================================

    /**
     * Marks overdue invoices (called by scheduled job).
     *
     * @return Number of invoices marked as overdue
     */
    fun markOverdueInvoices(): Int {
        val today = LocalDate.now()
        val overdueInvoices = invoiceRepository.findIssuedInvoicesPastDueDate(today)

        var count = 0
        for (invoice in overdueInvoices) {
            try {
                invoice.markOverdue()
                invoiceRepository.save(invoice)
                count++
                logger.info("Marked invoice ${invoice.invoiceNumber} as overdue")
            } catch (e: Exception) {
                logger.error("Failed to mark invoice ${invoice.invoiceNumber} as overdue: ${e.message}", e)
            }
        }

        logger.info("Marked $count client invoices as overdue")
        return count
    }

    // ============================================
    // Private Helpers
    // ============================================

    /**
     * Generates a unique invoice number using pessimistic locking.
     */
    private fun generateInvoiceNumber(): String {
        val currentYear = LocalDate.now().year

        val sequence = sequenceRepository.findForUpdate().orElseGet {
            val newSequence = ClientInvoiceSequence(
                currentYear = currentYear,
                currentSequence = 0
            )
            sequenceRepository.save(newSequence)
        }

        val invoiceNumber = sequence.getNextInvoiceNumber(currentYear)
        sequenceRepository.save(sequence)

        return invoiceNumber
    }
}

/**
 * Statistics about client invoices.
 */
data class ClientInvoiceStats(
    val total: Long,
    val draft: Long,
    val issued: Long,
    val paid: Long,
    val partiallyPaid: Long,
    val overdue: Long,
    val cancelled: Long
)
