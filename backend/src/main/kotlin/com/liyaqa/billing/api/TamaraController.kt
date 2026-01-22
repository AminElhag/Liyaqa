package com.liyaqa.billing.api

import com.liyaqa.billing.infrastructure.payment.*
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.util.UUID

/**
 * REST controller for Tamara BNPL (Buy Now Pay Later) operations.
 *
 * Tamara allows customers to split payments into interest-free installments.
 * Popular for annual gym memberships and premium packages.
 */
@RestController
@RequestMapping("/api/payments/tamara")
@Tag(name = "Tamara", description = "Tamara Buy Now Pay Later operations")
class TamaraController(
    private val tamaraService: TamaraService
) {

    /**
     * Creates a Tamara checkout session for an invoice.
     * Returns checkout URL where customer completes the BNPL purchase.
     */
    @PostMapping("/checkout/{invoiceId}")
    @Operation(summary = "Create Tamara checkout", description = "Creates checkout session for BNPL payment")
    fun createCheckout(
        @PathVariable invoiceId: UUID,
        @Valid @RequestBody request: TamaraCheckoutRequest?
    ): ResponseEntity<TamaraCheckoutResponse> {
        val instalments = request?.instalments ?: 3
        val result = tamaraService.createCheckout(invoiceId, instalments)
        return ResponseEntity.ok(TamaraCheckoutResponse.from(result))
    }

    /**
     * Gets available Tamara payment options for an amount.
     */
    @GetMapping("/options")
    @Operation(summary = "Get payment options", description = "Returns available Tamara payment options for an amount")
    fun getPaymentOptions(
        @RequestParam amount: BigDecimal
    ): ResponseEntity<TamaraOptionsResponse> {
        val result = tamaraService.getPaymentOptions(amount)
        return ResponseEntity.ok(TamaraOptionsResponse.from(result))
    }

    /**
     * Gets the status of a Tamara order.
     */
    @GetMapping("/status/{orderId}")
    @Operation(summary = "Get order status", description = "Checks the status of a Tamara order")
    fun getOrderStatus(
        @PathVariable orderId: String
    ): ResponseEntity<TamaraOrderStatusResponse> {
        val result = tamaraService.getOrderStatus(orderId)
        return ResponseEntity.ok(TamaraOrderStatusResponse.from(result))
    }

    /**
     * Authorizes a Tamara order after customer completes checkout.
     */
    @PostMapping("/authorize/{orderId}")
    @Operation(summary = "Authorize order", description = "Authorizes a Tamara order for processing")
    fun authorizeOrder(
        @PathVariable orderId: String
    ): ResponseEntity<TamaraAuthorizeResponse> {
        val result = tamaraService.authorizeOrder(orderId)
        return ResponseEntity.ok(TamaraAuthorizeResponse.from(result))
    }

    /**
     * Captures a Tamara order (triggers the actual charge).
     */
    @PostMapping("/capture/{orderId}")
    @Operation(summary = "Capture order", description = "Captures payment for a Tamara order")
    fun captureOrder(
        @PathVariable orderId: String
    ): ResponseEntity<TamaraCaptureResponse> {
        val result = tamaraService.captureOrder(orderId)
        return ResponseEntity.ok(TamaraCaptureResponse.from(result))
    }

    /**
     * Webhook callback for Tamara notifications.
     */
    @PostMapping("/callback")
    @Operation(summary = "Tamara webhook callback", description = "Receives notifications from Tamara")
    fun handleCallback(
        @RequestBody payload: Map<String, Any>
    ): ResponseEntity<CallbackResponse> {
        val success = tamaraService.handleCallback(payload)
        return ResponseEntity.ok(CallbackResponse(success = success))
    }
}

// Request DTOs
data class TamaraCheckoutRequest(
    @field:Min(value = 2, message = "Minimum 2 instalments")
    @field:Max(value = 4, message = "Maximum 4 instalments")
    val instalments: Int = 3
)

// Response DTOs
data class TamaraCheckoutResponse(
    val success: Boolean,
    val checkoutId: String?,
    val checkoutUrl: String?,
    val instalments: Int?,
    val instalmentsAmount: BigDecimal?,
    val error: String?,
    val messageEn: String,
    val messageAr: String
) {
    companion object {
        fun from(result: TamaraCheckoutResult): TamaraCheckoutResponse {
            return TamaraCheckoutResponse(
                success = result.success,
                checkoutId = result.checkoutId,
                checkoutUrl = result.checkoutUrl,
                instalments = result.instalments,
                instalmentsAmount = result.instalmentsAmount,
                error = result.error,
                messageEn = if (result.success) {
                    "Checkout created. Pay in ${result.instalments} installments of ${result.instalmentsAmount} SAR"
                } else {
                    result.error ?: "Checkout creation failed"
                },
                messageAr = if (result.success) {
                    "تم إنشاء الدفع. ادفع على ${result.instalments} أقساط بقيمة ${result.instalmentsAmount} ريال"
                } else {
                    result.error ?: "فشل في إنشاء الدفع"
                }
            )
        }
    }
}

data class TamaraOptionsResponse(
    val available: Boolean,
    val minAmount: BigDecimal?,
    val maxAmount: BigDecimal?,
    val payIn3: TamaraInstalmentOption?,
    val payIn4: TamaraInstalmentOption?,
    val payIn30Available: Boolean,
    val error: String?,
    val messageEn: String,
    val messageAr: String
) {
    companion object {
        fun from(result: TamaraPaymentOptions): TamaraOptionsResponse {
            return TamaraOptionsResponse(
                available = result.available,
                minAmount = result.minAmount,
                maxAmount = result.maxAmount,
                payIn3 = result.payIn3?.let { TamaraInstalmentOption(it.instalments, it.instalmentsAmount) },
                payIn4 = result.payIn4?.let { TamaraInstalmentOption(it.instalments, it.instalmentsAmount) },
                payIn30Available = result.payIn30Available,
                error = result.error,
                messageEn = if (result.available) {
                    "Split into interest-free installments"
                } else {
                    result.error ?: "Tamara not available for this amount"
                },
                messageAr = if (result.available) {
                    "قسّط المبلغ بدون فوائد"
                } else {
                    result.error ?: "تمارا غير متاح لهذا المبلغ"
                }
            )
        }
    }
}

data class TamaraInstalmentOption(
    val instalments: Int,
    val instalmentsAmount: BigDecimal,
    val labelEn: String = "Pay in $instalments",
    val labelAr: String = "ادفع على $instalments"
)

data class TamaraOrderStatusResponse(
    val orderId: String,
    val status: String,
    val statusEn: String,
    val statusAr: String,
    val totalAmount: BigDecimal?,
    val paymentType: String?,
    val instalments: Int?,
    val error: String?
) {
    companion object {
        fun from(result: TamaraOrderStatus): TamaraOrderStatusResponse {
            val (statusEn, statusAr) = when (result.status.uppercase()) {
                "APPROVED" -> "Approved" to "موافق عليه"
                "AUTHORISED" -> "Authorized" to "مفوض"
                "CAPTURED" -> "Payment Captured" to "تم الدفع"
                "DECLINED" -> "Declined" to "مرفوض"
                "EXPIRED" -> "Expired" to "منتهي"
                "CANCELLED" -> "Cancelled" to "ملغي"
                "NEW" -> "Pending" to "قيد الانتظار"
                "ERROR" -> "Error" to "خطأ"
                else -> result.status to result.status
            }

            return TamaraOrderStatusResponse(
                orderId = result.orderId,
                status = result.status,
                statusEn = statusEn,
                statusAr = statusAr,
                totalAmount = result.totalAmount,
                paymentType = result.paymentType,
                instalments = result.instalments,
                error = result.error
            )
        }
    }
}

data class TamaraAuthorizeResponse(
    val success: Boolean,
    val orderId: String?,
    val status: String?,
    val error: String?,
    val messageEn: String,
    val messageAr: String
) {
    companion object {
        fun from(result: TamaraAuthorizeResult): TamaraAuthorizeResponse {
            return TamaraAuthorizeResponse(
                success = result.success,
                orderId = result.orderId,
                status = result.status,
                error = result.error,
                messageEn = if (result.success) "Order authorized" else (result.error ?: "Authorization failed"),
                messageAr = if (result.success) "تم تفويض الطلب" else (result.error ?: "فشل في التفويض")
            )
        }
    }
}

data class TamaraCaptureResponse(
    val success: Boolean,
    val orderId: String?,
    val captureId: String?,
    val error: String?,
    val messageEn: String,
    val messageAr: String
) {
    companion object {
        fun from(result: TamaraCaptureResult): TamaraCaptureResponse {
            return TamaraCaptureResponse(
                success = result.success,
                orderId = result.orderId,
                captureId = result.captureId,
                error = result.error,
                messageEn = if (result.success) "Payment captured successfully" else (result.error ?: "Capture failed"),
                messageAr = if (result.success) "تم تحصيل الدفع بنجاح" else (result.error ?: "فشل في التحصيل")
            )
        }
    }
}
