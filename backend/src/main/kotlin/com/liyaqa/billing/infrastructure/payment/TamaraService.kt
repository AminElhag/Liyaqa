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
import java.util.UUID

/**
 * Service for Tamara BNPL (Buy Now Pay Later) integration.
 *
 * Tamara flow:
 * 1. Create checkout session - returns checkout URL
 * 2. Customer completes Tamara checkout (identity verification, payment plan selection)
 * 3. Receive order confirmation via webhook
 * 4. Tamara pays merchant upfront, customer pays Tamara in installments
 *
 * Tamara payment options:
 * - Pay in 3: Split into 3 equal payments over 2 months
 * - Pay in 4: Split into 4 equal payments over 3 months
 * - Pay in 30: Full payment in 30 days
 *
 * Benefits for gyms:
 * - Higher conversion on annual memberships
 * - Merchant receives full amount upfront
 * - No credit risk (Tamara bears the risk)
 */
@Service
class TamaraService(
    private val config: TamaraConfig,
    private val invoiceRepository: InvoiceRepository,
    private val memberRepository: MemberRepository,
    private val clubRepository: ClubRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(TamaraService::class.java)
    private val restTemplate = RestTemplate()

    /**
     * Creates a Tamara checkout session for an invoice.
     * Returns checkout URL where customer completes the BNPL purchase.
     */
    @Transactional
    fun createCheckout(invoiceId: UUID, instalments: Int = config.defaultInstalments): TamaraCheckoutResult {
        if (!config.isConfigured()) {
            logger.warn("Tamara is not configured")
            return TamaraCheckoutResult(
                success = false,
                error = "Tamara is not configured"
            )
        }

        val invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow { NoSuchElementException("Invoice not found: $invoiceId") }

        // Validate invoice can be paid
        if (!invoice.canBePaid()) {
            return TamaraCheckoutResult(
                success = false,
                error = "Invoice cannot be paid. Status: ${invoice.status}"
            )
        }

        // Check amount eligibility
        val amountInSar = invoice.totalAmount.amount.toInt()
        if (!config.isAmountEligible(amountInSar)) {
            return TamaraCheckoutResult(
                success = false,
                error = "Amount ${invoice.totalAmount.amount} SAR is not eligible for Tamara. Min: ${config.minAmount}, Max: ${config.maxAmount}"
            )
        }

        val member = memberRepository.findById(invoice.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${invoice.memberId}") }

        try {
            val requestBody = mapOf(
                "order_reference_id" to invoice.id.toString(),
                "total_amount" to mapOf(
                    "amount" to invoice.totalAmount.amount.setScale(2).toString(),
                    "currency" to "SAR"
                ),
                "description" to "Invoice ${invoice.invoiceNumber}",
                "country_code" to "SA",
                "payment_type" to "PAY_BY_INSTALMENTS",
                "instalments" to instalments,
                "locale" to "ar_SA",
                "items" to invoice.lineItems.map { item ->
                    mapOf(
                        "reference_id" to item.id.toString(),
                        "type" to "physical",
                        "name" to item.description.en,
                        "quantity" to item.quantity,
                        "unit_price" to mapOf(
                            "amount" to item.unitPrice.amount.setScale(2).toString(),
                            "currency" to "SAR"
                        ),
                        "total_amount" to mapOf(
                            "amount" to item.lineTotal().amount.setScale(2).toString(),
                            "currency" to "SAR"
                        )
                    )
                },
                "consumer" to mapOf(
                    "first_name" to member.firstName.en,
                    "last_name" to member.lastName.en,
                    "phone_number" to (member.phone ?: ""),
                    "email" to member.email
                ),
                "merchant_url" to mapOf(
                    "success" to "${config.successUrl}?invoiceId=$invoiceId",
                    "failure" to "${config.failureUrl}?invoiceId=$invoiceId",
                    "cancel" to "${config.cancelUrl}?invoiceId=$invoiceId",
                    "notification" to config.notificationUrl
                ),
                "tax_amount" to mapOf(
                    "amount" to invoice.vatAmount.amount.setScale(2).toString(),
                    "currency" to "SAR"
                )
            )

            val headers = createHeaders()
            val response = sendRequest("/checkout", requestBody, headers)

            val checkoutId = response["checkout_id"] as? String
            val checkoutUrl = response["checkout_url"] as? String

            if (checkoutId != null && checkoutUrl != null) {
                // Update invoice with Tamara references
                invoice.tamaraCheckoutId = checkoutId
                invoice.tamaraInstalments = instalments
                invoice.tamaraStatus = "CHECKOUT_CREATED"
                invoiceRepository.save(invoice)

                logger.info("Tamara checkout created for invoice ${invoice.invoiceNumber}: $checkoutId")

                return TamaraCheckoutResult(
                    success = true,
                    checkoutId = checkoutId,
                    checkoutUrl = checkoutUrl,
                    instalments = instalments,
                    instalmentsAmount = invoice.totalAmount.amount.divide(BigDecimal(instalments), 2, java.math.RoundingMode.CEILING)
                )
            } else {
                val errorMessage = response["message"] as? String ?: "Failed to create checkout"
                logger.error("Tamara checkout creation failed: $errorMessage")
                return TamaraCheckoutResult(
                    success = false,
                    error = errorMessage
                )
            }
        } catch (e: Exception) {
            logger.error("Tamara checkout error for invoice $invoiceId: ${e.message}", e)
            return TamaraCheckoutResult(
                success = false,
                error = e.message ?: "Checkout creation failed"
            )
        }
    }

    /**
     * Gets available payment options for an amount.
     */
    fun getPaymentOptions(amount: BigDecimal): TamaraPaymentOptions {
        if (!config.isConfigured()) {
            return TamaraPaymentOptions(
                available = false,
                error = "Tamara is not configured"
            )
        }

        val amountInSar = amount.toInt()
        if (!config.isAmountEligible(amountInSar)) {
            return TamaraPaymentOptions(
                available = false,
                minAmount = BigDecimal(config.minAmount),
                maxAmount = BigDecimal(config.maxAmount),
                error = "Amount not eligible"
            )
        }

        return TamaraPaymentOptions(
            available = true,
            minAmount = BigDecimal(config.minAmount),
            maxAmount = BigDecimal(config.maxAmount),
            payIn3 = TamaraInstalment(
                instalments = 3,
                instalmentsAmount = amount.divide(BigDecimal(3), 2, java.math.RoundingMode.CEILING)
            ),
            payIn4 = TamaraInstalment(
                instalments = 4,
                instalmentsAmount = amount.divide(BigDecimal(4), 2, java.math.RoundingMode.CEILING)
            ),
            payIn30Available = amountInSar <= 2000 // Pay in 30 usually has lower limits
        )
    }

    /**
     * Verifies an order status with Tamara.
     */
    fun getOrderStatus(orderId: String): TamaraOrderStatus {
        if (!config.isConfigured()) {
            return TamaraOrderStatus(
                orderId = orderId,
                status = "ERROR",
                error = "Tamara is not configured"
            )
        }

        try {
            val headers = createHeaders()
            val url = "${config.apiUrl}/orders/$orderId"
            val response = restTemplate.getForObject(url, Map::class.java)

            @Suppress("UNCHECKED_CAST")
            val responseMap = response as? Map<String, Any> ?: emptyMap()

            return TamaraOrderStatus(
                orderId = orderId,
                status = responseMap["status"] as? String ?: "UNKNOWN",
                totalAmount = (responseMap["total_amount"] as? Map<*, *>)?.get("amount")?.let { BigDecimal(it.toString()) },
                paymentType = responseMap["payment_type"] as? String,
                instalments = (responseMap["instalments"] as? Number)?.toInt()
            )
        } catch (e: Exception) {
            logger.error("Tamara order status error for order $orderId: ${e.message}", e)
            return TamaraOrderStatus(
                orderId = orderId,
                status = "ERROR",
                error = e.message
            )
        }
    }

    /**
     * Handles Tamara webhook callback.
     */
    @Transactional
    fun handleCallback(payload: Map<String, Any>): Boolean {
        try {
            val orderId = payload["order_id"] as? String ?: return false
            val eventType = payload["event_type"] as? String ?: return false
            val orderReferenceId = payload["order_reference_id"] as? String

            logger.info("Tamara callback received: orderId=$orderId, eventType=$eventType")

            // Find invoice by Tamara order ID or reference
            val invoice = if (orderId.isNotBlank()) {
                invoiceRepository.findByTamaraOrderId(orderId)
            } else if (orderReferenceId != null) {
                try {
                    invoiceRepository.findById(UUID.fromString(orderReferenceId)).orElse(null)
                } catch (e: Exception) {
                    null
                }
            } else {
                null
            }

            if (invoice == null) {
                logger.warn("Invoice not found for Tamara order: $orderId")
                return false
            }

            when (eventType) {
                "order_approved" -> {
                    invoice.tamaraOrderId = orderId
                    invoice.tamaraStatus = "APPROVED"
                    invoiceRepository.save(invoice)
                    logger.info("Tamara order approved for invoice ${invoice.invoiceNumber}")
                }
                "order_confirmed" -> {
                    if (invoice.canBePaid()) {
                        invoice.tamaraStatus = "CONFIRMED"
                        invoice.recordPayment(
                            amount = invoice.totalAmount,
                            method = PaymentMethod.TAMARA,
                            reference = orderId
                        )
                        invoiceRepository.save(invoice)
                        logger.info("Tamara payment confirmed for invoice ${invoice.invoiceNumber}")
                    }
                }
                "order_declined", "order_expired" -> {
                    invoice.tamaraStatus = eventType.uppercase().replace("ORDER_", "")
                    invoice.tamaraOrderId = null
                    invoice.tamaraCheckoutId = null
                    invoiceRepository.save(invoice)
                    logger.info("Tamara order $eventType for invoice ${invoice.invoiceNumber}")
                }
                "order_canceled" -> {
                    invoice.tamaraStatus = "CANCELLED"
                    invoiceRepository.save(invoice)
                    logger.info("Tamara order cancelled for invoice ${invoice.invoiceNumber}")
                }
            }

            return true
        } catch (e: Exception) {
            logger.error("Error processing Tamara callback: ${e.message}", e)
            return false
        }
    }

    /**
     * Authorizes a Tamara order after customer completes checkout.
     * This confirms the merchant wants to proceed with the order.
     */
    @Transactional
    fun authorizeOrder(orderId: String): TamaraAuthorizeResult {
        if (!config.isConfigured()) {
            return TamaraAuthorizeResult(
                success = false,
                error = "Tamara is not configured"
            )
        }

        try {
            val headers = createHeaders()
            val response = sendRequest("/orders/$orderId/authorise", emptyMap(), headers)

            val status = response["status"] as? String
            if (status == "authorised" || status == "approved") {
                val invoice = invoiceRepository.findByTamaraOrderId(orderId)
                if (invoice != null) {
                    invoice.tamaraStatus = "AUTHORISED"
                    invoiceRepository.save(invoice)
                }

                logger.info("Tamara order authorized: $orderId")

                return TamaraAuthorizeResult(
                    success = true,
                    orderId = orderId,
                    status = status
                )
            } else {
                val errorMessage = response["message"] as? String ?: "Authorization failed"
                return TamaraAuthorizeResult(
                    success = false,
                    error = errorMessage
                )
            }
        } catch (e: Exception) {
            logger.error("Tamara authorize error for order $orderId: ${e.message}", e)
            return TamaraAuthorizeResult(
                success = false,
                error = e.message ?: "Authorization failed"
            )
        }
    }

    /**
     * Captures a Tamara order (triggers the actual charge).
     */
    @Transactional
    fun captureOrder(orderId: String): TamaraCaptureResult {
        if (!config.isConfigured()) {
            return TamaraCaptureResult(
                success = false,
                error = "Tamara is not configured"
            )
        }

        val invoice = invoiceRepository.findByTamaraOrderId(orderId)
            ?: return TamaraCaptureResult(
                success = false,
                error = "Invoice not found for order: $orderId"
            )

        try {
            val requestBody = mapOf(
                "order_id" to orderId,
                "total_amount" to mapOf(
                    "amount" to invoice.totalAmount.amount.setScale(2).toString(),
                    "currency" to "SAR"
                ),
                "tax_amount" to mapOf(
                    "amount" to invoice.vatAmount.amount.setScale(2).toString(),
                    "currency" to "SAR"
                ),
                "shipping_info" to mapOf(
                    "shipped_at" to java.time.Instant.now().toString(),
                    "shipping_company" to "N/A"
                )
            )

            val headers = createHeaders()
            val response = sendRequest("/payments/capture", requestBody, headers)

            val captureId = response["capture_id"] as? String
            if (captureId != null) {
                invoice.tamaraStatus = "CAPTURED"
                if (invoice.canBePaid()) {
                    invoice.recordPayment(
                        amount = invoice.totalAmount,
                        method = PaymentMethod.TAMARA,
                        reference = orderId
                    )
                }
                invoiceRepository.save(invoice)

                logger.info("Tamara order captured: $orderId, captureId: $captureId")

                return TamaraCaptureResult(
                    success = true,
                    orderId = orderId,
                    captureId = captureId
                )
            } else {
                val errorMessage = response["message"] as? String ?: "Capture failed"
                return TamaraCaptureResult(
                    success = false,
                    error = errorMessage
                )
            }
        } catch (e: Exception) {
            logger.error("Tamara capture error for order $orderId: ${e.message}", e)
            return TamaraCaptureResult(
                success = false,
                error = e.message ?: "Capture failed"
            )
        }
    }

    // Create API headers
    private fun createHeaders(): HttpHeaders {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        headers.set("Authorization", "Bearer ${config.apiToken}")
        return headers
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
data class TamaraCheckoutResult(
    val success: Boolean,
    val checkoutId: String? = null,
    val checkoutUrl: String? = null,
    val instalments: Int? = null,
    val instalmentsAmount: BigDecimal? = null,
    val error: String? = null
)

data class TamaraPaymentOptions(
    val available: Boolean,
    val minAmount: BigDecimal? = null,
    val maxAmount: BigDecimal? = null,
    val payIn3: TamaraInstalment? = null,
    val payIn4: TamaraInstalment? = null,
    val payIn30Available: Boolean = false,
    val error: String? = null
)

data class TamaraInstalment(
    val instalments: Int,
    val instalmentsAmount: BigDecimal
)

data class TamaraOrderStatus(
    val orderId: String,
    val status: String,
    val totalAmount: BigDecimal? = null,
    val paymentType: String? = null,
    val instalments: Int? = null,
    val error: String? = null
)

data class TamaraAuthorizeResult(
    val success: Boolean,
    val orderId: String? = null,
    val status: String? = null,
    val error: String? = null
)

data class TamaraCaptureResult(
    val success: Boolean,
    val orderId: String? = null,
    val captureId: String? = null,
    val error: String? = null
)
