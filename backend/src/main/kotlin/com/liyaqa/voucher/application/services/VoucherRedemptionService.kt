package com.liyaqa.voucher.application.services

import com.liyaqa.membership.application.services.WalletService
import com.liyaqa.shared.domain.Money
import com.liyaqa.voucher.application.commands.RedeemGiftCardCommand
import com.liyaqa.voucher.application.commands.RedeemVoucherCommand
import com.liyaqa.voucher.application.commands.ValidateVoucherCommand
import com.liyaqa.voucher.domain.model.DiscountType
import com.liyaqa.voucher.domain.model.UsageType
import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.model.VoucherUsage
import com.liyaqa.voucher.domain.ports.VoucherRepository
import com.liyaqa.voucher.domain.ports.VoucherUsageRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

/**
 * Result of voucher redemption.
 */
data class VoucherRedemptionResult(
    val success: Boolean,
    val voucher: Voucher? = null,
    val usage: VoucherUsage? = null,
    val discountApplied: BigDecimal = BigDecimal.ZERO,
    val freeTrialDays: Int = 0,
    val errorCode: String? = null,
    val errorMessage: String? = null
)

/**
 * Service for redeeming vouchers.
 */
@Service
@Transactional
class VoucherRedemptionService(
    private val voucherRepository: VoucherRepository,
    private val usageRepository: VoucherUsageRepository,
    private val validationService: VoucherValidationService,
    private val walletService: WalletService
) {
    private val logger = LoggerFactory.getLogger(VoucherRedemptionService::class.java)

    /**
     * Redeem a voucher for a purchase.
     */
    fun redeemVoucher(command: RedeemVoucherCommand): VoucherRedemptionResult {
        // Validate the voucher
        val validation = validationService.validate(
            ValidateVoucherCommand(
                code = command.code,
                memberId = command.memberId,
                purchaseAmount = command.purchaseAmount,
                isFirstTimeMember = false // This should be passed in from the caller
            )
        )

        if (!validation.valid) {
            return VoucherRedemptionResult(
                success = false,
                errorCode = validation.errorCode,
                errorMessage = validation.errorMessage
            )
        }

        val voucher = validation.voucher!!
        val usageType = parseUsageType(command.usedForType)

        // Record usage
        voucher.recordUse()
        val savedVoucher = voucherRepository.save(voucher)

        val usage = VoucherUsage(
            voucherId = voucher.id,
            memberId = command.memberId,
            usedForType = usageType,
            usedForId = command.usedForId,
            discountApplied = validation.discountAmount,
            discountCurrency = voucher.discountCurrency,
            invoiceId = command.invoiceId
        )
        val savedUsage = usageRepository.save(usage)

        logger.info("Redeemed voucher ${voucher.code} for member ${command.memberId}")

        return VoucherRedemptionResult(
            success = true,
            voucher = savedVoucher,
            usage = savedUsage,
            discountApplied = validation.discountAmount,
            freeTrialDays = validation.freeTrialDays
        )
    }

    /**
     * Redeem a gift card voucher to wallet.
     */
    fun redeemGiftCard(command: RedeemGiftCardCommand): VoucherRedemptionResult {
        val voucher = voucherRepository.findByCode(command.code.uppercase()).orElse(null)
            ?: return VoucherRedemptionResult(
                success = false,
                errorCode = "NOT_FOUND",
                errorMessage = "Voucher not found"
            )

        if (voucher.discountType != DiscountType.GIFT_CARD) {
            return VoucherRedemptionResult(
                success = false,
                errorCode = "NOT_GIFT_CARD",
                errorMessage = "This is not a gift card voucher"
            )
        }

        if (!voucher.isValidForUse()) {
            return VoucherRedemptionResult(
                success = false,
                errorCode = "NOT_VALID",
                errorMessage = "Voucher is not valid for use"
            )
        }

        val balance = voucher.giftCardBalance ?: BigDecimal.ZERO
        if (balance <= BigDecimal.ZERO) {
            return VoucherRedemptionResult(
                success = false,
                errorCode = "NO_BALANCE",
                errorMessage = "Gift card has no balance"
            )
        }

        // Determine amount to redeem
        val amountToRedeem = command.amount?.let { minOf(it, balance) } ?: balance

        // Deduct from gift card
        voucher.deductGiftCardBalance(amountToRedeem)
        voucher.recordUse()
        val savedVoucher = voucherRepository.save(voucher)

        // Add to wallet
        walletService.addCredit(
            memberId = command.memberId,
            amount = Money.of(amountToRedeem, voucher.discountCurrency),
            description = "Gift card redemption: ${voucher.code}"
        )

        // Record usage
        val usage = VoucherUsage(
            voucherId = voucher.id,
            memberId = command.memberId,
            usedForType = UsageType.WALLET_REDEMPTION,
            discountApplied = amountToRedeem,
            discountCurrency = voucher.discountCurrency
        )
        val savedUsage = usageRepository.save(usage)

        logger.info("Redeemed gift card ${voucher.code} for $amountToRedeem ${voucher.discountCurrency} to member ${command.memberId}")

        return VoucherRedemptionResult(
            success = true,
            voucher = savedVoucher,
            usage = savedUsage,
            discountApplied = amountToRedeem
        )
    }

    /**
     * Get usage history for a voucher.
     */
    @Transactional(readOnly = true)
    fun getVoucherUsage(voucherId: UUID, pageable: Pageable): Page<VoucherUsage> {
        return usageRepository.findByVoucherId(voucherId, pageable)
    }

    /**
     * Get usage history for a member.
     */
    @Transactional(readOnly = true)
    fun getMemberUsage(memberId: UUID, pageable: Pageable): Page<VoucherUsage> {
        return usageRepository.findByMemberId(memberId, pageable)
    }

    private fun parseUsageType(type: String): UsageType {
        return when (type.uppercase()) {
            "SUBSCRIPTION" -> UsageType.SUBSCRIPTION
            "SHOP_ORDER", "ORDER" -> UsageType.SHOP_ORDER
            "WALLET", "WALLET_REDEMPTION" -> UsageType.WALLET_REDEMPTION
            else -> throw IllegalArgumentException("Unknown usage type: $type")
        }
    }
}
