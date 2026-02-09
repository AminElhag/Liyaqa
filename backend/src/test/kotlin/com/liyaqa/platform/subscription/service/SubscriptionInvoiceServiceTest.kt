package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.MarkPaidCommand
import com.liyaqa.platform.subscription.exception.InvoiceNotFoundException
import com.liyaqa.platform.subscription.exception.InvoiceStateException
import com.liyaqa.platform.subscription.model.Invoice
import com.liyaqa.platform.subscription.model.InvoiceSequence
import com.liyaqa.platform.subscription.model.InvoiceStatus
import com.liyaqa.platform.subscription.model.PaymentMethod
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import com.liyaqa.platform.subscription.repository.InvoiceSequenceRepository
import com.liyaqa.platform.subscription.repository.PaymentRecordRepository
import com.liyaqa.platform.subscription.repository.SubscriptionInvoiceRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubscriptionInvoiceServiceTest {

    @Mock private lateinit var invoiceRepository: SubscriptionInvoiceRepository
    @Mock private lateinit var invoiceSequenceRepository: InvoiceSequenceRepository
    @Mock private lateinit var paymentRecordRepository: PaymentRecordRepository
    @Mock private lateinit var tenantSubscriptionRepository: TenantSubscriptionRepository
    @Mock private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository
    @Mock private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: SubscriptionInvoiceService

    private val tenantId = UUID.randomUUID()
    private val subscriptionId = UUID.randomUUID()
    private val sequence = InvoiceSequence(currentYear = 2026, currentSequence = 0)

    @BeforeEach
    fun setUp() {
        service = SubscriptionInvoiceService(
            invoiceRepository,
            invoiceSequenceRepository,
            paymentRecordRepository,
            tenantSubscriptionRepository,
            subscriptionPlanRepository,
            eventPublisher
        )
        whenever(invoiceSequenceRepository.findForUpdate()).thenReturn(Optional.of(sequence))
        whenever(invoiceSequenceRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(invoiceRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(paymentRecordRepository.save(any())).thenAnswer { it.arguments[0] }
    }

    @Test
    fun `generates invoice with correct VAT calculation`() {
        whenever(invoiceRepository.findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(any(), any(), any()))
            .thenReturn(Optional.empty())

        val invoice = service.generateInvoice(
            tenantId = tenantId,
            subscriptionId = subscriptionId,
            subtotal = BigDecimal("299.00"),
            billingPeriodStart = LocalDate.of(2026, 1, 1),
            billingPeriodEnd = LocalDate.of(2026, 2, 1)
        )

        assertEquals(BigDecimal("299.00"), invoice.subtotal)
        assertEquals(BigDecimal("15.00"), invoice.vatRate)
        // 299 * 15 / 100 = 44.85
        assertEquals(BigDecimal("44.85"), invoice.vatAmount)
        // 299 + 44.85 = 343.85
        assertEquals(BigDecimal("343.85"), invoice.total)
        assertEquals(InvoiceStatus.ISSUED, invoice.status)
        assertNotNull(invoice.issuedAt)
    }

    @Test
    fun `generates sequential invoice numbers`() {
        whenever(invoiceRepository.findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(any(), any(), any()))
            .thenReturn(Optional.empty())

        val invoice1 = service.generateInvoice(
            tenantId, subscriptionId, BigDecimal("100"),
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 1)
        )
        assertEquals("LYQ-2026-00001", invoice1.invoiceNumber)

        val invoice2 = service.generateInvoice(
            tenantId, subscriptionId, BigDecimal("100"),
            LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 1)
        )
        assertEquals("LYQ-2026-00002", invoice2.invoiceNumber)
    }

    @Test
    fun `marks invoice as paid and creates payment record`() {
        val invoice = Invoice.create("LYQ-2026-00001", tenantId, subscriptionId, BigDecimal("299"))
        invoice.issue()
        whenever(invoiceRepository.findById(invoice.id)).thenReturn(Optional.of(invoice))

        val cmd = MarkPaidCommand(PaymentMethod.MADA, "REF-123", BigDecimal("343.85"))
        val result = service.markPaid(invoice.id, cmd)

        assertEquals(InvoiceStatus.PAID, result.status)
        assertNotNull(result.paidAt)
        verify(paymentRecordRepository).save(any())
    }

    @Test
    fun `marks overdue invoices past due date`() {
        val invoice = Invoice.create("LYQ-2026-00001", tenantId, subscriptionId, BigDecimal("299"))
        invoice.issue(LocalDate.now().minusDays(35), 30)
        // Now dueDate is 5 days ago
        whenever(invoiceRepository.findByStatusAndDueDateBefore(any(), any())).thenReturn(listOf(invoice))

        val count = service.markOverdueInvoices()

        assertEquals(1, count)
        assertEquals(InvoiceStatus.OVERDUE, invoice.status)
    }

    @Test
    fun `generates auto invoices for due billing cycles`() {
        val planId = UUID.randomUUID()
        val plan = SubscriptionPlan.create("Pro", PlanTier.PROFESSIONAL, BigDecimal("299"), BigDecimal("2990"))
        val sub = TenantSubscription.createActive(tenantId, planId, SubscriptionBillingCycle.MONTHLY).apply {
            // Simulate that nextBillingDate is today (set currentPeriodEnd to today via reflection or use constructor)
        }

        whenever(tenantSubscriptionRepository.findByStatusAndNextBillingDateLessThanEqual(any(), any()))
            .thenReturn(listOf(sub))
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(plan))
        whenever(invoiceRepository.findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(any(), any(), any()))
            .thenReturn(Optional.empty())

        val count = service.generateAutoInvoices()

        assertEquals(1, count)
        verify(invoiceRepository).save(any())
        verify(tenantSubscriptionRepository).save(any())
    }

    @Test
    fun `rejects duplicate invoice for same billing period`() {
        val existing = Invoice.create("LYQ-2026-00001", tenantId, subscriptionId, BigDecimal("299"))
        whenever(invoiceRepository.findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(any(), any(), any()))
            .thenReturn(Optional.of(existing))

        assertThrows(InvoiceStateException::class.java) {
            service.generateInvoice(
                tenantId, subscriptionId, BigDecimal("299"),
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 1)
            )
        }
    }

    @Test
    fun `invoice number resets yearly`() {
        sequence.currentYear = 2025
        sequence.currentSequence = 100

        whenever(invoiceRepository.findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(any(), any(), any()))
            .thenReturn(Optional.empty())

        val invoice = service.generateInvoice(
            tenantId, subscriptionId, BigDecimal("100"),
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 1)
        )

        // Sequence should have reset since current year (2026) != stored year (2025)
        assertEquals("LYQ-2026-00001", invoice.invoiceNumber)
    }

    @Test
    fun `markPaid throws for non-existent invoice`() {
        whenever(invoiceRepository.findById(any())).thenReturn(Optional.empty())

        assertThrows(InvoiceNotFoundException::class.java) {
            service.markPaid(UUID.randomUUID(), MarkPaidCommand(PaymentMethod.CASH, null, BigDecimal("100")))
        }
    }
}
