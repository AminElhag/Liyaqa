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
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Service for SADAD bill payment integration.
 *
 * SADAD flow:
 * 1. Generate bill - creates a bill with unique number in SADAD system
 * 2. Customer pays via any Saudi bank's online/mobile banking
 * 3. Receive payment notification via callback
 *
 * SADAD is the most trusted payment method in Saudi Arabia for:
 * - Government bills
 * - Utility payments
 * - Telecom bills
 * - Educational fees
 * - Subscription-based services (like gym memberships)
 */
@Service
class SadadService(
    private val config: SadadConfig,
    private val invoiceRepository: InvoiceRepository,
    private val memberRepository: MemberRepository,
    private val clubRepository: ClubRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(SadadService::class.java)
    private val restTemplate = RestTemplate()

    /**
     * Generates a SADAD bill for an invoice.
     * Returns bill details that customer can use to pay via any Saudi bank.
     */
    @Transactional
    fun generateBill(invoiceId: UUID): SadadBillResult {
        if (!config.isConfigured()) {
            logger.warn("SADAD is not configured")
            return SadadBillResult(
                success = false,
                error = "SADAD is not configured"
            )
        }

        val invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow { NoSuchElementException("Invoice not found: $invoiceId") }

        // Validate invoice can have a bill generated
        if (!invoice.canHaveBillGenerated()) {
            return SadadBillResult(
                success = false,
                error = "Invoice cannot have a bill generated. Status: ${invoice.status}"
            )
        }

        // Check if bill already exists
        if (!invoice.sadadBillNumber.isNullOrBlank()) {
            return SadadBillResult(
                success = true,
                billNumber = invoice.sadadBillNumber,
                billAccount = invoice.sadadBillAccount,
                amount = invoice.totalAmount.amount,
                dueDate = invoice.sadadDueDate,
                alreadyGenerated = true
            )
        }

        val member = memberRepository.findById(invoice.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${invoice.memberId}") }

        try {
            val billNumber = generateBillNumber(invoice)
            val billDueDate = invoice.dueDate ?: LocalDate.now().plusDays(config.billValidityDays.toLong())

            val requestBody = mapOf(
                "billerCode" to config.billerCode,
                "billNumber" to billNumber,
                "billAccount" to invoice.memberId.toString().replace("-", "").take(16),
                "amount" to invoice.totalAmount.amount.setScale(2).toString(),
                "currency" to "SAR",
                "dueDate" to billDueDate.toString(),
                "customerName" to member.firstName,
                "customerIdNumber" to (member.nationalId ?: ""),
                "description" to "Invoice ${invoice.invoiceNumber}",
                "referenceNumber" to invoice.id.toString()
            )

            val headers = createHeaders(requestBody)
            val response = sendRequest("/bills/create", requestBody, headers)

            if (response["status"] == "SUCCESS") {
                val sadadBillNumber = response["billNumber"] as String
                val sadadBillAccount = response["billAccount"] as String

                // Update invoice with SADAD references
                invoice.sadadBillNumber = sadadBillNumber
                invoice.sadadBillAccount = sadadBillAccount
                invoice.sadadDueDate = billDueDate
                invoice.sadadStatus = "PENDING"
                invoiceRepository.save(invoice)

                logger.info("SADAD bill generated for invoice ${invoice.invoiceNumber}: $sadadBillNumber")

                return SadadBillResult(
                    success = true,
                    billNumber = sadadBillNumber,
                    billAccount = sadadBillAccount,
                    billerCode = config.billerCode,
                    amount = invoice.totalAmount.amount,
                    dueDate = billDueDate
                )
            } else {
                val errorMessage = response["message"] as? String ?: "Unknown error"
                logger.error("SADAD bill generation failed: $errorMessage")
                return SadadBillResult(
                    success = false,
                    error = errorMessage
                )
            }
        } catch (e: Exception) {
            logger.error("SADAD bill generation error for invoice $invoiceId: ${e.message}", e)
            return SadadBillResult(
                success = false,
                error = e.message ?: "Bill generation failed"
            )
        }
    }

    /**
     * Checks the status of a SADAD bill.
     */
    fun checkBillStatus(billNumber: String): SadadBillStatus {
        if (!config.isConfigured()) {
            return SadadBillStatus(
                billNumber = billNumber,
                status = "ERROR",
                error = "SADAD is not configured"
            )
        }

        try {
            val requestBody = mapOf(
                "billerCode" to config.billerCode,
                "billNumber" to billNumber
            )

            val headers = createHeaders(requestBody)
            val response = sendRequest("/bills/status", requestBody, headers)

            return SadadBillStatus(
                billNumber = billNumber,
                status = response["status"] as? String ?: "UNKNOWN",
                paidAmount = (response["paidAmount"] as? Number)?.let { BigDecimal(it.toString()) },
                paidAt = response["paidAt"] as? String,
                paymentReference = response["paymentReference"] as? String
            )
        } catch (e: Exception) {
            logger.error("SADAD status check error for bill $billNumber: ${e.message}", e)
            return SadadBillStatus(
                billNumber = billNumber,
                status = "ERROR",
                error = e.message
            )
        }
    }

    /**
     * Cancels a SADAD bill.
     */
    @Transactional
    fun cancelBill(invoiceId: UUID): SadadCancelResult {
        if (!config.isConfigured()) {
            return SadadCancelResult(
                success = false,
                error = "SADAD is not configured"
            )
        }

        val invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow { NoSuchElementException("Invoice not found: $invoiceId") }

        if (invoice.sadadBillNumber.isNullOrBlank()) {
            return SadadCancelResult(
                success = false,
                error = "No SADAD bill exists for this invoice"
            )
        }

        try {
            val requestBody: Map<String, Any> = mapOf(
                "billerCode" to config.billerCode,
                "billNumber" to (invoice.sadadBillNumber ?: "")
            )

            val headers = createHeaders(requestBody)
            val response = sendRequest("/bills/cancel", requestBody, headers)

            if (response["status"] == "SUCCESS") {
                invoice.sadadStatus = "CANCELLED"
                invoiceRepository.save(invoice)

                logger.info("SADAD bill cancelled for invoice ${invoice.invoiceNumber}")

                return SadadCancelResult(success = true)
            } else {
                val errorMessage = response["message"] as? String ?: "Unknown error"
                return SadadCancelResult(
                    success = false,
                    error = errorMessage
                )
            }
        } catch (e: Exception) {
            logger.error("SADAD bill cancellation error for invoice $invoiceId: ${e.message}", e)
            return SadadCancelResult(
                success = false,
                error = e.message ?: "Bill cancellation failed"
            )
        }
    }

    /**
     * Handles SADAD payment callback.
     */
    @Transactional
    fun handleCallback(payload: Map<String, Any>): Boolean {
        try {
            val billNumber = payload["billNumber"] as? String ?: return false
            val status = payload["status"] as? String ?: return false
            val paymentReference = payload["paymentReference"] as? String
            val paidAmount = (payload["paidAmount"] as? Number)?.let { BigDecimal(it.toString()) }

            logger.info("SADAD callback received: billNumber=$billNumber, status=$status")

            // Find invoice by bill number
            val invoice = invoiceRepository.findBySadadBillNumber(billNumber)
            if (invoice == null) {
                logger.warn("Invoice not found for SADAD bill: $billNumber")
                return false
            }

            when (status) {
                "PAID" -> {
                    if (invoice.canBePaid() && paidAmount != null) {
                        invoice.sadadStatus = "PAID"
                        invoice.recordPayment(
                            amount = invoice.totalAmount,
                            method = PaymentMethod.SADAD,
                            reference = paymentReference
                        )
                        invoiceRepository.save(invoice)
                        logger.info("SADAD payment recorded for invoice ${invoice.invoiceNumber}")
                    }
                }
                "EXPIRED" -> {
                    invoice.sadadStatus = "EXPIRED"
                    invoiceRepository.save(invoice)
                    logger.info("SADAD bill expired for invoice ${invoice.invoiceNumber}")
                }
                "CANCELLED" -> {
                    invoice.sadadStatus = "CANCELLED"
                    invoiceRepository.save(invoice)
                    logger.info("SADAD bill cancelled for invoice ${invoice.invoiceNumber}")
                }
            }

            return true
        } catch (e: Exception) {
            logger.error("Error processing SADAD callback: ${e.message}", e)
            return false
        }
    }

    // Generate unique bill number
    private fun generateBillNumber(invoice: Invoice): String {
        val timestamp = Instant.now().epochSecond.toString().takeLast(8)
        val invoicePart = invoice.invoiceNumber.replace(Regex("[^0-9]"), "").takeLast(6)
        return "${config.billerCode}$timestamp$invoicePart"
    }

    // Create signed headers
    private fun createHeaders(body: Map<String, Any>): HttpHeaders {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        headers.set("X-API-Key", config.apiKey)
        headers.set("X-Timestamp", Instant.now().toEpochMilli().toString())

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

    // Extension to check if invoice can have bill generated
    private fun Invoice.canHaveBillGenerated(): Boolean {
        return status in listOf(
            com.liyaqa.billing.domain.model.InvoiceStatus.ISSUED,
            com.liyaqa.billing.domain.model.InvoiceStatus.OVERDUE,
            com.liyaqa.billing.domain.model.InvoiceStatus.PARTIALLY_PAID
        )
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
data class SadadBillResult(
    val success: Boolean,
    val billNumber: String? = null,
    val billAccount: String? = null,
    val billerCode: String? = null,
    val amount: BigDecimal? = null,
    val dueDate: LocalDate? = null,
    val alreadyGenerated: Boolean = false,
    val error: String? = null
)

data class SadadBillStatus(
    val billNumber: String,
    val status: String,
    val paidAmount: BigDecimal? = null,
    val paidAt: String? = null,
    val paymentReference: String? = null,
    val error: String? = null
)

data class SadadCancelResult(
    val success: Boolean,
    val error: String? = null
)
