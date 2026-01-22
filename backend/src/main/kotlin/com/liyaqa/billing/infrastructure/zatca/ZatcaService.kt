package com.liyaqa.billing.infrastructure.zatca

import com.liyaqa.billing.domain.model.Invoice
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.time.ZoneId
import java.time.ZonedDateTime

/**
 * Service for Zatca e-invoicing compliance.
 * Generates QR codes and invoice hashes for Saudi Arabian tax compliance.
 */
@Service
class ZatcaService(
    private val config: ZatcaConfig,
    private val qrCodeGenerator: ZatcaQrCodeGenerator
) {
    private val logger = LoggerFactory.getLogger(ZatcaService::class.java)

    /**
     * Generates Zatca compliance data for an invoice.
     *
     * @param invoice The invoice to generate compliance data for
     * @return ZatcaComplianceData containing QR code and hash, or null if Zatca not configured
     */
    fun generateZatcaCompliance(invoice: Invoice): ZatcaComplianceData? {
        if (!config.isConfigured()) {
            logger.debug("Zatca not configured - skipping compliance generation for invoice ${invoice.invoiceNumber}")
            return null
        }

        try {
            // Get invoice timestamp (use issue date or current time)
            val timestamp = if (invoice.issueDate != null) {
                invoice.issueDate!!.atStartOfDay(ZoneId.of("Asia/Riyadh"))
            } else {
                ZonedDateTime.now(ZoneId.of("Asia/Riyadh"))
            }

            // Generate QR code
            val qrCodeBase64 = qrCodeGenerator.generateZatcaQrCode(
                sellerName = config.sellerName,
                vatNumber = config.vatRegistrationNumber,
                timestamp = timestamp,
                totalWithVat = invoice.totalAmount.amount,
                vatAmount = invoice.vatAmount.amount
            )

            // Generate invoice hash
            val invoiceHash = generateInvoiceHash(invoice)

            logger.info("Generated Zatca compliance data for invoice ${invoice.invoiceNumber}")

            return ZatcaComplianceData(
                qrCodeBase64 = qrCodeBase64,
                invoiceHash = invoiceHash
            )
        } catch (e: Exception) {
            logger.error("Failed to generate Zatca compliance for invoice ${invoice.invoiceNumber}: ${e.message}", e)
            return null
        }
    }

    /**
     * Generates a SHA-256 hash of the invoice data.
     * This hash can be used for invoice verification.
     */
    private fun generateInvoiceHash(invoice: Invoice): String {
        val dataToHash = buildString {
            append(invoice.invoiceNumber)
            append("|")
            append(invoice.issueDate?.toString() ?: "")
            append("|")
            append(invoice.memberId)
            append("|")
            append(invoice.subtotal.amount.toPlainString())
            append("|")
            append(invoice.vatAmount.amount.toPlainString())
            append("|")
            append(invoice.totalAmount.amount.toPlainString())
            append("|")
            append(config.vatRegistrationNumber)
        }

        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(dataToHash.toByteArray(Charsets.UTF_8))
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    /**
     * Checks if Zatca is configured and enabled.
     */
    fun isEnabled(): Boolean = config.isConfigured()

    /**
     * Gets the seller name from configuration.
     */
    fun getSellerName(): String = config.sellerName

    /**
     * Gets the VAT registration number from configuration.
     */
    fun getVatNumber(): String = config.vatRegistrationNumber
}

/**
 * Data class containing Zatca compliance information for an invoice.
 */
data class ZatcaComplianceData(
    /**
     * Base64-encoded PNG image of the Zatca QR code.
     */
    val qrCodeBase64: String,

    /**
     * SHA-256 hash of the invoice data for verification.
     */
    val invoiceHash: String
)
