package com.liyaqa.billing.api

import com.liyaqa.billing.infrastructure.payment.SadadBillResult
import com.liyaqa.billing.infrastructure.payment.SadadBillStatus
import com.liyaqa.billing.infrastructure.payment.SadadCancelResult
import com.liyaqa.billing.infrastructure.payment.SadadService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * REST controller for SADAD bill payment operations.
 *
 * SADAD is Saudi Arabia's official bill payment system regulated by SAMA.
 * Customers can pay SADAD bills through any Saudi bank's online/mobile banking.
 */
@RestController
@RequestMapping("/api/payments/sadad")
@Tag(name = "SADAD", description = "SADAD bill payment operations")
class SadadController(
    private val sadadService: SadadService
) {

    /**
     * Generates a SADAD bill for an invoice.
     * Returns bill number that customer can use to pay via any Saudi bank.
     */
    @PostMapping("/generate-bill/{invoiceId}")
    @Operation(summary = "Generate SADAD bill", description = "Creates a SADAD bill for the invoice")
    fun generateBill(
        @PathVariable invoiceId: UUID
    ): ResponseEntity<SadadBillResponse> {
        val result = sadadService.generateBill(invoiceId)
        return ResponseEntity.ok(SadadBillResponse.from(result))
    }

    /**
     * Checks the status of a SADAD bill.
     */
    @GetMapping("/bill-status/{billNumber}")
    @Operation(summary = "Check bill status", description = "Checks the payment status of a SADAD bill")
    fun checkBillStatus(
        @PathVariable billNumber: String
    ): ResponseEntity<SadadStatusResponse> {
        val result = sadadService.checkBillStatus(billNumber)
        return ResponseEntity.ok(SadadStatusResponse.from(result))
    }

    /**
     * Cancels a SADAD bill.
     */
    @PostMapping("/cancel-bill/{invoiceId}")
    @Operation(summary = "Cancel SADAD bill", description = "Cancels an unpaid SADAD bill")
    fun cancelBill(
        @PathVariable invoiceId: UUID
    ): ResponseEntity<SadadCancelResponse> {
        val result = sadadService.cancelBill(invoiceId)
        return ResponseEntity.ok(SadadCancelResponse.from(result))
    }

    /**
     * Webhook callback for SADAD payment notifications.
     */
    @PostMapping("/callback")
    @Operation(summary = "SADAD webhook callback", description = "Receives payment notifications from SADAD")
    fun handleCallback(
        @RequestBody payload: Map<String, Any>
    ): ResponseEntity<CallbackResponse> {
        val success = sadadService.handleCallback(payload)
        return ResponseEntity.ok(CallbackResponse(success = success))
    }
}

// Response DTOs
data class SadadBillResponse(
    val success: Boolean,
    val billNumber: String?,
    val billAccount: String?,
    val billerCode: String?,
    val amount: BigDecimal?,
    val dueDate: LocalDate?,
    val alreadyGenerated: Boolean,
    val error: String?,
    val messageEn: String,
    val messageAr: String,
    val instructionsEn: String?,
    val instructionsAr: String?
) {
    companion object {
        fun from(result: SadadBillResult): SadadBillResponse {
            val instructionsEn = if (result.success) {
                """
                To pay this bill:
                1. Log into your bank's online/mobile banking
                2. Go to SADAD Bill Payment
                3. Search for biller code: ${result.billerCode}
                4. Enter bill number: ${result.billNumber}
                5. Verify amount and complete payment
                """.trimIndent()
            } else null

            val instructionsAr = if (result.success) {
                """
                لدفع هذه الفاتورة:
                ١. سجل الدخول إلى الخدمات المصرفية عبر الإنترنت أو الهاتف
                ٢. اذهب إلى دفع فواتير سداد
                ٣. ابحث عن رمز المفوتر: ${result.billerCode}
                ٤. أدخل رقم الفاتورة: ${result.billNumber}
                ٥. تحقق من المبلغ وأكمل الدفع
                """.trimIndent()
            } else null

            return SadadBillResponse(
                success = result.success,
                billNumber = result.billNumber,
                billAccount = result.billAccount,
                billerCode = result.billerCode,
                amount = result.amount,
                dueDate = result.dueDate,
                alreadyGenerated = result.alreadyGenerated,
                error = result.error,
                messageEn = when {
                    result.success && result.alreadyGenerated -> "Bill already generated"
                    result.success -> "SADAD bill generated successfully"
                    else -> result.error ?: "Bill generation failed"
                },
                messageAr = when {
                    result.success && result.alreadyGenerated -> "الفاتورة مُنشأة مسبقاً"
                    result.success -> "تم إنشاء فاتورة سداد بنجاح"
                    else -> result.error ?: "فشل في إنشاء الفاتورة"
                },
                instructionsEn = instructionsEn,
                instructionsAr = instructionsAr
            )
        }
    }
}

data class SadadStatusResponse(
    val billNumber: String,
    val status: String,
    val statusEn: String,
    val statusAr: String,
    val paidAmount: BigDecimal?,
    val paidAt: String?,
    val paymentReference: String?,
    val error: String?
) {
    companion object {
        fun from(result: SadadBillStatus): SadadStatusResponse {
            val (statusEn, statusAr) = when (result.status) {
                "PAID" -> "Paid" to "مدفوع"
                "PENDING" -> "Pending Payment" to "في انتظار الدفع"
                "EXPIRED" -> "Expired" to "منتهي الصلاحية"
                "CANCELLED" -> "Cancelled" to "ملغي"
                "ERROR" -> "Error" to "خطأ"
                else -> "Unknown" to "غير معروف"
            }

            return SadadStatusResponse(
                billNumber = result.billNumber,
                status = result.status,
                statusEn = statusEn,
                statusAr = statusAr,
                paidAmount = result.paidAmount,
                paidAt = result.paidAt,
                paymentReference = result.paymentReference,
                error = result.error
            )
        }
    }
}

data class SadadCancelResponse(
    val success: Boolean,
    val error: String?,
    val messageEn: String,
    val messageAr: String
) {
    companion object {
        fun from(result: SadadCancelResult): SadadCancelResponse {
            return SadadCancelResponse(
                success = result.success,
                error = result.error,
                messageEn = if (result.success) "SADAD bill cancelled" else (result.error ?: "Cancellation failed"),
                messageAr = if (result.success) "تم إلغاء فاتورة سداد" else (result.error ?: "فشل في الإلغاء")
            )
        }
    }
}
