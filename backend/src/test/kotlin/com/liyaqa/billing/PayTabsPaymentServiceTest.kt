package com.liyaqa.billing

import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.billing.infrastructure.payment.PayTabsCallbackData
import com.liyaqa.billing.infrastructure.payment.PayTabsConfig
import com.liyaqa.billing.infrastructure.payment.PayTabsPaymentService
import com.liyaqa.billing.infrastructure.payment.PayTabsUserDefined
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Unit tests for PayTabsPaymentService.
 * Tests payment initiation, callback processing, and signature verification.
 */
@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PayTabsPaymentServiceTest {

    @Mock
    private lateinit var invoiceRepository: InvoiceRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var notificationService: NotificationService

    private lateinit var config: PayTabsConfig
    private lateinit var paymentService: PayTabsPaymentService

    private val testMemberId = UUID.randomUUID()
    private val testInvoiceId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        config = PayTabsConfig()
        paymentService = PayTabsPaymentService(
            config,
            invoiceRepository,
            memberRepository,
            notificationService
        )
    }

    // ========== Payment Initiation Tests ==========

    @Test
    fun `initiatePayment should return error when PayTabs not configured`() {
        // Given - config is not configured (empty profileId and serverKey)

        // When
        val result = paymentService.initiatePayment(testInvoiceId)

        // Then
        assertFalse(result.success)
        assertEquals("Payment gateway not configured", result.error)
        assertNull(result.redirectUrl)
        assertNull(result.transactionRef)
    }

    @Test
    fun `initiatePayment should return error for DRAFT invoice`() {
        // Given
        configurePayTabs()
        val invoice = createTestInvoice(status = InvoiceStatus.DRAFT)
        val member = createTestMember()

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.of(member)

        // When
        val result = paymentService.initiatePayment(invoice.id)

        // Then
        assertFalse(result.success)
        assertTrue(result.error?.contains("Cannot be paid") == true || result.error?.contains("DRAFT") == true)
    }

    @Test
    fun `initiatePayment should return error for PAID invoice`() {
        // Given
        configurePayTabs()
        val invoice = createTestInvoice(status = InvoiceStatus.PAID)
        val member = createTestMember()

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.of(member)

        // When
        val result = paymentService.initiatePayment(invoice.id)

        // Then
        assertFalse(result.success)
        assertTrue(result.error?.contains("Cannot be paid") == true || result.error?.contains("PAID") == true)
    }

    @Test
    fun `initiatePayment should return error for CANCELLED invoice`() {
        // Given
        configurePayTabs()
        val invoice = createTestInvoice(status = InvoiceStatus.CANCELLED)
        val member = createTestMember()

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.of(member)

        // When
        val result = paymentService.initiatePayment(invoice.id)

        // Then
        assertFalse(result.success)
        assertNotNull(result.error)
    }

    @Test
    fun `initiatePayment should return error when invoice not found`() {
        // Given
        configurePayTabs()
        whenever(invoiceRepository.findById(testInvoiceId)) doReturn Optional.empty()

        // When/Then
        val exception = org.junit.jupiter.api.assertThrows<NoSuchElementException> {
            paymentService.initiatePayment(testInvoiceId)
        }
        assertTrue(exception.message?.contains("Invoice not found") == true)
    }

    @Test
    fun `initiatePayment should return error when member not found`() {
        // Given
        configurePayTabs()
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.empty()

        // When/Then
        val exception = org.junit.jupiter.api.assertThrows<NoSuchElementException> {
            paymentService.initiatePayment(invoice.id)
        }
        assertTrue(exception.message?.contains("Member not found") == true)
    }

    // ========== Callback Processing Tests ==========

    @Test
    fun `processCallback with status A should record payment and update invoice to PAID`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val member = createTestMember()
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "A",
            amount = "115.00",
            currency = "SAR"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(invoiceRepository.save(any<Invoice>())).thenAnswer { it.getArgument(0) }
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.of(member)

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertTrue(result.success)
        assertEquals("PAID", result.status)
        assertEquals(invoice.id, result.invoiceId)
        verify(invoiceRepository).save(any<Invoice>())
    }

    @Test
    fun `processCallback with status D should return declined error`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "D",
            respMessage = "Card declined"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertEquals("DECLINED", result.status)
        assertEquals(invoice.id, result.invoiceId)
        assertEquals("Card declined", result.error)
    }

    @Test
    fun `processCallback with status E should return error`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "E",
            respMessage = "Transaction error"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertEquals("ERROR", result.status)
        assertEquals("Transaction error", result.error)
    }

    @Test
    fun `processCallback with status H should return hold status`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "H"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertEquals("HOLD", result.status)
        assertEquals("Payment is on hold", result.error)
    }

    @Test
    fun `processCallback with status P should return pending status`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "P"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertEquals("PENDING", result.status)
        assertEquals("Payment is pending", result.error)
    }

    @Test
    fun `processCallback with status V should return voided status`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "V"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertEquals("VOIDED", result.status)
        assertEquals("Payment was voided", result.error)
    }

    @Test
    fun `processCallback with missing invoice ID should return error`() {
        // Given - callback with null udf1 (invoice ID)
        val callback = createCallbackData(
            invoiceId = null,
            respStatus = "A"
        )

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertEquals("Missing invoice ID in callback", result.error)
    }

    @Test
    fun `processCallback with non-existent invoice should return error`() {
        // Given
        val nonExistentId = UUID.randomUUID()
        val callback = createCallbackData(
            invoiceId = nonExistentId.toString(),
            respStatus = "A"
        )

        whenever(invoiceRepository.findById(nonExistentId)) doReturn Optional.empty()

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertTrue(result.error?.contains("Invoice not found") == true)
    }

    @Test
    fun `processCallback with unknown status should return error`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "X" // Unknown status
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When
        val result = paymentService.processCallback(callback)

        // Then
        assertFalse(result.success)
        assertEquals("UNKNOWN", result.status)
        assertTrue(result.error?.contains("Unknown payment status") == true)
    }

    // ========== Signature Verification Tests ==========

    @Test
    fun `processCallback should pass when PayTabs not configured and no signature`() {
        // Given - PayTabs not configured, signature verification should be skipped
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val member = createTestMember()
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "A",
            amount = "115.00",
            currency = "SAR"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(invoiceRepository.save(any<Invoice>())).thenAnswer { it.getArgument(0) }
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.of(member)

        // When - no signature provided, but PayTabs not configured
        val result = paymentService.processCallback(callback, signature = null)

        // Then - should succeed because verification is skipped when not configured
        assertTrue(result.success)
    }

    @Test
    fun `processCallback should fail with invalid signature when PayTabs configured`() {
        // Given
        configurePayTabs()
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "A",
            amount = "115.00",
            currency = "SAR"
        )

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)

        // When - invalid signature provided
        val result = paymentService.processCallback(callback, signature = "invalid_signature_123")

        // Then - should fail due to signature mismatch
        assertFalse(result.success)
        assertEquals("Invalid callback signature", result.error)
    }

    @Test
    fun `processCallback should pass with valid HMAC signature when configured`() {
        // Given
        configurePayTabs()
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)
        val member = createTestMember()
        val callback = createCallbackData(
            invoiceId = invoice.id.toString(),
            respStatus = "A",
            amount = "115.00",
            currency = "SAR"
        )

        // Generate valid signature using same algorithm as the service
        val dataToSign = "${callback.tranRef}${callback.cartAmount}${callback.cartCurrency}${callback.respStatus}"
        val validSignature = generateHmacSha256(dataToSign, config.serverKey)

        whenever(invoiceRepository.findById(invoice.id)) doReturn Optional.of(invoice)
        whenever(invoiceRepository.save(any<Invoice>())).thenAnswer { it.getArgument(0) }
        whenever(memberRepository.findById(invoice.memberId)) doReturn Optional.of(member)

        // When
        val result = paymentService.processCallback(callback, signature = validSignature)

        // Then
        assertTrue(result.success)
        assertEquals("PAID", result.status)
    }

    // ========== Payment Verification Tests ==========

    @Test
    fun `verifyPayment should return error when PayTabs not configured`() {
        // Given - PayTabs not configured

        // When
        val result = paymentService.verifyPayment("TXN-123")

        // Then
        assertFalse(result.success)
        assertEquals("Payment gateway not configured", result.error)
    }

    // ========== Helper Methods ==========

    private fun configurePayTabs() {
        config.profileId = "TEST_PROFILE_123"
        config.serverKey = "TEST_SERVER_KEY_ABC"
        config.callbackUrl = "https://example.com/callback"
        config.returnUrl = "https://example.com/return"
    }

    private fun createTestInvoice(
        id: UUID = testInvoiceId,
        memberId: UUID = testMemberId,
        status: InvoiceStatus = InvoiceStatus.DRAFT,
        amount: BigDecimal = BigDecimal("100.00")
    ): Invoice {
        val invoice = Invoice.create(
            invoiceNumber = "INV-2026-${id.toString().take(6)}",
            memberId = memberId,
            lineItems = listOf(
                InvoiceLineItem(
                    description = LocalizedText(en = "Test Item"),
                    quantity = 1,
                    unitPrice = Money(amount, "SAR"),
                    itemType = LineItemType.SUBSCRIPTION,
                    sortOrder = 0
                )
            )
        )

        // Set ID via reflection (Invoice -> OrganizationAwareEntity has id)
        val idField = invoice.javaClass.superclass.getDeclaredField("id")
        idField.isAccessible = true
        idField.set(invoice, id)

        // Set status via reflection if not DRAFT
        if (status != InvoiceStatus.DRAFT) {
            val statusField = invoice.javaClass.getDeclaredField("status")
            statusField.isAccessible = true
            statusField.set(invoice, status)

            // If ISSUED, set issue and due dates
            if (status == InvoiceStatus.ISSUED || status == InvoiceStatus.OVERDUE) {
                val issueDateField = invoice.javaClass.getDeclaredField("issueDate")
                issueDateField.isAccessible = true
                issueDateField.set(invoice, LocalDate.now().minusDays(7))

                val dueDateField = invoice.javaClass.getDeclaredField("dueDate")
                dueDateField.isAccessible = true
                dueDateField.set(invoice, LocalDate.now().plusDays(7))
            }
        }

        return invoice
    }

    private fun createTestMember(
        id: UUID = testMemberId,
        email: String = "test@example.com"
    ) = Member(
        id = id,
        firstName = LocalizedText(en = "Test", ar = "اختبار"),
        lastName = LocalizedText(en = "Member", ar = "عضو"),
        email = email,
        phone = "+966501234567",
        status = MemberStatus.ACTIVE
    )

    private fun createCallbackData(
        invoiceId: String?,
        respStatus: String,
        tranRef: String = "TST${System.currentTimeMillis()}",
        amount: String = "115.00",
        currency: String = "SAR",
        respMessage: String? = null
    ) = PayTabsCallbackData(
        tranRef = tranRef,
        cartId = "CART-123",
        cartAmount = amount,
        cartCurrency = currency,
        customerDetails = null,
        paymentResult = null,
        respStatus = respStatus,
        respCode = null,
        respMessage = respMessage,
        userDefined = if (invoiceId != null) PayTabsUserDefined(udf1 = invoiceId, udf2 = testMemberId.toString()) else null
    )

    /**
     * Generates HMAC-SHA256 signature matching the service implementation.
     */
    private fun generateHmacSha256(data: String, key: String): String {
        val algorithm = "HmacSHA256"
        val secretKeySpec = javax.crypto.spec.SecretKeySpec(key.toByteArray(Charsets.UTF_8), algorithm)
        val mac = javax.crypto.Mac.getInstance(algorithm)
        mac.init(secretKeySpec)
        val hash = mac.doFinal(data.toByteArray(Charsets.UTF_8))
        return hash.joinToString("") { "%02x".format(it) }
    }
}
