package com.liyaqa.voucher.api

import com.liyaqa.voucher.application.commands.CreateVoucherCommand
import com.liyaqa.voucher.application.commands.UpdateVoucherCommand
import com.liyaqa.voucher.application.services.VoucherRedemptionResult
import com.liyaqa.voucher.application.services.VoucherValidationResult
import com.liyaqa.voucher.domain.model.DiscountType
import com.liyaqa.voucher.domain.model.UsageType
import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.model.VoucherUsage
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ============ Request DTOs ============

data class CreateVoucherRequest(
    @field:NotBlank(message = "Code is required")
    @field:Size(min = 3, max = 50, message = "Code must be 3-50 characters")
    val code: String,

    @field:NotBlank(message = "Name is required")
    @field:Size(max = 255, message = "Name must not exceed 255 characters")
    val nameEn: String,

    @field:Size(max = 255, message = "Arabic name must not exceed 255 characters")
    val nameAr: String? = null,

    @field:NotNull(message = "Discount type is required")
    val discountType: DiscountType,

    @field:DecimalMin(value = "0.01", message = "Discount amount must be positive")
    val discountAmount: BigDecimal? = null,

    @field:Size(min = 3, max = 3, message = "Currency must be 3 characters")
    val discountCurrency: String = "SAR",

    @field:DecimalMin(value = "0.01", message = "Discount percent must be positive")
    val discountPercent: BigDecimal? = null,

    @field:Min(value = 1, message = "Free trial days must be at least 1")
    val freeTrialDays: Int? = null,

    @field:DecimalMin(value = "0.01", message = "Gift card balance must be positive")
    val giftCardBalance: BigDecimal? = null,

    @field:Min(value = 1, message = "Max uses must be at least 1")
    val maxUses: Int? = null,

    @field:Min(value = 1, message = "Max uses per member must be at least 1")
    val maxUsesPerMember: Int = 1,

    val validFrom: Instant? = null,
    val validUntil: Instant? = null,
    val firstTimeMemberOnly: Boolean = false,

    @field:DecimalMin(value = "0.01", message = "Minimum purchase must be positive")
    val minimumPurchase: BigDecimal? = null,

    val applicablePlanIds: List<UUID> = emptyList(),
    val applicableProductIds: List<UUID> = emptyList()
) {
    fun toCommand() = CreateVoucherCommand(
        code = code,
        nameEn = nameEn,
        nameAr = nameAr,
        discountType = discountType,
        discountAmount = discountAmount,
        discountCurrency = discountCurrency,
        discountPercent = discountPercent,
        freeTrialDays = freeTrialDays,
        giftCardBalance = giftCardBalance,
        maxUses = maxUses,
        maxUsesPerMember = maxUsesPerMember,
        validFrom = validFrom,
        validUntil = validUntil,
        firstTimeMemberOnly = firstTimeMemberOnly,
        minimumPurchase = minimumPurchase,
        applicablePlanIds = applicablePlanIds,
        applicableProductIds = applicableProductIds
    )
}

data class UpdateVoucherRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val discountAmount: BigDecimal? = null,
    val discountCurrency: String? = null,
    val discountPercent: BigDecimal? = null,
    val freeTrialDays: Int? = null,
    val maxUses: Int? = null,
    val maxUsesPerMember: Int? = null,
    val validFrom: Instant? = null,
    val validUntil: Instant? = null,
    val firstTimeMemberOnly: Boolean? = null,
    val minimumPurchase: BigDecimal? = null,
    val applicablePlanIds: List<UUID>? = null,
    val applicableProductIds: List<UUID>? = null,
    val isActive: Boolean? = null
) {
    fun toCommand(id: UUID) = UpdateVoucherCommand(
        id = id,
        nameEn = nameEn,
        nameAr = nameAr,
        discountAmount = discountAmount,
        discountCurrency = discountCurrency,
        discountPercent = discountPercent,
        freeTrialDays = freeTrialDays,
        maxUses = maxUses,
        maxUsesPerMember = maxUsesPerMember,
        validFrom = validFrom,
        validUntil = validUntil,
        firstTimeMemberOnly = firstTimeMemberOnly,
        minimumPurchase = minimumPurchase,
        applicablePlanIds = applicablePlanIds,
        applicableProductIds = applicableProductIds,
        isActive = isActive
    )
}

data class ValidateVoucherRequest(
    @field:NotBlank(message = "Code is required")
    val code: String,

    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    @field:NotNull(message = "Purchase amount is required")
    val purchaseAmount: BigDecimal,

    val planId: UUID? = null,
    val productIds: List<UUID> = emptyList(),
    val isFirstTimeMember: Boolean = false
)

data class RedeemVoucherRequest(
    @field:NotBlank(message = "Code is required")
    val code: String,

    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    @field:NotNull(message = "Purchase amount is required")
    val purchaseAmount: BigDecimal,

    @field:NotBlank(message = "Usage type is required")
    val usedForType: String,

    val usedForId: UUID? = null,
    val invoiceId: UUID? = null
)

data class RedeemGiftCardRequest(
    @field:NotBlank(message = "Code is required")
    val code: String,

    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    val amount: BigDecimal? = null
)

// ============ Response DTOs ============

data class VoucherResponse(
    val id: UUID,
    val code: String,
    val nameEn: String,
    val nameAr: String?,
    val discountType: DiscountType,
    val discountAmount: BigDecimal?,
    val discountCurrency: String,
    val discountPercent: BigDecimal?,
    val freeTrialDays: Int?,
    val giftCardBalance: BigDecimal?,
    val maxUses: Int?,
    val maxUsesPerMember: Int,
    val currentUseCount: Int,
    val validFrom: Instant?,
    val validUntil: Instant?,
    val firstTimeMemberOnly: Boolean,
    val minimumPurchase: BigDecimal?,
    val applicablePlanIds: List<UUID>,
    val applicableProductIds: List<UUID>,
    val isActive: Boolean,
    val isValidForUse: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(voucher: Voucher) = VoucherResponse(
            id = voucher.id,
            code = voucher.code,
            nameEn = voucher.nameEn,
            nameAr = voucher.nameAr,
            discountType = voucher.discountType,
            discountAmount = voucher.discountAmount,
            discountCurrency = voucher.discountCurrency,
            discountPercent = voucher.discountPercent,
            freeTrialDays = voucher.freeTrialDays,
            giftCardBalance = voucher.giftCardBalance,
            maxUses = voucher.maxUses,
            maxUsesPerMember = voucher.maxUsesPerMember,
            currentUseCount = voucher.currentUseCount,
            validFrom = voucher.validFrom,
            validUntil = voucher.validUntil,
            firstTimeMemberOnly = voucher.firstTimeMemberOnly,
            minimumPurchase = voucher.minimumPurchase,
            applicablePlanIds = voucher.applicablePlanIds,
            applicableProductIds = voucher.applicableProductIds,
            isActive = voucher.isActive,
            isValidForUse = voucher.isValidForUse(),
            createdAt = voucher.createdAt,
            updatedAt = voucher.updatedAt
        )
    }
}

data class VoucherUsageResponse(
    val id: UUID,
    val voucherId: UUID,
    val memberId: UUID,
    val usedForType: UsageType,
    val usedForId: UUID?,
    val discountApplied: BigDecimal?,
    val discountCurrency: String,
    val invoiceId: UUID?,
    val usedAt: Instant,
    val createdAt: Instant
) {
    companion object {
        fun from(usage: VoucherUsage) = VoucherUsageResponse(
            id = usage.id,
            voucherId = usage.voucherId,
            memberId = usage.memberId,
            usedForType = usage.usedForType,
            usedForId = usage.usedForId,
            discountApplied = usage.discountApplied,
            discountCurrency = usage.discountCurrency,
            invoiceId = usage.invoiceId,
            usedAt = usage.usedAt,
            createdAt = usage.createdAt
        )
    }
}

data class VoucherValidationResponse(
    val valid: Boolean,
    val discountAmount: BigDecimal,
    val freeTrialDays: Int,
    val errorCode: String?,
    val errorMessage: String?,
    val voucher: VoucherResponse?
) {
    companion object {
        fun from(result: VoucherValidationResult) = VoucherValidationResponse(
            valid = result.valid,
            discountAmount = result.discountAmount,
            freeTrialDays = result.freeTrialDays,
            errorCode = result.errorCode,
            errorMessage = result.errorMessage,
            voucher = result.voucher?.let { VoucherResponse.from(it) }
        )
    }
}

data class VoucherRedemptionResponse(
    val success: Boolean,
    val discountApplied: BigDecimal,
    val freeTrialDays: Int,
    val errorCode: String?,
    val errorMessage: String?,
    val voucher: VoucherResponse?,
    val usage: VoucherUsageResponse?
) {
    companion object {
        fun from(result: VoucherRedemptionResult) = VoucherRedemptionResponse(
            success = result.success,
            discountApplied = result.discountApplied,
            freeTrialDays = result.freeTrialDays,
            errorCode = result.errorCode,
            errorMessage = result.errorMessage,
            voucher = result.voucher?.let { VoucherResponse.from(it) },
            usage = result.usage?.let { VoucherUsageResponse.from(it) }
        )
    }
}
