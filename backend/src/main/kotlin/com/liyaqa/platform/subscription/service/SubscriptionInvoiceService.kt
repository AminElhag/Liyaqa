package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.MarkPaidCommand
import com.liyaqa.platform.subscription.exception.InvoiceNotFoundException
import com.liyaqa.platform.subscription.exception.InvoiceStateException
import com.liyaqa.platform.subscription.model.Invoice
import com.liyaqa.platform.subscription.model.InvoiceStatus
import com.liyaqa.platform.subscription.model.PaymentRecord
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.InvoiceSequenceRepository
import com.liyaqa.platform.subscription.repository.PaymentRecordRepository
import com.liyaqa.platform.subscription.repository.SubscriptionInvoiceRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.events.model.PlatformEvent
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class SubscriptionInvoiceService(
    private val invoiceRepository: SubscriptionInvoiceRepository,
    private val invoiceSequenceRepository: InvoiceSequenceRepository,
    private val paymentRecordRepository: PaymentRecordRepository,
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val subscriptionPlanRepository: SubscriptionPlanRepository,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val log = LoggerFactory.getLogger(SubscriptionInvoiceService::class.java)

    fun generateInvoice(
        tenantId: UUID,
        subscriptionId: UUID,
        subtotal: BigDecimal,
        billingPeriodStart: LocalDate,
        billingPeriodEnd: LocalDate
    ): Invoice {
        // Check for duplicate invoice for same billing period
        val existing = invoiceRepository.findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(
            tenantId, billingPeriodStart, billingPeriodEnd
        )
        if (existing.isPresent) {
            throw InvoiceStateException("Invoice already exists for tenant $tenantId billing period $billingPeriodStart to $billingPeriodEnd")
        }

        val invoiceNumber = generateInvoiceNumber()
        val invoice = Invoice.create(
            invoiceNumber = invoiceNumber,
            tenantId = tenantId,
            subscriptionId = subscriptionId,
            subtotal = subtotal
        ).apply {
            this.billingPeriodStart = billingPeriodStart
            this.billingPeriodEnd = billingPeriodEnd
        }

        invoice.issue()
        log.info("Generated invoice {} for tenant {}: {} SAR", invoiceNumber, tenantId, invoice.total)
        val saved = invoiceRepository.save(invoice)

        eventPublisher.publishEvent(PlatformEvent.InvoiceGenerated(
            tenantId = tenantId,
            invoiceId = saved.id,
            invoiceNumber = invoiceNumber,
            amount = saved.total
        ))

        return saved
    }

    fun generateProratedInvoice(
        tenantId: UUID,
        subscriptionId: UUID,
        proratedAmount: BigDecimal,
        description: String
    ): Invoice {
        val invoiceNumber = generateInvoiceNumber()
        val invoice = Invoice.create(
            invoiceNumber = invoiceNumber,
            tenantId = tenantId,
            subscriptionId = subscriptionId,
            subtotal = proratedAmount
        ).apply {
            notes = description
        }

        invoice.issue()
        log.info("Generated prorated invoice {} for tenant {}: {} SAR", invoiceNumber, tenantId, invoice.total)
        return invoiceRepository.save(invoice)
    }

    fun markPaid(invoiceId: UUID, cmd: MarkPaidCommand): Invoice {
        val invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow { InvoiceNotFoundException(invoiceId) }

        invoice.markPaid(cmd.paymentMethod.name)

        val paymentRecord = PaymentRecord.create(
            invoiceId = invoiceId,
            tenantId = invoice.tenantId,
            amount = cmd.amount,
            method = cmd.paymentMethod,
            referenceNumber = cmd.referenceNumber
        )
        paymentRecordRepository.save(paymentRecord)

        log.info("Invoice {} marked as paid via {}", invoice.invoiceNumber, cmd.paymentMethod)
        val saved = invoiceRepository.save(invoice)

        eventPublisher.publishEvent(PlatformEvent.InvoicePaid(
            tenantId = invoice.tenantId,
            invoiceId = invoiceId,
            invoiceNumber = invoice.invoiceNumber,
            amount = cmd.amount
        ))

        return saved
    }

    @Transactional(readOnly = true)
    fun getInvoicesByTenant(tenantId: UUID): List<Invoice> =
        invoiceRepository.findByTenantId(tenantId)

    @Transactional(readOnly = true)
    fun getOutstandingInvoices(): List<Invoice> =
        invoiceRepository.findByStatusIn(listOf(InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE))

    fun markOverdueInvoices(): Int {
        val today = LocalDate.now()
        val overdueInvoices = invoiceRepository.findByStatusAndDueDateBefore(InvoiceStatus.ISSUED, today)
        var count = 0
        for (invoice in overdueInvoices) {
            invoice.markOverdue()
            invoiceRepository.save(invoice)

            eventPublisher.publishEvent(PlatformEvent.InvoiceOverdue(
                tenantId = invoice.tenantId,
                invoiceId = invoice.id,
                invoiceNumber = invoice.invoiceNumber,
                amount = invoice.total
            ))

            count++
        }
        if (count > 0) {
            log.info("Marked {} invoices as overdue", count)
        }
        return count
    }

    fun generateAutoInvoices(): Int {
        val today = LocalDate.now()
        val dueSubs = tenantSubscriptionRepository.findByStatusAndNextBillingDateLessThanEqual(
            SubscriptionStatus.ACTIVE, today
        )
        var count = 0
        for (sub in dueSubs) {
            val plan = subscriptionPlanRepository.findById(sub.planId).orElse(null) ?: continue
            val price = when (sub.billingCycle) {
                SubscriptionBillingCycle.MONTHLY -> plan.monthlyPriceAmount
                SubscriptionBillingCycle.ANNUAL -> plan.annualPriceAmount
            }

            val newPeriodEnd = when (sub.billingCycle) {
                SubscriptionBillingCycle.MONTHLY -> sub.currentPeriodEnd.plusMonths(1)
                SubscriptionBillingCycle.ANNUAL -> sub.currentPeriodEnd.plusYears(1)
            }

            try {
                generateInvoice(
                    tenantId = sub.tenantId,
                    subscriptionId = sub.id,
                    subtotal = price,
                    billingPeriodStart = sub.currentPeriodEnd,
                    billingPeriodEnd = newPeriodEnd
                )
                sub.renew(newPeriodEnd)
                tenantSubscriptionRepository.save(sub)
                count++
            } catch (e: Exception) {
                log.warn("Failed to generate auto invoice for tenant {}: {}", sub.tenantId, e.message)
            }
        }
        if (count > 0) {
            log.info("Generated {} auto invoices", count)
        }
        return count
    }

    private fun generateInvoiceNumber(): String {
        val year = LocalDate.now().year
        val sequence = invoiceSequenceRepository.findForUpdate()
            .orElseThrow { IllegalStateException("Invoice sequence not initialized") }
        val number = sequence.getNextInvoiceNumber(year)
        invoiceSequenceRepository.save(sequence)
        return number
    }
}
