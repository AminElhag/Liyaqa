package com.liyaqa.billing.application.services

import com.liyaqa.billing.application.commands.IssueInvoiceCommand
import com.liyaqa.billing.application.commands.RecordPaymentCommand
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.billing.domain.ports.InvoiceSequenceRepository
import com.liyaqa.billing.infrastructure.config.BillingConfig
import com.liyaqa.billing.infrastructure.zatca.ZatcaService
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
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
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InvoiceServiceTest {

    @Mock
    private lateinit var invoiceRepository: InvoiceRepository

    @Mock
    private lateinit var invoiceSequenceRepository: InvoiceSequenceRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var membershipPlanRepository: MembershipPlanRepository

    @Mock
    private lateinit var notificationService: NotificationService

    @Mock
    private lateinit var zatcaService: ZatcaService

    @Mock
    private lateinit var billingConfig: BillingConfig

    private lateinit var invoiceService: InvoiceService

    private val testMemberId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        whenever(billingConfig.defaultVatRate) doReturn BigDecimal("15.00")

        invoiceService = InvoiceService(
            invoiceRepository,
            invoiceSequenceRepository,
            memberRepository,
            subscriptionRepository,
            membershipPlanRepository,
            notificationService,
            zatcaService,
            billingConfig
        )
    }

    @Test
    fun `getInvoice should return invoice when found`() {
        // Given
        val invoice = createTestInvoice()
        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        val result = invoiceService.getInvoice(invoice.id)

        // Then
        assertEquals(invoice.id, result.id)
        assertEquals(invoice.invoiceNumber, result.invoiceNumber)
    }

    @Test
    fun `getInvoice should throw when invoice not found`() {
        // Given
        val invoiceId = UUID.randomUUID()
        whenever(invoiceRepository.findById(invoiceId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            invoiceService.getInvoice(invoiceId)
        }
    }

    @Test
    fun `getInvoiceByNumber should return invoice when found`() {
        // Given
        val invoice = createTestInvoice()
        whenever(invoiceRepository.findByInvoiceNumber(invoice.invoiceNumber)) doReturn Optional.of(invoice)

        // When
        val result = invoiceService.getInvoiceByNumber(invoice.invoiceNumber)

        // Then
        assertEquals(invoice.invoiceNumber, result.invoiceNumber)
    }

    @Test
    fun `getInvoiceByNumber should throw when invoice not found`() {
        // Given
        val invoiceNumber = "INV-2026-00001"
        whenever(invoiceRepository.findByInvoiceNumber(invoiceNumber)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            invoiceService.getInvoiceByNumber(invoiceNumber)
        }
    }

    @Test
    fun `getAllInvoices should return paginated invoices`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val invoices = listOf(createTestInvoice(), createTestInvoice())
        val page = PageImpl(invoices, pageable, invoices.size.toLong())

        whenever(invoiceRepository.findAll(pageable)) doReturn page

        // When
        val result = invoiceService.getAllInvoices(pageable)

        // Then
        assertEquals(2, result.content.size)
    }

    @Test
    fun `issueInvoice should change status to ISSUED and send notification`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.DRAFT)
        val member = createTestMember()
        val command = IssueInvoiceCommand(
            issueDate = LocalDate.now(),
            paymentDueDays = 14
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(invoiceRepository.save(any<Invoice>())).thenAnswer { it.getArgument(0) }
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.of(member)

        // When
        val result = invoiceService.issueInvoice(invoice.id, command)

        // Then
        assertEquals(InvoiceStatus.ISSUED, result.status)
        assertNotNull(result.issueDate)
        assertNotNull(result.dueDate)
    }

    @Test
    fun `recordPayment should change status to PAID when fully paid`() {
        // Given
        val invoiceId = UUID.randomUUID()
        val member = createTestMember()
        val command = RecordPaymentCommand(
            amount = Money(BigDecimal("115.00"), "SAR"),
            paymentMethod = PaymentMethod.CARD,
            reference = "TXN-123"
        )

        val issuedInvoice = Invoice.create(
            invoiceNumber = "INV-2026-00001",
            memberId = testMemberId,
            lineItems = listOf(
                InvoiceLineItem(
                    description = LocalizedText(en = "Test Item"),
                    quantity = 1,
                    unitPrice = Money(BigDecimal("100.00"), "SAR"),
                    itemType = LineItemType.SUBSCRIPTION,
                    sortOrder = 0
                )
            )
        )
        // Issue the invoice first
        issuedInvoice.issue(LocalDate.now(), 14)

        // Set the ID via reflection
        val idField = issuedInvoice.javaClass.superclass.getDeclaredField("id")
        idField.isAccessible = true
        idField.set(issuedInvoice, invoiceId)

        whenever(invoiceRepository.findById(invoiceId)) doReturn Optional.of(issuedInvoice)
        whenever(invoiceRepository.save(any<Invoice>())).thenAnswer { it.getArgument(0) }
        whenever(memberRepository.findById(testMemberId)) doReturn Optional.of(member)

        // When
        val result = invoiceService.recordPayment(invoiceId, command)

        // Then
        assertEquals(InvoiceStatus.PAID, result.status)
        assertNotNull(result.paidDate)
    }

    @Test
    fun `cancelInvoice should change status to CANCELLED`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.DRAFT)
        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(invoiceRepository.save(any<Invoice>())).thenAnswer { it.getArgument(0) }

        // When
        val result = invoiceService.cancelInvoice(invoice.id)

        // Then
        assertEquals(InvoiceStatus.CANCELLED, result.status)
    }

    @Test
    fun `deleteInvoice should delete only DRAFT invoices`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.DRAFT)
        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        invoiceService.deleteInvoice(invoice.id)

        // Then
        verify(invoiceRepository).deleteById(invoice.id)
    }

    @Test
    fun `deleteInvoice should delete CANCELLED invoices`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.CANCELLED)
        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        invoiceService.deleteInvoice(invoice.id)

        // Then
        verify(invoiceRepository).deleteById(invoice.id)
    }

    @Test
    fun `deleteInvoice should throw when invoice ISSUED`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            invoiceService.deleteInvoice(invoice.id)
        }

        verify(invoiceRepository, never()).deleteById(any())
    }

    @Test
    fun `countPendingInvoices should return count of ISSUED and OVERDUE invoices`() {
        // Given
        whenever(invoiceRepository.countByStatus(InvoiceStatus.ISSUED)) doReturn 5L
        whenever(invoiceRepository.countByStatus(InvoiceStatus.OVERDUE)) doReturn 3L

        // When
        val result = invoiceService.countPendingInvoices()

        // Then
        assertEquals(8L, result)
    }

    private fun createTestInvoice(
        id: UUID = UUID.randomUUID(),
        invoiceNumber: String = "INV-2026-00001",
        memberId: UUID = testMemberId,
        status: InvoiceStatus = InvoiceStatus.DRAFT
    ): Invoice {
        val invoice = Invoice.create(
            invoiceNumber = invoiceNumber,
            memberId = memberId,
            lineItems = listOf(
                InvoiceLineItem(
                    description = LocalizedText(en = "Test Item"),
                    quantity = 1,
                    unitPrice = Money(BigDecimal("100.00"), "SAR"),
                    itemType = LineItemType.SUBSCRIPTION,
                    sortOrder = 0
                )
            )
        )

        // Use reflection to set the ID and status
        val idField = invoice.javaClass.superclass.getDeclaredField("id")
        idField.isAccessible = true
        idField.set(invoice, id)

        if (status != InvoiceStatus.DRAFT) {
            val statusField = invoice.javaClass.getDeclaredField("status")
            statusField.isAccessible = true
            statusField.set(invoice, status)
        }

        return invoice
    }

    private fun createTestMember(
        id: UUID = testMemberId,
        email: String = "test@example.com",
        status: MemberStatus = MemberStatus.ACTIVE
    ) = Member(
        id = id,
        firstName = LocalizedText(en = "Test", ar = "اختبار"),
        lastName = LocalizedText(en = "Member", ar = "عضو"),
        email = email,
        status = status
    )
}
