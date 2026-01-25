package com.liyaqa.voucher.application.services

import com.liyaqa.voucher.application.commands.ValidateVoucherCommand
import com.liyaqa.voucher.domain.model.DiscountType
import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.ports.VoucherRepository
import com.liyaqa.voucher.domain.ports.VoucherUsageRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

/**
 * Result of voucher validation.
 */
data class VoucherValidationResult(
    val valid: Boolean,
    val voucher: Voucher? = null,
    val discountAmount: BigDecimal = BigDecimal.ZERO,
    val freeTrialDays: Int = 0,
    val errorCode: String? = null,
    val errorMessage: String? = null
)

/**
 * Service for validating vouchers before use.
 */
@Service
@Transactional(readOnly = true)
class VoucherValidationService(
    private val voucherRepository: VoucherRepository,
    private val usageRepository: VoucherUsageRepository
) {

    /**
     * Validate a voucher for use.
     */
    fun validate(command: ValidateVoucherCommand): VoucherValidationResult {
        // Find the voucher
        val voucher = voucherRepository.findByCode(command.code.uppercase()).orElse(null)
            ?: return VoucherValidationResult(
                valid = false,
                errorCode = "NOT_FOUND",
                errorMessage = "Voucher not found"
            )

        // Check if active and valid
        if (!voucher.isValidForUse()) {
            return when {
                !voucher.isActive -> VoucherValidationResult(
                    valid = false,
                    errorCode = "INACTIVE",
                    errorMessage = "Voucher is inactive"
                )
                voucher.hasExpired() -> VoucherValidationResult(
                    valid = false,
                    errorCode = "EXPIRED",
                    errorMessage = "Voucher has expired"
                )
                voucher.hasReachedLimit() -> VoucherValidationResult(
                    valid = false,
                    errorCode = "LIMIT_REACHED",
                    errorMessage = "Voucher usage limit reached"
                )
                else -> VoucherValidationResult(
                    valid = false,
                    errorCode = "NOT_VALID",
                    errorMessage = "Voucher is not valid for use"
                )
            }
        }

        // Check member usage limit
        val memberUsageCount = usageRepository.countByVoucherIdAndMemberId(
            voucher.id,
            command.memberId
        ).toInt()
        if (!voucher.canMemberUse(memberUsageCount)) {
            return VoucherValidationResult(
                valid = false,
                errorCode = "MEMBER_LIMIT_REACHED",
                errorMessage = "You have already used this voucher"
            )
        }

        // Check first-time member restriction
        if (voucher.firstTimeMemberOnly && !command.isFirstTimeMember) {
            return VoucherValidationResult(
                valid = false,
                errorCode = "FIRST_TIME_ONLY",
                errorMessage = "This voucher is for first-time members only"
            )
        }

        // Check minimum purchase
        if (!voucher.meetMinimumPurchase(command.purchaseAmount)) {
            return VoucherValidationResult(
                valid = false,
                errorCode = "MINIMUM_NOT_MET",
                errorMessage = "Minimum purchase amount not met"
            )
        }

        // Check plan applicability
        if (command.planId != null && !voucher.isApplicableToPlan(command.planId)) {
            return VoucherValidationResult(
                valid = false,
                errorCode = "NOT_APPLICABLE_PLAN",
                errorMessage = "Voucher is not applicable to this plan"
            )
        }

        // Check product applicability
        if (command.productIds.isNotEmpty()) {
            val allApplicable = command.productIds.all { voucher.isApplicableToProduct(it) }
            if (!allApplicable) {
                return VoucherValidationResult(
                    valid = false,
                    errorCode = "NOT_APPLICABLE_PRODUCT",
                    errorMessage = "Voucher is not applicable to some products"
                )
            }
        }

        // Calculate discount
        val discountAmount = voucher.calculateDiscount(command.purchaseAmount)
        val freeTrialDays = if (voucher.discountType == DiscountType.FREE_TRIAL) {
            voucher.freeTrialDays ?: 0
        } else 0

        return VoucherValidationResult(
            valid = true,
            voucher = voucher,
            discountAmount = discountAmount,
            freeTrialDays = freeTrialDays
        )
    }

    /**
     * Simple validation that just checks if the code is valid.
     */
    fun isValidCode(code: String): Boolean {
        val voucher = voucherRepository.findByCode(code.uppercase()).orElse(null)
            ?: return false
        return voucher.isValidForUse()
    }
}
