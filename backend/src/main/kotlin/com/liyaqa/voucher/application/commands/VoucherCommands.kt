package com.liyaqa.voucher.application.commands

import com.liyaqa.voucher.domain.model.DiscountType
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Command to create a new voucher.
 */
data class CreateVoucherCommand(
    val code: String,
    val nameEn: String,
    val nameAr: String? = null,
    val discountType: DiscountType,
    val discountAmount: BigDecimal? = null,
    val discountCurrency: String = "SAR",
    val discountPercent: BigDecimal? = null,
    val freeTrialDays: Int? = null,
    val giftCardBalance: BigDecimal? = null,
    val maxUses: Int? = null,
    val maxUsesPerMember: Int = 1,
    val validFrom: Instant? = null,
    val validUntil: Instant? = null,
    val firstTimeMemberOnly: Boolean = false,
    val minimumPurchase: BigDecimal? = null,
    val applicablePlanIds: List<UUID> = emptyList(),
    val applicableProductIds: List<UUID> = emptyList()
)

/**
 * Command to update an existing voucher.
 */
data class UpdateVoucherCommand(
    val id: UUID,
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
)

/**
 * Command to validate a voucher for use.
 */
data class ValidateVoucherCommand(
    val code: String,
    val memberId: UUID,
    val purchaseAmount: BigDecimal,
    val planId: UUID? = null,
    val productIds: List<UUID> = emptyList(),
    val isFirstTimeMember: Boolean = false
)

/**
 * Command to redeem a voucher.
 */
data class RedeemVoucherCommand(
    val code: String,
    val memberId: UUID,
    val purchaseAmount: BigDecimal,
    val usedForType: String,
    val usedForId: UUID? = null,
    val invoiceId: UUID? = null
)

/**
 * Command to redeem a gift card to wallet.
 */
data class RedeemGiftCardCommand(
    val code: String,
    val memberId: UUID,
    val amount: BigDecimal? = null // If null, redeem full balance
)
