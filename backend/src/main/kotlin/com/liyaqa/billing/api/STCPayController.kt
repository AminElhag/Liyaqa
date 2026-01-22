package com.liyaqa.billing.api

import com.liyaqa.billing.infrastructure.payment.STCPayConfirmationResult
import com.liyaqa.billing.infrastructure.payment.STCPayInitiationResult
import com.liyaqa.billing.infrastructure.payment.STCPayService
import com.liyaqa.billing.infrastructure.payment.STCPayTransactionStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for STC Pay mobile wallet payments.
 *
 * STC Pay is Saudi Arabia's leading mobile wallet with 8+ million users.
 * It enables QR payments, in-app payments, and P2P transfers.
 */
@RestController
@RequestMapping("/api/payments/stcpay")
@Tag(name = "STC Pay", description = "STC Pay mobile wallet payment operations")
class STCPayController(
    private val stcPayService: STCPayService
) {

    /**
     * Initiates an STC Pay payment for an invoice.
     * Customer receives OTP on their STC Pay app to authorize.
     */
    @PostMapping("/initiate/{invoiceId}")
    @Operation(summary = "Initiate STC Pay payment", description = "Initiates payment and sends OTP to customer's STC Pay app")
    fun initiatePayment(
        @PathVariable invoiceId: UUID,
        @Valid @RequestBody request: STCPayInitiateRequest
    ): ResponseEntity<STCPayInitiationResponse> {
        val result = stcPayService.initiatePayment(invoiceId, request.mobileNumber)
        return ResponseEntity.ok(STCPayInitiationResponse.from(result))
    }

    /**
     * Confirms an STC Pay payment with OTP.
     * Completes the payment after customer enters OTP.
     */
    @PostMapping("/confirm/{invoiceId}")
    @Operation(summary = "Confirm STC Pay payment", description = "Confirms payment with OTP entered by customer")
    fun confirmPayment(
        @PathVariable invoiceId: UUID,
        @Valid @RequestBody request: STCPayConfirmRequest
    ): ResponseEntity<STCPayConfirmationResponse> {
        val result = stcPayService.confirmPayment(invoiceId, request.otp)
        return ResponseEntity.ok(STCPayConfirmationResponse.from(result))
    }

    /**
     * Verifies transaction status with STC Pay.
     */
    @GetMapping("/verify/{transactionId}")
    @Operation(summary = "Verify transaction status", description = "Checks the status of an STC Pay transaction")
    fun verifyTransaction(
        @PathVariable transactionId: String
    ): ResponseEntity<STCPayStatusResponse> {
        val result = stcPayService.verifyTransaction(transactionId)
        return ResponseEntity.ok(STCPayStatusResponse.from(result))
    }

    /**
     * Webhook callback for STC Pay notifications.
     */
    @PostMapping("/callback")
    @Operation(summary = "STC Pay webhook callback", description = "Receives payment notifications from STC Pay")
    fun handleCallback(
        @RequestBody payload: Map<String, Any>
    ): ResponseEntity<CallbackResponse> {
        val success = stcPayService.handleCallback(payload)
        return ResponseEntity.ok(CallbackResponse(success = success))
    }
}

// Request DTOs
data class STCPayInitiateRequest(
    @field:NotBlank(message = "Mobile number is required")
    val mobileNumber: String
)

data class STCPayConfirmRequest(
    @field:NotBlank(message = "OTP is required")
    val otp: String
)

// Response DTOs
data class STCPayInitiationResponse(
    val success: Boolean,
    val otpReference: String?,
    val transactionId: String?,
    val expiresIn: Int?,
    val error: String?,
    val messageEn: String,
    val messageAr: String
) {
    companion object {
        fun from(result: STCPayInitiationResult): STCPayInitiationResponse {
            return STCPayInitiationResponse(
                success = result.success,
                otpReference = result.otpReference,
                transactionId = result.transactionId,
                expiresIn = result.expiresIn,
                error = result.error,
                messageEn = if (result.success) "OTP sent to your STC Pay app" else (result.error ?: "Payment initiation failed"),
                messageAr = if (result.success) "تم إرسال رمز التحقق إلى تطبيق STC Pay" else (result.error ?: "فشل في بدء الدفع")
            )
        }
    }
}

data class STCPayConfirmationResponse(
    val success: Boolean,
    val paymentReference: String?,
    val transactionId: String?,
    val error: String?,
    val messageEn: String,
    val messageAr: String
) {
    companion object {
        fun from(result: STCPayConfirmationResult): STCPayConfirmationResponse {
            return STCPayConfirmationResponse(
                success = result.success,
                paymentReference = result.paymentReference,
                transactionId = result.transactionId,
                error = result.error,
                messageEn = if (result.success) "Payment completed successfully" else (result.error ?: "Payment confirmation failed"),
                messageAr = if (result.success) "تم الدفع بنجاح" else (result.error ?: "فشل في تأكيد الدفع")
            )
        }
    }
}

data class STCPayStatusResponse(
    val transactionId: String,
    val status: String,
    val paymentReference: String?,
    val amount: java.math.BigDecimal?,
    val error: String?
) {
    companion object {
        fun from(result: STCPayTransactionStatus): STCPayStatusResponse {
            return STCPayStatusResponse(
                transactionId = result.transactionId,
                status = result.status,
                paymentReference = result.paymentReference,
                amount = result.amount,
                error = result.error
            )
        }
    }
}

data class CallbackResponse(
    val success: Boolean
)
