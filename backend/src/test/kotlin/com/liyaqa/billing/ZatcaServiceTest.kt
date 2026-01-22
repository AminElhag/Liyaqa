package com.liyaqa.billing

import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.infrastructure.zatca.ZatcaConfig
import com.liyaqa.billing.infrastructure.zatca.ZatcaQrCodeGenerator
import com.liyaqa.billing.infrastructure.zatca.ZatcaService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.Base64
import java.util.UUID

/**
 * Unit tests for Zatca e-invoicing service.
 * Tests TLV encoding, QR code generation, and compliance data creation.
 */
class ZatcaServiceTest {

    private lateinit var config: ZatcaConfig
    private lateinit var qrCodeGenerator: ZatcaQrCodeGenerator
    private lateinit var zatcaService: ZatcaService

    private val testSellerName = "Test Company"
    private val testVatNumber = "123456789012345"

    @BeforeEach
    fun setUp() {
        config = ZatcaConfig().apply {
            enabled = true
            sellerName = testSellerName
            vatRegistrationNumber = testVatNumber
        }
        qrCodeGenerator = ZatcaQrCodeGenerator()
        zatcaService = ZatcaService(config, qrCodeGenerator)
    }

    // ========== TLV Encoding Tests ==========

    @Test
    fun `generateTlvData should produce correct TLV byte sequence`() {
        // Given
        val timestamp = ZonedDateTime.of(2026, 1, 8, 12, 0, 0, 0, ZoneId.of("Asia/Riyadh"))
        val totalWithVat = BigDecimal("115.00")
        val vatAmount = BigDecimal("15.00")

        // When
        val tlvData = qrCodeGenerator.generateTlvData(
            sellerName = testSellerName,
            vatNumber = testVatNumber,
            timestamp = timestamp,
            totalWithVat = totalWithVat,
            vatAmount = vatAmount
        )

        // Then
        assertNotNull(tlvData)
        assertTrue(tlvData.isNotEmpty())

        // Verify TLV structure: first byte should be tag 1 (seller name)
        assertEquals(1, tlvData[0].toInt())
        // Second byte should be length of seller name
        assertEquals(testSellerName.length, tlvData[1].toInt())
    }

    @Test
    fun `generateTlvData should be decodable back to original values`() {
        // Given
        val timestamp = ZonedDateTime.of(2026, 1, 8, 12, 0, 0, 0, ZoneId.of("Asia/Riyadh"))
        val totalWithVat = BigDecimal("115.00")
        val vatAmount = BigDecimal("15.00")

        // When
        val tlvData = qrCodeGenerator.generateTlvData(
            sellerName = testSellerName,
            vatNumber = testVatNumber,
            timestamp = timestamp,
            totalWithVat = totalWithVat,
            vatAmount = vatAmount
        )
        val base64Encoded = Base64.getEncoder().encodeToString(tlvData)
        val decoded = qrCodeGenerator.decodeTlvData(base64Encoded)

        // Then
        assertEquals(testSellerName, decoded[1])
        assertEquals(testVatNumber, decoded[2])
        assertEquals("115.00", decoded[4])
        assertEquals("15.00", decoded[5])
    }

    // ========== QR Code Generation Tests ==========

    @Test
    fun `generateBase64QrCode should produce valid Base64 PNG string`() {
        // Given
        val timestamp = ZonedDateTime.now()
        val tlvData = qrCodeGenerator.generateTlvData(
            sellerName = testSellerName,
            vatNumber = testVatNumber,
            timestamp = timestamp,
            totalWithVat = BigDecimal("100.00"),
            vatAmount = BigDecimal("15.00")
        )

        // When
        val qrCodeBase64 = qrCodeGenerator.generateBase64QrCode(tlvData)

        // Then
        assertNotNull(qrCodeBase64)
        assertTrue(qrCodeBase64.isNotBlank())

        // Verify it's valid Base64 (shouldn't throw)
        val decoded = Base64.getDecoder().decode(qrCodeBase64)
        assertTrue(decoded.isNotEmpty())

        // Verify it starts with PNG header (89 50 4E 47)
        assertEquals(0x89.toByte(), decoded[0])
        assertEquals(0x50.toByte(), decoded[1]) // 'P'
        assertEquals(0x4E.toByte(), decoded[2]) // 'N'
        assertEquals(0x47.toByte(), decoded[3]) // 'G'
    }

    @Test
    fun `generateZatcaQrCode should produce complete QR code`() {
        // Given
        val timestamp = ZonedDateTime.now()

        // When
        val qrCode = qrCodeGenerator.generateZatcaQrCode(
            sellerName = testSellerName,
            vatNumber = testVatNumber,
            timestamp = timestamp,
            totalWithVat = BigDecimal("230.00"),
            vatAmount = BigDecimal("30.00")
        )

        // Then
        assertNotNull(qrCode)
        assertTrue(qrCode.isNotBlank())
    }

    // ========== Zatca Service Tests ==========

    @Test
    fun `generateZatcaCompliance should return data for issued invoice`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)

        // When
        val result = zatcaService.generateZatcaCompliance(invoice)

        // Then
        assertNotNull(result)
        assertNotNull(result?.qrCodeBase64)
        assertNotNull(result?.invoiceHash)
        assertTrue(result!!.qrCodeBase64.isNotBlank())
        assertEquals(64, result.invoiceHash.length) // SHA-256 produces 64 hex chars
    }

    @Test
    fun `generateZatcaCompliance should return null when Zatca not configured`() {
        // Given - disable Zatca
        config.enabled = false
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)

        // When
        val result = zatcaService.generateZatcaCompliance(invoice)

        // Then
        assertNull(result)
    }

    @Test
    fun `generateZatcaCompliance should return null when VAT number not set`() {
        // Given - remove VAT number
        config.vatRegistrationNumber = ""
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)

        // When
        val result = zatcaService.generateZatcaCompliance(invoice)

        // Then
        assertNull(result)
    }

    @Test
    fun `isEnabled should return true when configured`() {
        // Given - config is set up in setUp()

        // When/Then
        assertTrue(zatcaService.isEnabled())
    }

    @Test
    fun `isEnabled should return false when disabled`() {
        // Given
        config.enabled = false

        // When/Then
        assertEquals(false, zatcaService.isEnabled())
    }

    @Test
    fun `getSellerName should return configured seller name`() {
        assertEquals(testSellerName, zatcaService.getSellerName())
    }

    @Test
    fun `getVatNumber should return configured VAT number`() {
        assertEquals(testVatNumber, zatcaService.getVatNumber())
    }

    // ========== Invoice Hash Tests ==========

    @Test
    fun `generateZatcaCompliance should produce consistent hash for same invoice`() {
        // Given
        val invoice = createTestInvoice(status = InvoiceStatus.ISSUED)

        // When
        val result1 = zatcaService.generateZatcaCompliance(invoice)
        val result2 = zatcaService.generateZatcaCompliance(invoice)

        // Then
        assertEquals(result1?.invoiceHash, result2?.invoiceHash)
    }

    @Test
    fun `generateZatcaCompliance should produce different hashes for different invoices`() {
        // Given
        val invoice1 = createTestInvoice(
            id = UUID.randomUUID(),
            invoiceNumber = "INV-001",
            status = InvoiceStatus.ISSUED
        )
        val invoice2 = createTestInvoice(
            id = UUID.randomUUID(),
            invoiceNumber = "INV-002",
            status = InvoiceStatus.ISSUED
        )

        // When
        val result1 = zatcaService.generateZatcaCompliance(invoice1)
        val result2 = zatcaService.generateZatcaCompliance(invoice2)

        // Then
        assertNotNull(result1)
        assertNotNull(result2)
        assertTrue(result1!!.invoiceHash != result2!!.invoiceHash)
    }

    // ========== Helper Methods ==========

    private fun createTestInvoice(
        id: UUID = UUID.randomUUID(),
        invoiceNumber: String = "INV-2026-00001",
        memberId: UUID = UUID.randomUUID(),
        status: InvoiceStatus = InvoiceStatus.DRAFT,
        amount: BigDecimal = BigDecimal("100.00")
    ): Invoice {
        val invoice = Invoice.create(
            invoiceNumber = invoiceNumber,
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

        // Set ID via reflection
        val idField = invoice.javaClass.superclass.getDeclaredField("id")
        idField.isAccessible = true
        idField.set(invoice, id)

        // Set status and issue date via reflection if needed
        if (status != InvoiceStatus.DRAFT) {
            val statusField = invoice.javaClass.getDeclaredField("status")
            statusField.isAccessible = true
            statusField.set(invoice, status)

            if (status == InvoiceStatus.ISSUED) {
                val issueDateField = invoice.javaClass.getDeclaredField("issueDate")
                issueDateField.isAccessible = true
                issueDateField.set(invoice, LocalDate.now())
            }
        }

        return invoice
    }
}
