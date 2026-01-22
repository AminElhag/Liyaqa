package com.liyaqa.billing.infrastructure.payment

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.organization.domain.ports.ClubRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestTemplate
import java.math.BigDecimal
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Service for STC Pay mobile wallet integration.
 *
 * STC Pay flow:
 * 1. Initiate payment - creates payment request, returns OTP reference
 * 2. Customer receives OTP on their STC Pay app
 * 3. Confirm payment with OTP - completes the payment
 *
 * STC Pay is popular in Saudi Arabia for:
 * - QR code payments at POS
 * - In-app payments
 * - P2P money transfers
 */
@Service
class STCPayService(
    private val config: STCPayConfig,
    private val invoiceRepository: InvoiceRepository,
    private val memberRepository: MemberRepository,
    private val clubRepository: ClubRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(STCPayService::class.java)
    private val restTemplate = RestTemplate()

    /**
     * Initiates an STC Pay payment for an invoice.
     * Returns an OTP reference that the customer uses to authorize the payment.
     */
    @Transactional
    fun initiatePayment(invoiceId: UUID, mobileNumber: String): STCPayInitiationResult {
        if (!config.isConfigured()) {
            logger.warn("STC Pay is not configured")
            return STCPayInitiationResult(
                success = false,
                error = "STC Pay is not configured"
            )
        }

        val invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow { NoSuchElementException("Invoice not found: $invoiceId") }

        // Validate invoice can be paid
        if (!invoice.canBePaid()) {
            return STCPayInitiationResult(
                success = false,
                error = "Invoice cannot be paid. Status: ${invoice.status}"
            )
        }

        val member = memberRepository.findById(invoice.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${invoice.memberId}") }

        try {
            val requestBody = mapOf(
                "merchantId" to config.merchantId,
                "branchId" to "001",
                "amount" to invoice.totalAmount.amount.setScale(2),
                "mobileNo" to formatSaudiMobile(mobileNumber),
                "billNumber" to invoice.invoiceNumber,
                "referenceNumber" to invoice.id.toString(),
                "timestamp" to Instant.now().toEpochMilli()
            )

            val headers = createHeaders(requestBody)
            val response = sendRequest("/payment/request", requestBody, headers)

            if (response["status"] == "SUCCESS") {
                val otpReference = response["otpReference"] as String
                val transactionId = response["transactionId"] as String

                // Update invoice with STC Pay references
                invoice.stcpayOtpReference = otpReference
                invoice.stcpayTransactionId = transactionId
                invoiceRepository.save(invoice)

                logger.info("STC Pay payment initiated for invoice ${invoice.invoiceNumber}: $transactionId")

                return STCPayInitiationResult(
                    success = true,
                    otpReference = otpReference,
                    transactionId = transactionId,
                    expiresIn = config.otpExpirySeconds
                )
            } else {
                val errorMessage = response["message"] as? String ?: "Unknown error"
                logger.error("STC Pay initiation failed: $errorMessage")
                return STCPayInitiationResult(
                    success = false,
                    error = errorMessage
                )
            }
        } catch (e: Exception) {
            logger.error("STC Pay initiation error for invoice $invoiceId: ${e.message}", e)
            return STCPayInitiationResult(
                success = false,
                error = e.message ?: "Payment initiation failed"
            )
        }
    }

    /**
     * Confirms an STC Pay payment with OTP.
     */
    @Transactional
    fun confirmPayment(invoiceId: UUID, otp: String): STCPayConfirmationResult {
        if (!config.isConfigured()) {
            return STCPayConfirmationResult(
                success = false,
                error = "STC Pay is not configured"
            )
        }

        val invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow { NoSuchElementException("Invoice not found: $invoiceId") }

        if (invoice.stcpayOtpReference.isNullOrBlank()) {
            return STCPayConfirmationResult(
                success = false,
                error = "No pending STC Pay payment for this invoice"
            )
        }

        try {
            val requestBody: Map<String, Any> = mapOf(
                "merchantId" to config.merchantId,
                "otpReference" to (invoice.stcpayOtpReference ?: ""),
                "otp" to otp,
                "transactionId" to (invoice.stcpayTransactionId ?: "")
            )

            val headers = createHeaders(requestBody)
            val response = sendRequest("/payment/confirm", requestBody, headers)

            if (response["status"] == "SUCCESS") {
                val paymentReference = response["paymentReference"] as String

                // Record the payment
                invoice.stcpayPaymentReference = paymentReference
                invoice.recordPayment(
                    amount = invoice.totalAmount,
                    method = PaymentMethod.STC_PAY,
                    reference = paymentReference
                )
                invoiceRepository.save(invoice)

                logger.info("STC Pay payment confirmed for invoice ${invoice.invoiceNumber}: $paymentReference")

                return STCPayConfirmationResult(
                    success = true,
                    paymentReference = paymentReference,
                    transactionId = invoice.stcpayTransactionId
                )
            } else {
                val errorMessage = response["message"] as? String ?: "Unknown error"
                logger.error("STC Pay confirmation failed: $errorMessage")
                return STCPayConfirmationResult(
                    success = false,
                    error = errorMessage
                )
            }
        } catch (e: Exception) {
            logger.error("STC Pay confirmation error for invoice $invoiceId: ${e.message}", e)
            return STCPayConfirmationResult(
                success = false,
                error = e.message ?: "Payment confirmation failed"
            )
        }
    }

    /**
     * Verifies an STC Pay transaction status.
     */
    fun verifyTransaction(transactionId: String): STCPayTransactionStatus {
        if (!config.isConfigured()) {
            return STCPayTransactionStatus(
                transactionId = transactionId,
                status = "ERROR",
                error = "STC Pay is not configured"
            )
        }

        try {
            val requestBody = mapOf(
                "merchantId" to config.merchantId,
                "transactionId" to transactionId
            )

            val headers = createHeaders(requestBody)
            val response = sendRequest("/payment/status", requestBody, headers)

            return STCPayTransactionStatus(
                transactionId = transactionId,
                status = response["status"] as? String ?: "UNKNOWN",
                paymentReference = response["paymentReference"] as? String,
                amount = (response["amount"] as? Number)?.let { BigDecimal(it.toString()) }
            )
        } catch (e: Exception) {
            logger.error("STC Pay status check error for transaction $transactionId: ${e.message}", e)
            return STCPayTransactionStatus(
                transactionId = transactionId,
                status = "ERROR",
                error = e.message
            )
        }
    }

    /**
     * Handles STC Pay webhook callback.
     */
    @Transactional
    fun handleCallback(payload: Map<String, Any>): Boolean {
        try {
            val transactionId = payload["transactionId"] as? String ?: return false
            val status = payload["status"] as? String ?: return false
            val paymentReference = payload["paymentReference"] as? String

            logger.info("STC Pay callback received: transactionId=$transactionId, status=$status")

            // Find invoice by transaction ID
            val invoice = invoiceRepository.findByStcpayTransactionId(transactionId)
            if (invoice == null) {
                logger.warn("Invoice not found for STC Pay transaction: $transactionId")
                return false
            }

            when (status) {
                "COMPLETED" -> {
                    if (invoice.canBePaid() && paymentReference != null) {
                        invoice.stcpayPaymentReference = paymentReference
                        invoice.recordPayment(
                            amount = invoice.totalAmount,
                            method = PaymentMethod.STC_PAY,
                            reference = paymentReference
                        )
                        invoiceRepository.save(invoice)
                        logger.info("STC Pay payment recorded via callback for invoice ${invoice.invoiceNumber}")
                    }
                }
                "FAILED", "CANCELLED", "EXPIRED" -> {
                    // Clear STC Pay references
                    invoice.stcpayOtpReference = null
                    invoice.stcpayTransactionId = null
                    invoiceRepository.save(invoice)
                    logger.info("STC Pay payment $status for invoice ${invoice.invoiceNumber}")
                }
            }

            return true
        } catch (e: Exception) {
            logger.error("Error processing STC Pay callback: ${e.message}", e)
            return false
        }
    }

    // Helper to format Saudi mobile number
    private fun formatSaudiMobile(number: String): String {
        var formatted = number.replace(Regex("[^0-9]"), "")
        if (formatted.startsWith("0")) {
            formatted = "966" + formatted.substring(1)
        }
        if (!formatted.startsWith("966")) {
            formatted = "966$formatted"
        }
        return formatted
    }

    // Create HMAC signed headers
    private fun createHeaders(body: Map<String, Any>): HttpHeaders {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        headers.set("X-API-Key", config.apiKey)
        headers.set("X-Timestamp", Instant.now().toEpochMilli().toString())

        // Create HMAC signature
        val bodyJson = objectMapper.writeValueAsString(body)
        val signature = createHmacSignature(bodyJson)
        headers.set("X-Signature", signature)

        return headers
    }

    private fun createHmacSignature(data: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(config.secretKey.toByteArray(), "HmacSHA256"))
        val hash = mac.doFinal(data.toByteArray())
        return hash.joinToString("") { "%02x".format(it) }
    }

    @Suppress("UNCHECKED_CAST")
    private fun sendRequest(endpoint: String, body: Map<String, Any>, headers: HttpHeaders): Map<String, Any> {
        val url = "${config.apiUrl}$endpoint"
        val entity = HttpEntity(body, headers)
        val response = restTemplate.postForObject(url, entity, Map::class.java)
        return (response as? Map<String, Any>) ?: emptyMap()
    }

    // Extension to check if invoice can be paid
    private fun Invoice.canBePaid(): Boolean {
        return status in listOf(
            com.liyaqa.billing.domain.model.InvoiceStatus.ISSUED,
            com.liyaqa.billing.domain.model.InvoiceStatus.OVERDUE,
            com.liyaqa.billing.domain.model.InvoiceStatus.PARTIALLY_PAID
        )
    }
}

// Result classes
data class STCPayInitiationResult(
    val success: Boolean,
    val otpReference: String? = null,
    val transactionId: String? = null,
    val expiresIn: Int? = null,
    val error: String? = null
)

data class STCPayConfirmationResult(
    val success: Boolean,
    val paymentReference: String? = null,
    val transactionId: String? = null,
    val error: String? = null
)

data class STCPayTransactionStatus(
    val transactionId: String,
    val status: String,
    val paymentReference: String? = null,
    val amount: BigDecimal? = null,
    val error: String? = null
)
