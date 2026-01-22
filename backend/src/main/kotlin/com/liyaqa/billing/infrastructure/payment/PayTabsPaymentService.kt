package com.liyaqa.billing.infrastructure.payment

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.shop.application.services.OrderService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.slf4j.LoggerFactory
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.retry.annotation.Backoff
import org.springframework.retry.annotation.Retryable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestTemplate
import java.math.BigDecimal
import java.security.MessageDigest
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Service for PayTabs payment gateway integration.
 *
 * Handles:
 * - Payment initiation (creates PayTabs payment page)
 * - Payment callback processing
 * - Payment verification
 * - Payment notifications
 */
@Service
class PayTabsPaymentService(
    private val config: PayTabsConfig,
    private val invoiceRepository: InvoiceRepository,
    private val memberRepository: MemberRepository,
    private val notificationService: NotificationService,
    private val orderService: OrderService
) {
    private val logger = LoggerFactory.getLogger(PayTabsPaymentService::class.java)
    private val restTemplate = RestTemplate()
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    /**
     * Initiates a payment for an invoice.
     * Returns a PayTabs payment page URL for the member to complete payment.
     * Retries up to 3 times with exponential backoff on network failures.
     */
    @Transactional
    @Retryable(
        retryFor = [RestClientException::class],
        maxAttempts = 3,
        backoff = Backoff(delay = 1000, multiplier = 2.0)
    )
    fun initiatePayment(invoiceId: UUID): PaymentInitiationResult {
        if (!config.isConfigured()) {
            logger.warn("PayTabs is not configured. Payment initiation skipped.")
            return PaymentInitiationResult(
                success = false,
                error = "Payment gateway not configured"
            )
        }

        val invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow { NoSuchElementException("Invoice not found: $invoiceId") }

        val member = memberRepository.findById(invoice.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${invoice.memberId}") }

        // Validate invoice can be paid
        if (invoice.status !in listOf(
                com.liyaqa.billing.domain.model.InvoiceStatus.ISSUED,
                com.liyaqa.billing.domain.model.InvoiceStatus.OVERDUE,
                com.liyaqa.billing.domain.model.InvoiceStatus.PARTIALLY_PAID
            )
        ) {
            return PaymentInitiationResult(
                success = false,
                error = "Invoice cannot be paid. Current status: ${invoice.status}"
            )
        }

        val remainingAmount = invoice.remainingBalance()

        try {
            val request = PayTabsPaymentRequest(
                profileId = config.profileId,
                tranType = "sale",
                tranClass = "ecom",
                cartId = invoice.invoiceNumber,
                cartDescription = "Invoice #${invoice.invoiceNumber}",
                cartCurrency = remainingAmount.currency,
                cartAmount = remainingAmount.amount.setScale(2).toString(),
                callback = config.callbackUrl,
                returnUrl = config.returnUrl,
                customerDetails = PayTabsCustomerDetails(
                    name = member.fullName.en,
                    email = member.email,
                    phone = member.phone,
                    street1 = member.address?.street ?: "",
                    city = member.address?.city ?: "",
                    state = member.address?.state ?: "",
                    country = "SA",
                    zip = member.address?.postalCode ?: ""
                ),
                hideShipping = true,
                userDefined = mapOf(
                    "udf1" to invoiceId.toString(),
                    "udf2" to member.id.toString()
                )
            )

            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                set("authorization", config.serverKey)
            }

            val response = restTemplate.postForEntity(
                "${config.getApiBaseUrl()}/payment/request",
                HttpEntity(request, headers),
                PayTabsPaymentResponse::class.java
            )

            val body = response.body
            if (body != null && body.redirectUrl != null) {
                logger.info("Payment initiated for invoice ${invoice.invoiceNumber}. Transaction ref: ${body.tranRef}")
                return PaymentInitiationResult(
                    success = true,
                    redirectUrl = body.redirectUrl,
                    transactionRef = body.tranRef
                )
            } else {
                logger.error("PayTabs payment initiation failed: ${body?.message}")
                return PaymentInitiationResult(
                    success = false,
                    error = body?.message ?: "Payment initiation failed"
                )
            }
        } catch (e: Exception) {
            logger.error("Error initiating PayTabs payment: ${e.message}", e)
            return PaymentInitiationResult(
                success = false,
                error = "Payment service error: ${e.message}"
            )
        }
    }

    /**
     * Processes a payment callback from PayTabs.
     * Called when PayTabs notifies us of a payment result.
     */
    @Transactional
    fun processCallback(callback: PayTabsCallbackData, signature: String? = null): PaymentCallbackResult {
        logger.info("Processing PayTabs callback for transaction: ${callback.tranRef}")

        // Verify the callback signature
        if (!verifyCallbackSignature(callback, signature)) {
            logger.warn("Invalid callback signature for transaction: ${callback.tranRef}")
            return PaymentCallbackResult(
                success = false,
                error = "Invalid callback signature"
            )
        }

        val invoiceId = callback.userDefined?.udf1
            ?: return PaymentCallbackResult(
                success = false,
                error = "Missing invoice ID in callback"
            )

        val invoice = invoiceRepository.findById(UUID.fromString(invoiceId))
            .orElse(null)
            ?: return PaymentCallbackResult(
                success = false,
                error = "Invoice not found: $invoiceId"
            )

        // Verify the payment amount matches the invoice (prevent amount tampering)
        if (!verifyCallbackAmount(callback, invoice)) {
            logger.warn("Amount verification failed for transaction: ${callback.tranRef}")
            return PaymentCallbackResult(
                success = false,
                error = "Payment amount does not match invoice"
            )
        }

        val member = memberRepository.findById(invoice.memberId).orElse(null)

        return when (callback.respStatus) {
            "A" -> { // Authorized/Approved
                val amount = BigDecimal(callback.cartAmount)
                invoice.recordPayment(
                    amount = Money.of(amount, callback.cartCurrency),
                    method = PaymentMethod.PAYTABS,
                    reference = callback.tranRef
                )
                invoiceRepository.save(invoice)

                // Fulfill associated order if exists (for product purchases)
                try {
                    orderService.getOrderByInvoiceId(invoice.id)?.let { order ->
                        orderService.fulfillOrder(order.id)
                        logger.info("Order ${order.id} fulfilled after payment for invoice ${invoice.invoiceNumber}")
                    }
                } catch (e: Exception) {
                    logger.error("Error fulfilling order for invoice ${invoice.invoiceNumber}: ${e.message}", e)
                    // Don't fail the payment callback - order can be fulfilled manually
                }

                // Send payment confirmation notification
                if (member != null) {
                    sendPaymentConfirmationNotification(invoice, member, amount, callback.cartCurrency)
                }

                logger.info("Payment recorded for invoice ${invoice.invoiceNumber}. Amount: ${callback.cartAmount} ${callback.cartCurrency}")
                PaymentCallbackResult(
                    success = true,
                    invoiceId = invoice.id,
                    status = "PAID",
                    message = "Payment processed successfully"
                )
            }
            "D" -> { // Declined
                logger.warn("Payment declined for invoice ${invoice.invoiceNumber}. Reason: ${callback.respMessage}")
                PaymentCallbackResult(
                    success = false,
                    invoiceId = invoice.id,
                    status = "DECLINED",
                    error = callback.respMessage ?: "Payment declined"
                )
            }
            "E" -> { // Error
                logger.error("Payment error for invoice ${invoice.invoiceNumber}. Error: ${callback.respMessage}")
                PaymentCallbackResult(
                    success = false,
                    invoiceId = invoice.id,
                    status = "ERROR",
                    error = callback.respMessage ?: "Payment error"
                )
            }
            "H" -> { // Hold
                logger.info("Payment on hold for invoice ${invoice.invoiceNumber}")
                PaymentCallbackResult(
                    success = false,
                    invoiceId = invoice.id,
                    status = "HOLD",
                    error = "Payment is on hold"
                )
            }
            "P" -> { // Pending
                logger.info("Payment pending for invoice ${invoice.invoiceNumber}")
                PaymentCallbackResult(
                    success = false,
                    invoiceId = invoice.id,
                    status = "PENDING",
                    error = "Payment is pending"
                )
            }
            "V" -> { // Voided
                logger.info("Payment voided for invoice ${invoice.invoiceNumber}")
                PaymentCallbackResult(
                    success = false,
                    invoiceId = invoice.id,
                    status = "VOIDED",
                    error = "Payment was voided"
                )
            }
            else -> {
                logger.warn("Unknown payment status for invoice ${invoice.invoiceNumber}: ${callback.respStatus}")
                PaymentCallbackResult(
                    success = false,
                    invoiceId = invoice.id,
                    status = "UNKNOWN",
                    error = "Unknown payment status: ${callback.respStatus}"
                )
            }
        }
    }

    /**
     * Verifies a payment transaction with PayTabs.
     * Retries up to 3 times with exponential backoff on network failures.
     */
    @Retryable(
        retryFor = [RestClientException::class],
        maxAttempts = 3,
        backoff = Backoff(delay = 1000, multiplier = 2.0)
    )
    fun verifyPayment(transactionRef: String): PaymentVerificationResult {
        if (!config.isConfigured()) {
            return PaymentVerificationResult(success = false, error = "Payment gateway not configured")
        }

        try {
            val request = mapOf(
                "profile_id" to config.profileId,
                "tran_ref" to transactionRef
            )

            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                set("authorization", config.serverKey)
            }

            val response = restTemplate.postForEntity(
                "${config.getApiBaseUrl()}/payment/query",
                HttpEntity(request, headers),
                PayTabsQueryResponse::class.java
            )

            val body = response.body
            return if (body != null) {
                PaymentVerificationResult(
                    success = true,
                    transactionRef = body.tranRef,
                    status = body.paymentResult?.responseStatus,
                    amount = body.cartAmount,
                    currency = body.cartCurrency
                )
            } else {
                PaymentVerificationResult(success = false, error = "Empty response from PayTabs")
            }
        } catch (e: Exception) {
            logger.error("Error verifying PayTabs payment: ${e.message}", e)
            return PaymentVerificationResult(success = false, error = "Verification failed: ${e.message}")
        }
    }

    /**
     * Verifies the callback signature from PayTabs.
     * PayTabs sends a signature header that should match HMAC-SHA256 of transaction reference + server key.
     *
     * Note: In development mode (when server key is empty or default), this verification is skipped
     * to allow testing without PayTabs configuration.
     */
    private fun verifyCallbackSignature(callback: PayTabsCallbackData, signature: String?): Boolean {
        // Skip verification if PayTabs is not configured (development mode)
        if (!config.isConfigured()) {
            logger.debug("PayTabs not configured - skipping signature verification")
            return true
        }

        // In production, signature is required - reject if missing
        if (signature.isNullOrBlank()) {
            logger.warn("No signature provided in callback - rejecting for security")
            return false
        }

        try {
            // PayTabs signature is typically HMAC-SHA256 of transaction data
            val dataToSign = "${callback.tranRef}${callback.cartAmount}${callback.cartCurrency}${callback.respStatus}"
            val expectedSignature = generateHmacSha256(dataToSign, config.serverKey)

            // Use constant-time comparison to prevent timing attacks
            val isSignatureValid = MessageDigest.isEqual(
                signature.lowercase().toByteArray(Charsets.UTF_8),
                expectedSignature.lowercase().toByteArray(Charsets.UTF_8)
            )

            if (!isSignatureValid) {
                logger.warn("Signature mismatch for transaction: ${callback.tranRef}")
            }

            return isSignatureValid
        } catch (e: Exception) {
            logger.error("Error verifying callback signature: ${e.message}", e)
            return false
        }
    }

    /**
     * Generates HMAC-SHA256 signature.
     */
    private fun generateHmacSha256(data: String, key: String): String {
        val algorithm = "HmacSHA256"
        val secretKeySpec = SecretKeySpec(key.toByteArray(Charsets.UTF_8), algorithm)
        val mac = Mac.getInstance(algorithm)
        mac.init(secretKeySpec)
        val hash = mac.doFinal(data.toByteArray(Charsets.UTF_8))
        return hash.joinToString("") { "%02x".format(it) }
    }

    /**
     * Verifies the invoice amount matches the callback amount.
     */
    private fun verifyCallbackAmount(callback: PayTabsCallbackData, invoice: Invoice): Boolean {
        try {
            val callbackAmount = BigDecimal(callback.cartAmount)
            val invoiceRemaining = invoice.remainingBalance().amount

            // Allow small floating point differences (0.01)
            val difference = (callbackAmount - invoiceRemaining).abs()
            if (difference > BigDecimal("0.01")) {
                logger.warn("Amount mismatch for invoice ${invoice.invoiceNumber}. " +
                    "Callback: $callbackAmount, Invoice remaining: $invoiceRemaining")
                return false
            }
            return true
        } catch (e: Exception) {
            logger.error("Error verifying callback amount: ${e.message}")
            return false
        }
    }

    private fun sendPaymentConfirmationNotification(invoice: Invoice, member: Member, amount: BigDecimal, currency: String) {
        try {
            val subject = LocalizedText(
                en = "Payment Received - Invoice #${invoice.invoiceNumber}",
                ar = "تم استلام الدفعة - فاتورة #${invoice.invoiceNumber}"
            )

            val formattedAmount = "$currency ${amount.setScale(2)}"
            val paidDate = invoice.paidDate?.format(dateFormatter) ?: "N/A"

            val body = LocalizedText(
                en = """
                    <h2>Payment Confirmation</h2>
                    <p>Dear ${member.firstName.en},</p>
                    <p>Thank you! We have received your payment.</p>
                    <p><strong>Invoice:</strong> #${invoice.invoiceNumber}<br>
                    <strong>Amount Paid:</strong> $formattedAmount<br>
                    <strong>Payment Date:</strong> $paidDate</p>
                    <p>Best regards,<br>Liyaqa Team</p>
                """.trimIndent(),
                ar = """
                    <h2>تأكيد الدفع</h2>
                    <p>عزيزي ${member.firstName.get("ar") ?: member.firstName.en}،</p>
                    <p>شكراً لك! لقد استلمنا دفعتك.</p>
                    <p><strong>الفاتورة:</strong> #${invoice.invoiceNumber}<br>
                    <strong>المبلغ المدفوع:</strong> $formattedAmount<br>
                    <strong>تاريخ الدفع:</strong> $paidDate</p>
                    <p>مع تحيات،<br>فريق لياقة</p>
                """.trimIndent()
            )

            notificationService.sendMultiChannelIfNotDuplicate(
                memberId = member.id,
                email = member.email,
                phone = member.phone,
                type = NotificationType.INVOICE_PAID,
                subject = subject,
                body = body,
                priority = NotificationPriority.NORMAL,
                referenceId = invoice.id,
                referenceType = "invoice",
                deduplicationHours = 1
            )
        } catch (e: Exception) {
            logger.error("Error sending payment confirmation notification: ${e.message}")
        }
    }
}

// Data classes for PayTabs API

data class PayTabsPaymentRequest(
    @JsonProperty("profile_id") val profileId: String,
    @JsonProperty("tran_type") val tranType: String,
    @JsonProperty("tran_class") val tranClass: String,
    @JsonProperty("cart_id") val cartId: String,
    @JsonProperty("cart_description") val cartDescription: String,
    @JsonProperty("cart_currency") val cartCurrency: String,
    @JsonProperty("cart_amount") val cartAmount: String,
    @JsonProperty("callback") val callback: String,
    @JsonProperty("return") val returnUrl: String,
    @JsonProperty("customer_details") val customerDetails: PayTabsCustomerDetails,
    @JsonProperty("hide_shipping") val hideShipping: Boolean,
    @JsonProperty("user_defined") val userDefined: Map<String, String>
)

data class PayTabsCustomerDetails(
    @JsonProperty("name") val name: String,
    @JsonProperty("email") val email: String,
    @JsonProperty("phone") val phone: String?,
    @JsonProperty("street1") val street1: String,
    @JsonProperty("city") val city: String,
    @JsonProperty("state") val state: String,
    @JsonProperty("country") val country: String,
    @JsonProperty("zip") val zip: String
)

data class PayTabsPaymentResponse(
    @JsonProperty("tran_ref") val tranRef: String?,
    @JsonProperty("redirect_url") val redirectUrl: String?,
    @JsonProperty("message") val message: String?
)

data class PayTabsCallbackData(
    @JsonProperty("tran_ref") val tranRef: String,
    @JsonProperty("cart_id") val cartId: String,
    @JsonProperty("cart_amount") val cartAmount: String,
    @JsonProperty("cart_currency") val cartCurrency: String,
    @JsonProperty("customer_details") val customerDetails: PayTabsCustomerDetails?,
    @JsonProperty("payment_result") val paymentResult: PayTabsPaymentResult?,
    @JsonProperty("resp_status") val respStatus: String,
    @JsonProperty("resp_code") val respCode: String?,
    @JsonProperty("resp_message") val respMessage: String?,
    @JsonProperty("user_defined") val userDefined: PayTabsUserDefined?
)

data class PayTabsPaymentResult(
    @JsonProperty("response_status") val responseStatus: String?,
    @JsonProperty("response_code") val responseCode: String?,
    @JsonProperty("response_message") val responseMessage: String?
)

data class PayTabsUserDefined(
    @JsonProperty("udf1") val udf1: String?,
    @JsonProperty("udf2") val udf2: String?
)

data class PayTabsQueryResponse(
    @JsonProperty("tran_ref") val tranRef: String?,
    @JsonProperty("cart_amount") val cartAmount: String?,
    @JsonProperty("cart_currency") val cartCurrency: String?,
    @JsonProperty("payment_result") val paymentResult: PayTabsPaymentResult?
)

// Result classes

data class PaymentInitiationResult(
    val success: Boolean,
    val redirectUrl: String? = null,
    val transactionRef: String? = null,
    val error: String? = null
)

data class PaymentCallbackResult(
    val success: Boolean,
    val invoiceId: UUID? = null,
    val status: String? = null,
    val message: String? = null,
    val error: String? = null
)

data class PaymentVerificationResult(
    val success: Boolean,
    val transactionRef: String? = null,
    val status: String? = null,
    val amount: String? = null,
    val currency: String? = null,
    val error: String? = null
)
