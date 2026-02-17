package com.liyaqa.membership.api.dto

import com.liyaqa.membership.api.MoneyResponse
import com.liyaqa.organization.api.LocalizedTextResponse
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

// === Request DTOs ===

data class EnrollmentRequest(
    // Member — either existing or new
    val existingMemberId: UUID? = null,
    val newMember: NewMemberInput? = null,

    // Plan & subscription
    @field:NotNull(message = "Plan ID is required")
    val planId: UUID,
    val startDate: LocalDate? = null,
    val autoRenew: Boolean = false,

    // Contract
    val contractType: String = "MONTH_TO_MONTH",
    val contractTerm: String = "MONTHLY",
    val categoryId: UUID? = null,

    // Payment
    val paymentMethod: String? = null,
    @field:Positive(message = "Amount must be positive")
    val paidAmount: BigDecimal? = null,
    val paidCurrency: String = "SAR",
    val voucherCode: String? = null,
    val discountType: String? = null,
    @field:Positive(message = "Discount value must be positive")
    val discountValue: BigDecimal? = null,
    val discountReason: String? = null,

    // Notes & attribution
    val staffNotes: String? = null,
    val referredByMemberId: UUID? = null
) {
    init {
        require(existingMemberId != null || newMember != null) {
            "Either existingMemberId or newMember must be provided"
        }
    }
}

data class NewMemberInput(
    val firstNameEn: String,
    val firstNameAr: String? = null,
    val lastNameEn: String,
    val lastNameAr: String? = null,
    @field:Email(message = "Invalid email format")
    val email: String,
    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val gender: String? = null,
    val nationalId: String? = null
)

data class EnrollmentPreviewRequest(
    @field:NotNull(message = "Plan ID is required")
    val planId: UUID,
    val contractTerm: String = "MONTHLY",
    val voucherCode: String? = null,
    val discountType: String? = null,
    @field:Positive(message = "Discount value must be positive")
    val discountValue: BigDecimal? = null,
    val existingMemberId: UUID? = null
)

// === Response DTOs ===

data class EnrollmentPreviewResponse(
    val planId: UUID,
    val planName: LocalizedTextResponse,
    val billingPeriod: String,
    val durationDays: Int,

    // Fee breakdown
    val membershipFee: FeeLineResponse,
    val administrationFee: FeeLineResponse,
    val joinFee: FeeLineResponse,

    // Totals
    val subtotal: MoneyResponse,
    val vatTotal: MoneyResponse,
    val discountAmount: MoneyResponse?,
    val grandTotal: MoneyResponse,

    // Contract info
    val contractTerm: String,
    val commitmentMonths: Int,
    val coolingOffDays: Int,
    val noticePeriodDays: Int,

    val isFirstSubscription: Boolean
)

data class FeeLineResponse(
    val label: LocalizedTextResponse,
    val netAmount: MoneyResponse,
    val taxRate: BigDecimal,
    val taxAmount: MoneyResponse,
    val grossAmount: MoneyResponse,
    val applicable: Boolean
)

data class EnrollmentResponse(
    val memberId: UUID,
    val subscriptionId: UUID,
    val contractId: UUID?,
    val invoiceId: UUID?,
    val status: String,
    val memberName: LocalizedTextResponse,
    val planName: LocalizedTextResponse,
    val totalAmount: MoneyResponse,
    val paidAmount: MoneyResponse?,
    val startDate: LocalDate,
    val endDate: LocalDate
)
