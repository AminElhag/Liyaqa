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
import com.liyaqa.billing.infrastructure.config.BillingConfig
import com.liyaqa.billing.infrastructure.zatca.ZatcaService
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
@Transactional
class InvoiceService(
    private val invoiceRepository: InvoiceRepository,
    private val invoiceSequenceRepository: InvoiceSequenceRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val membershipPlanRepository: MembershipPlanRepository,
    private val notificationService: NotificationService,
    private val zatcaService: ZatcaService,
    private val billingConfig: BillingConfig,
    private val clubRepository: ClubRepository
) {
    private val logger = LoggerFactory.getLogger(InvoiceService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    /**
     * Creates a new invoice with the specified line items.
     */
    fun createInvoice(command: CreateInvoiceCommand): Invoice {
        // Validate member exists and get member for tenant resolution
        val member = memberRepository.findById(command.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${command.memberId}") }

        // Get organization ID from context or resolve from member's tenant
        val tenantId = member.tenantId
        val organizationId = TenantContext.getCurrentOrganizationOrNull()?.value
            ?: resolveOrganizationFromTenant(tenantId)
            ?: throw IllegalStateException("Organization context is required and could not be resolved from tenant")

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
     * Allows multiple invoices per subscription (for renewals, additional charges, etc.)
     * but prevents creating a new invoice if there's already an unpaid one.
     */
    fun createInvoiceFromSubscription(command: CreateSubscriptionInvoiceCommand): Invoice {
        val subscription = subscriptionRepository.findById(command.subscriptionId)
            .orElseThrow { NoSuchElementException("Subscription not found: ${command.subscriptionId}") }

        // Check if there's already an unpaid invoice for this subscription
        // Block creation if any invoice exists with: DRAFT, ISSUED, OVERDUE, or PARTIALLY_PAID status
        val unpaidInvoices = invoiceRepository.findBySubscriptionIdAndStatusIn(
            command.subscriptionId,
            listOf(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID)
        )
        if (unpaidInvoices.isNotEmpty()) {
            val existingInvoice = unpaidInvoices.first()
            throw IllegalStateException(
                "Cannot create invoice: subscription ${command.subscriptionId} already has an unpaid invoice. " +
                "Invoice #${existingInvoice.invoiceNumber} is ${existingInvoice.status}. " +
                "Please resolve the existing invoice first (pay, cancel, or refund)."
            )
        }

        val plan = membershipPlanRepository.findById(subscription.planId)
            .orElseThrow { NoSuchElementException("Membership plan not found: ${subscription.planId}") }

        val member = memberRepository.findById(subscription.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${subscription.memberId}") }

        // Get organization ID from context or resolve from subscription's tenant
        val tenantId = subscription.tenantId
        val organizationId = TenantContext.getCurrentOrganizationOrNull()?.value
            ?: resolveOrganizationFromTenant(tenantId)
            ?: throw IllegalStateException("Organization context is required and could not be resolved from tenant")

        // Generate invoice number
        val invoiceNumber = generateInvoiceNumber(organizationId)

        // Check if this is the member's first-ever subscription (for join fee)
        // Count total subscriptions for the member - if only 1 exists (the current one), include join fee
        val totalMemberSubscriptions = subscriptionRepository.countByMemberId(subscription.memberId)
        val isFirstEverSubscription = totalMemberSubscriptions <= 1

        // Build line items based on plan fee structure
        val lineItems = mutableListOf<InvoiceLineItem>()
        var sortOrder = 0

        // Membership Fee (if set)
        if (!plan.membershipFee.isZero()) {
            lineItems.add(InvoiceLineItem(
                description = LocalizedText(
                    en = "Membership Fee - ${plan.name.en}",
                    ar = plan.name.ar?.let { "رسوم العضوية - $it" } ?: "رسوم العضوية - ${plan.name.en}"
                ),
                quantity = 1,
                unitPrice = plan.membershipFee.getNetAmount(),
                taxRate = plan.membershipFee.taxRate,
                itemType = LineItemType.SUBSCRIPTION,
                sortOrder = sortOrder++
            ))
        }

        // Administration Fee (if set)
        if (!plan.administrationFee.isZero()) {
            lineItems.add(InvoiceLineItem(
                description = LocalizedText(
                    en = "Administration Fee",
                    ar = "رسوم إدارية"
                ),
                quantity = 1,
                unitPrice = plan.administrationFee.getNetAmount(),
                taxRate = plan.administrationFee.taxRate,
                itemType = LineItemType.OTHER,
                sortOrder = sortOrder++
            ))
        }

        // Join Fee (only for member's first-ever subscription to the club)
        if (isFirstEverSubscription && !plan.joinFee.isZero()) {
            lineItems.add(InvoiceLineItem(
                description = LocalizedText(
                    en = "Joining Fee (One-time)",
                    ar = "رسوم الانضمام (مرة واحدة)"
                ),
                quantity = 1,
                unitPrice = plan.joinFee.getNetAmount(),
                taxRate = plan.joinFee.taxRate,
                itemType = LineItemType.OTHER,
                sortOrder = sortOrder++
            ))
        }

        // Ensure at least one line item exists
        require(lineItems.isNotEmpty()) {
            "Cannot create invoice: plan ${plan.id} has no fees configured"
        }

        // Create invoice with per-line-item tax calculation (vatRate is still used as default)
        val invoice = Invoice.create(
            invoiceNumber = invoiceNumber,
            memberId = subscription.memberId,
            subscriptionId = subscription.id,
            lineItems = lineItems,
            vatRate = billingConfig.defaultVatRate,
            notes = command.notes
        )

        // Set organization context using subscription's tenant
        invoice.setTenantAndOrganization(
            tenantId,
            organizationId
        )

        return invoiceRepository.save(invoice)
    }

    /**
     * Generates a unique invoice number for the organization.
     * Uses pessimistic locking to prevent race conditions when multiple
     * invoices are created concurrently.
     */
    private fun generateInvoiceNumber(organizationId: UUID): String {
        val currentYear = LocalDate.now().year

        // Use pessimistic write lock to prevent concurrent modifications
        val sequence = invoiceSequenceRepository.findByOrganizationIdForUpdate(organizationId)
            .orElseGet {
                // If no sequence exists, create and save a new one
                // The save will acquire a lock for the new row
                val newSequence = InvoiceSequence(
                    organizationId = organizationId,
                    currentYear = currentYear,
                    currentSequence = 0
                )
                invoiceSequenceRepository.save(newSequence)
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
     * Search invoices with filters.
     */
    @Transactional(readOnly = true)
    fun searchInvoices(
        search: String?,
        status: InvoiceStatus?,
        memberId: UUID?,
        dateFrom: LocalDate?,
        dateTo: LocalDate?,
        pageable: Pageable
    ): Page<Invoice> {
        return invoiceRepository.search(search, status, memberId, dateFrom, dateTo, pageable)
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

        // Generate Zatca compliance data (QR code and hash)
        try {
            val zatcaData = zatcaService.generateZatcaCompliance(invoice)
            if (zatcaData != null) {
                invoice.zatcaQrCode = zatcaData.qrCodeBase64
                invoice.zatcaInvoiceHash = zatcaData.invoiceHash
                logger.info("Zatca compliance data generated for invoice ${invoice.invoiceNumber}")
            }
        } catch (e: Exception) {
            logger.error("Failed to generate Zatca compliance data for invoice ${invoice.invoiceNumber}: ${e.message}", e)
            // Continue without Zatca data - don't fail invoice issuance
        }

        val savedInvoice = invoiceRepository.save(invoice)

        // Send invoice notification
        try {
            val member = memberRepository.findById(invoice.memberId).orElse(null)
            if (member != null) {
                sendInvoiceCreatedNotification(member, savedInvoice)
            }
        } catch (e: Exception) {
            logger.error("Failed to send invoice notification: ${e.message}", e)
        }

        return savedInvoice
    }

    /**
     * Records a payment on an invoice.
     */
    fun recordPayment(id: UUID, command: RecordPaymentCommand): Invoice {
        val invoice = invoiceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Invoice not found: $id") }

        val wasPaid = invoice.status == InvoiceStatus.PAID
        invoice.recordPayment(command.amount, command.paymentMethod, command.reference)
        val savedInvoice = invoiceRepository.save(invoice)

        // Send payment notification if fully paid
        if (!wasPaid && savedInvoice.status == InvoiceStatus.PAID) {
            try {
                val member = memberRepository.findById(invoice.memberId).orElse(null)
                if (member != null) {
                    sendPaymentConfirmationNotification(member, savedInvoice)
                }
            } catch (e: Exception) {
                logger.error("Failed to send payment notification: ${e.message}", e)
            }

            // Activate subscription if invoice is for a subscription
            if (savedInvoice.subscriptionId != null) {
                try {
                    subscriptionRepository.findById(savedInvoice.subscriptionId!!)
                        .ifPresent { subscription ->
                            if (subscription.status == SubscriptionStatus.PENDING_PAYMENT) {
                                subscription.confirmPayment(command.amount)
                                subscriptionRepository.save(subscription)
                                logger.info("Activated subscription ${subscription.id} after payment")
                            }
                        }
                } catch (e: Exception) {
                    logger.error("Failed to activate subscription: ${e.message}", e)
                }
            }
        }

        return savedInvoice
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

    // ==================== NOTIFICATION HELPERS ====================

    private fun sendInvoiceCreatedNotification(member: Member, invoice: Invoice) {
        val dueDate = invoice.dueDate?.format(dateFormatter) ?: "N/A"
        val totalAmount = "${invoice.totalAmount.currency} ${invoice.totalAmount.amount}"

        val subject = LocalizedText(
            en = "New Invoice #${invoice.invoiceNumber}",
            ar = "فاتورة جديدة #${invoice.invoiceNumber}"
        )

        val body = LocalizedText(
            en = """
                <h2>Invoice Issued</h2>
                <p>Dear ${member.fullName},</p>
                <p>A new invoice has been issued for your account.</p>
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Total Amount:</strong> $totalAmount</p>
                <p><strong>Due Date:</strong> $dueDate</p>
                <p>Please ensure payment is made by the due date to avoid any late fees.</p>
                <p>Best regards,<br>Liyaqa Team</p>
            """.trimIndent(),
            ar = """
                <h2>تم إصدار الفاتورة</h2>
                <p>عزيزي ${member.fullName}،</p>
                <p>تم إصدار فاتورة جديدة لحسابك.</p>
                <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>المبلغ الإجمالي:</strong> $totalAmount</p>
                <p><strong>تاريخ الاستحقاق:</strong> $dueDate</p>
                <p>يرجى التأكد من السداد قبل تاريخ الاستحقاق لتجنب أي رسوم تأخير.</p>
                <p>مع تحيات،<br>فريق لياقة</p>
            """.trimIndent()
        )

        notificationService.sendMultiChannel(
            memberId = member.id,
            email = member.email,
            phone = member.phone,
            type = NotificationType.INVOICE_CREATED,
            subject = subject,
            body = body,
            priority = NotificationPriority.NORMAL,
            referenceId = invoice.id,
            referenceType = "invoice"
        )
    }

    private fun sendPaymentConfirmationNotification(member: Member, invoice: Invoice) {
        val paidAmount = invoice.paidAmount?.let { "${it.currency} ${it.amount}" } ?: "N/A"
        val paidDate = invoice.paidDate?.format(dateFormatter) ?: "N/A"

        val subject = LocalizedText(
            en = "Payment Received - Invoice #${invoice.invoiceNumber}",
            ar = "تم استلام الدفعة - فاتورة #${invoice.invoiceNumber}"
        )

        val body = LocalizedText(
            en = """
                <h2>Payment Confirmed</h2>
                <p>Dear ${member.fullName},</p>
                <p>Thank you! Your payment has been received and confirmed.</p>
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Amount Paid:</strong> $paidAmount</p>
                <p><strong>Payment Date:</strong> $paidDate</p>
                <p>We appreciate your business!</p>
                <p>Best regards,<br>Liyaqa Team</p>
            """.trimIndent(),
            ar = """
                <h2>تم تأكيد الدفع</h2>
                <p>عزيزي ${member.fullName}،</p>
                <p>شكراً لك! تم استلام وتأكيد دفعتك.</p>
                <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>المبلغ المدفوع:</strong> $paidAmount</p>
                <p><strong>تاريخ الدفع:</strong> $paidDate</p>
                <p>نقدر تعاملكم معنا!</p>
                <p>مع تحيات،<br>فريق لياقة</p>
            """.trimIndent()
        )

        notificationService.sendMultiChannel(
            memberId = member.id,
            email = member.email,
            phone = member.phone,
            type = NotificationType.INVOICE_PAID,
            subject = subject,
            body = body,
            priority = NotificationPriority.NORMAL,
            referenceId = invoice.id,
            referenceType = "invoice"
        )
    }

    /**
     * Deletes an invoice.
     * Only DRAFT or CANCELLED invoices can be deleted.
     */
    fun deleteInvoice(id: UUID) {
        val invoice = getInvoice(id)
        require(invoice.status == InvoiceStatus.DRAFT || invoice.status == InvoiceStatus.CANCELLED) {
            "Only DRAFT or CANCELLED invoices can be deleted. Current status: ${invoice.status}"
        }
        invoiceRepository.deleteById(id)
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk issue invoices.
     * @return Map of invoice ID to success/failure status
     */
    fun bulkIssueInvoices(
        invoiceIds: List<UUID>,
        issueDate: LocalDate,
        paymentDueDays: Int
    ): Map<UUID, Result<Invoice>> {
        return invoiceIds.associateWith { id ->
            runCatching {
                issueInvoice(id, IssueInvoiceCommand(issueDate, paymentDueDays))
            }
        }
    }

    /**
     * Bulk cancel invoices.
     * @return Map of invoice ID to success/failure status
     */
    fun bulkCancelInvoices(invoiceIds: List<UUID>): Map<UUID, Result<Invoice>> {
        return invoiceIds.associateWith { id ->
            runCatching {
                cancelInvoice(id)
            }
        }
    }

    /**
     * Bulk record payments.
     * @return Map of invoice ID to success/failure status
     */
    fun bulkRecordPayments(
        payments: List<Triple<UUID, RecordPaymentCommand, Unit>>
    ): Map<UUID, Result<Invoice>> {
        return payments.associate { (id, command, _) ->
            id to runCatching {
                recordPayment(id, command)
            }
        }
    }

    /**
     * Bulk create invoices from subscriptions.
     * @return Map of subscription ID to success/failure status
     */
    fun bulkCreateInvoicesFromSubscriptions(
        subscriptionIds: List<UUID>,
        notes: LocalizedText?
    ): Map<UUID, Result<Invoice>> {
        return subscriptionIds.associateWith { subscriptionId ->
            runCatching {
                createInvoiceFromSubscription(
                    CreateSubscriptionInvoiceCommand(
                        subscriptionId = subscriptionId,
                        notes = notes
                    )
                )
            }
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Resolves organization ID from tenant (club) ID.
     * Used as fallback when organization context is not set.
     */
    private fun resolveOrganizationFromTenant(tenantId: UUID): UUID? {
        return try {
            clubRepository.findById(tenantId)
                .map { it.organizationId }
                .orElse(null)
        } catch (e: Exception) {
            logger.warn("Failed to resolve organization from tenant $tenantId: ${e.message}")
            null
        }
    }
}
