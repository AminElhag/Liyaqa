package com.liyaqa.billing.api

import com.liyaqa.billing.infrastructure.payment.PayTabsCallbackData
import com.liyaqa.billing.infrastructure.payment.PayTabsPaymentService
import com.liyaqa.billing.infrastructure.payment.PaymentCallbackResult
import com.liyaqa.billing.infrastructure.payment.PaymentInitiationResult
import com.liyaqa.billing.infrastructure.payment.PaymentVerificationResult
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * REST controller for payment operations.
 *
 * Endpoints:
 * - POST /api/payments/initiate/{invoiceId} - Initiate payment for an invoice
 * - POST /api/payments/callback - Handle PayTabs payment callback (webhook)
 * - GET /api/payments/verify/{transactionRef} - Verify payment status
 */
@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Payment operations via PayTabs")
class PaymentController(
    private val paymentService: PayTabsPaymentService
) {
    private val logger = LoggerFactory.getLogger(PaymentController::class.java)

    /**
     * Initiates a payment for an invoice.
     * Returns a redirect URL to the PayTabs payment page.
     */
    @PostMapping("/initiate/{invoiceId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Initiate payment", description = "Creates a PayTabs payment session for an invoice")
    fun initiatePayment(
        @PathVariable invoiceId: UUID
    ): ResponseEntity<PaymentInitiationResponse> {
        val result = paymentService.initiatePayment(invoiceId)

        return if (result.success) {
            ResponseEntity.ok(PaymentInitiationResponse.from(result))
        } else {
            ResponseEntity.badRequest().body(PaymentInitiationResponse.from(result))
        }
    }

    /**
     * Handles payment callback from PayTabs.
     * This is called by PayTabs when a payment is processed.
     * Note: This endpoint should be publicly accessible (no auth required).
     */
    @PostMapping("/callback")
    @Operation(summary = "Payment callback", description = "Webhook endpoint for PayTabs payment notifications")
    fun handleCallback(
        @RequestBody callback: PayTabsCallbackData,
        @RequestHeader("signature", required = false) signature: String?
    ): ResponseEntity<PaymentCallbackResponse> {
        logger.info("Received payment callback for transaction: ${callback.tranRef}")

        val result = paymentService.processCallback(callback, signature)

        return if (result.success) {
            ResponseEntity.ok(PaymentCallbackResponse.from(result))
        } else {
            // Return 200 OK even for failed payments to acknowledge receipt
            // PayTabs expects a 200 response to stop retrying
            ResponseEntity.ok(PaymentCallbackResponse.from(result))
        }
    }

    /**
     * Verifies the status of a payment transaction.
     */
    @GetMapping("/verify/{transactionRef}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Verify payment", description = "Checks the status of a payment transaction")
    fun verifyPayment(
        @PathVariable transactionRef: String
    ): ResponseEntity<PaymentVerificationResponse> {
        val result = paymentService.verifyPayment(transactionRef)

        return if (result.success) {
            ResponseEntity.ok(PaymentVerificationResponse.from(result))
        } else {
            ResponseEntity.badRequest().body(PaymentVerificationResponse.from(result))
        }
    }

    /**
     * Returns after payment completion (redirect from PayTabs).
     * This endpoint handles the user return after payment.
     */
    @GetMapping("/return")
    @Operation(summary = "Payment return", description = "Handles user return after payment")
    fun handleReturn(
        @RequestParam("tranRef", required = false) transactionRef: String?,
        @RequestParam("respStatus", required = false) status: String?,
        @RequestParam("respMessage", required = false) message: String?
    ): ResponseEntity<PaymentReturnResponse> {
        logger.info("Payment return: tranRef=$transactionRef, status=$status")

        return when (status) {
            "A" -> ResponseEntity.ok(PaymentReturnResponse(
                success = true,
                status = "APPROVED",
                message = "Payment completed successfully",
                transactionRef = transactionRef
            ))
            "D" -> ResponseEntity.ok(PaymentReturnResponse(
                success = false,
                status = "DECLINED",
                message = message ?: "Payment was declined",
                transactionRef = transactionRef
            ))
            "C" -> ResponseEntity.ok(PaymentReturnResponse(
                success = false,
                status = "CANCELLED",
                message = "Payment was cancelled",
                transactionRef = transactionRef
            ))
            else -> ResponseEntity.ok(PaymentReturnResponse(
                success = false,
                status = status ?: "UNKNOWN",
                message = message ?: "Unknown payment status",
                transactionRef = transactionRef
            ))
        }
    }
}

// Response DTOs

data class PaymentInitiationResponse(
    val success: Boolean,
    val redirectUrl: String? = null,
    val transactionRef: String? = null,
    val error: String? = null
) {
    companion object {
        fun from(result: PaymentInitiationResult) = PaymentInitiationResponse(
            success = result.success,
            redirectUrl = result.redirectUrl,
            transactionRef = result.transactionRef,
            error = result.error
        )
    }
}

data class PaymentCallbackResponse(
    val success: Boolean,
    val invoiceId: UUID? = null,
    val status: String? = null,
    val message: String? = null,
    val error: String? = null
) {
    companion object {
        fun from(result: PaymentCallbackResult) = PaymentCallbackResponse(
            success = result.success,
            invoiceId = result.invoiceId,
            status = result.status,
            message = result.message,
            error = result.error
        )
    }
}

data class PaymentVerificationResponse(
    val success: Boolean,
    val transactionRef: String? = null,
    val status: String? = null,
    val amount: String? = null,
    val currency: String? = null,
    val error: String? = null
) {
    companion object {
        fun from(result: PaymentVerificationResult) = PaymentVerificationResponse(
            success = result.success,
            transactionRef = result.transactionRef,
            status = result.status,
            amount = result.amount,
            currency = result.currency,
            error = result.error
        )
    }
}

data class PaymentReturnResponse(
    val success: Boolean,
    val status: String,
    val message: String,
    val transactionRef: String? = null
)
