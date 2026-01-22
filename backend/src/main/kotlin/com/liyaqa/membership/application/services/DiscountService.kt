package com.liyaqa.membership.application.services

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.domain.model.DiscountType
import com.liyaqa.shared.domain.Money
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

@Service
class DiscountService(
    private val userRepository: UserRepository
) {
    companion object {
        // Maximum discount percentages by role
        const val STAFF_MAX_DISCOUNT_PERCENT = 20.0
        const val CLUB_ADMIN_MAX_DISCOUNT_PERCENT = 50.0
        const val SUPER_ADMIN_MAX_DISCOUNT_PERCENT = 100.0
        const val PLATFORM_ADMIN_MAX_DISCOUNT_PERCENT = 100.0
    }

    /**
     * Validates and calculates the final price after applying a discount.
     *
     * @param discountType The type of discount being applied
     * @param discountValue The discount value (percentage or fixed amount)
     * @param appliedByUserId The ID of the user applying the discount
     * @param originalPrice The original price before discount
     * @return The final price after discount
     * @throws IllegalArgumentException if discount exceeds user's allowed maximum
     * @throws NoSuchElementException if user is not found
     */
    fun calculateDiscountedPrice(
        discountType: DiscountType?,
        discountValue: BigDecimal?,
        appliedByUserId: UUID,
        originalPrice: Money
    ): DiscountResult {
        if (discountType == null || discountValue == null || discountValue <= BigDecimal.ZERO) {
            return DiscountResult(
                originalPrice = originalPrice,
                finalPrice = originalPrice,
                discountAmount = BigDecimal.ZERO,
                effectiveDiscountPercent = BigDecimal.ZERO
            )
        }

        val user = userRepository.findById(appliedByUserId)
            .orElseThrow { NoSuchElementException("User not found: $appliedByUserId") }

        val maxDiscountPercent = getMaxDiscountPercent(user.role)

        val (discountAmount, effectiveDiscountPercent) = when (discountType) {
            DiscountType.PERCENTAGE -> {
                require(discountValue.toDouble() <= maxDiscountPercent) {
                    "Discount exceeds maximum allowed for your role (${maxDiscountPercent}%)"
                }
                val amount = originalPrice.amount
                    .multiply(discountValue)
                    .divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
                Pair(amount, discountValue)
            }
            DiscountType.FIXED_AMOUNT -> {
                val maxAllowedAmount = originalPrice.amount
                    .multiply(BigDecimal(maxDiscountPercent))
                    .divide(BigDecimal(100), 2, RoundingMode.HALF_UP)

                require(discountValue <= maxAllowedAmount) {
                    "Discount amount exceeds maximum allowed for your role"
                }

                // Calculate effective percentage
                val effectivePercent = if (originalPrice.amount > BigDecimal.ZERO) {
                    discountValue
                        .multiply(BigDecimal(100))
                        .divide(originalPrice.amount, 2, RoundingMode.HALF_UP)
                } else BigDecimal.ZERO

                Pair(discountValue, effectivePercent)
            }
            // Other discount types (promotional, corporate, etc.) are validated differently
            else -> {
                val amount = originalPrice.amount
                    .multiply(discountValue)
                    .divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
                Pair(amount, discountValue)
            }
        }

        val finalAmount = (originalPrice.amount - discountAmount).coerceAtLeast(BigDecimal.ZERO)

        return DiscountResult(
            originalPrice = originalPrice,
            finalPrice = Money(finalAmount, originalPrice.currency),
            discountAmount = discountAmount,
            effectiveDiscountPercent = effectiveDiscountPercent
        )
    }

    /**
     * Gets the maximum discount percentage allowed for a given role.
     */
    fun getMaxDiscountPercent(role: Role): Double {
        return when (role) {
            Role.PLATFORM_ADMIN -> PLATFORM_ADMIN_MAX_DISCOUNT_PERCENT
            Role.SUPER_ADMIN -> SUPER_ADMIN_MAX_DISCOUNT_PERCENT
            Role.CLUB_ADMIN -> CLUB_ADMIN_MAX_DISCOUNT_PERCENT
            Role.STAFF -> STAFF_MAX_DISCOUNT_PERCENT
            Role.SALES_REP -> CLUB_ADMIN_MAX_DISCOUNT_PERCENT // Sales reps can offer similar discounts
            else -> 0.0 // Members and other roles cannot apply discounts
        }
    }

    /**
     * Checks if a user is allowed to apply discounts.
     */
    fun canApplyDiscount(role: Role): Boolean {
        return role in listOf(
            Role.PLATFORM_ADMIN,
            Role.SUPER_ADMIN,
            Role.CLUB_ADMIN,
            Role.STAFF,
            Role.SALES_REP
        )
    }

    /**
     * Validates discount before saving.
     *
     * @param discountType The type of discount
     * @param discountValue The discount value
     * @param appliedByUserId The user applying the discount
     * @param originalPrice The original price
     * @throws IllegalArgumentException if validation fails
     */
    fun validateDiscount(
        discountType: DiscountType?,
        discountValue: BigDecimal?,
        appliedByUserId: UUID,
        originalPrice: Money
    ) {
        if (discountType == null || discountValue == null) return

        require(discountValue > BigDecimal.ZERO) { "Discount value must be positive" }

        val user = userRepository.findById(appliedByUserId)
            .orElseThrow { NoSuchElementException("User not found: $appliedByUserId") }

        require(canApplyDiscount(user.role)) {
            "User role ${user.role} is not authorized to apply discounts"
        }

        val maxPercent = getMaxDiscountPercent(user.role)

        when (discountType) {
            DiscountType.PERCENTAGE -> {
                require(discountValue.toDouble() <= maxPercent) {
                    "Percentage discount cannot exceed ${maxPercent}% for your role"
                }
                require(discountValue.toDouble() <= 100) {
                    "Percentage discount cannot exceed 100%"
                }
            }
            DiscountType.FIXED_AMOUNT -> {
                val maxAmount = originalPrice.amount
                    .multiply(BigDecimal(maxPercent))
                    .divide(BigDecimal(100), 2, RoundingMode.HALF_UP)

                require(discountValue <= maxAmount) {
                    "Fixed discount cannot exceed ${maxPercent}% of original price"
                }
                require(discountValue <= originalPrice.amount) {
                    "Discount cannot exceed the original price"
                }
            }
            else -> {
                // For other discount types (promotional, corporate, etc.)
                // Apply similar percentage validation
                require(discountValue.toDouble() <= maxPercent) {
                    "Discount cannot exceed ${maxPercent}% for your role"
                }
            }
        }
    }
}

/**
 * Result of discount calculation.
 */
data class DiscountResult(
    val originalPrice: Money,
    val finalPrice: Money,
    val discountAmount: BigDecimal,
    val effectiveDiscountPercent: BigDecimal
)
