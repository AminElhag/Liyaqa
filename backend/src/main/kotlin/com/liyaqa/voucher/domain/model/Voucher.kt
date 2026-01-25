package com.liyaqa.voucher.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Converts a list of UUIDs to a comma-separated string.
 */
@Converter
class UuidListConverter : AttributeConverter<List<UUID>, String> {
    override fun convertToDatabaseColumn(attribute: List<UUID>?): String? {
        return attribute?.joinToString(",") { it.toString() }
    }

    override fun convertToEntityAttribute(dbData: String?): List<UUID> {
        return dbData?.takeIf { it.isNotEmpty() }
            ?.split(",")
            ?.map { UUID.fromString(it.trim()) }
            ?: emptyList()
    }
}

/**
 * A voucher/promo code that can provide discounts or benefits.
 */
@Entity
@Table(name = "vouchers")
class Voucher(
    @Column(name = "code", nullable = false, length = 50)
    val code: String,

    @Column(name = "name_en", nullable = false)
    var nameEn: String,

    @Column(name = "name_ar")
    var nameAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 50)
    val discountType: DiscountType,

    @Column(name = "discount_amount", precision = 10, scale = 2)
    var discountAmount: BigDecimal? = null,

    @Column(name = "discount_currency", length = 3)
    var discountCurrency: String = "SAR",

    @Column(name = "discount_percent", precision = 5, scale = 2)
    var discountPercent: BigDecimal? = null,

    @Column(name = "free_trial_days")
    var freeTrialDays: Int? = null,

    @Column(name = "gift_card_balance", precision = 10, scale = 2)
    var giftCardBalance: BigDecimal? = null,

    @Column(name = "max_uses")
    var maxUses: Int? = null,

    @Column(name = "max_uses_per_member")
    var maxUsesPerMember: Int = 1,

    @Column(name = "current_use_count", nullable = false)
    var currentUseCount: Int = 0,

    @Column(name = "valid_from")
    var validFrom: Instant? = null,

    @Column(name = "valid_until")
    var validUntil: Instant? = null,

    @Column(name = "first_time_member_only", nullable = false)
    var firstTimeMemberOnly: Boolean = false,

    @Column(name = "minimum_purchase", precision = 10, scale = 2)
    var minimumPurchase: BigDecimal? = null,

    @Convert(converter = UuidListConverter::class)
    @Column(name = "applicable_plan_ids")
    var applicablePlanIds: List<UUID> = emptyList(),

    @Convert(converter = UuidListConverter::class)
    @Column(name = "applicable_product_ids")
    var applicableProductIds: List<UUID> = emptyList(),

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Get the localized name.
     */
    val name: LocalizedText
        get() = LocalizedText(en = nameEn, ar = nameAr ?: nameEn)

    /**
     * Check if the voucher is valid for use.
     */
    fun isValidForUse(): Boolean {
        if (!isActive) return false

        val now = Instant.now()
        if (validFrom != null && now.isBefore(validFrom)) return false
        if (validUntil != null && now.isAfter(validUntil)) return false

        if (maxUses != null && currentUseCount >= maxUses!!) return false

        return true
    }

    /**
     * Check if a member can use this voucher.
     */
    fun canMemberUse(memberUsageCount: Int): Boolean {
        return memberUsageCount < maxUsesPerMember
    }

    /**
     * Check if this voucher is applicable to a specific plan.
     */
    fun isApplicableToPlan(planId: UUID): Boolean {
        return applicablePlanIds.isEmpty() || applicablePlanIds.contains(planId)
    }

    /**
     * Check if this voucher is applicable to a specific product.
     */
    fun isApplicableToProduct(productId: UUID): Boolean {
        return applicableProductIds.isEmpty() || applicableProductIds.contains(productId)
    }

    /**
     * Check if the purchase amount meets the minimum requirement.
     */
    fun meetMinimumPurchase(amount: BigDecimal): Boolean {
        return minimumPurchase == null || amount >= minimumPurchase
    }

    /**
     * Calculate the discount for a given amount.
     */
    fun calculateDiscount(originalAmount: BigDecimal): BigDecimal {
        return when (discountType) {
            DiscountType.FIXED_AMOUNT -> discountAmount ?: BigDecimal.ZERO
            DiscountType.PERCENTAGE -> {
                val percent = discountPercent ?: BigDecimal.ZERO
                originalAmount.multiply(percent).divide(BigDecimal(100))
            }
            DiscountType.FREE_TRIAL -> BigDecimal.ZERO
            DiscountType.GIFT_CARD -> minOf(giftCardBalance ?: BigDecimal.ZERO, originalAmount)
        }
    }

    /**
     * Record a use of this voucher.
     */
    fun recordUse() {
        currentUseCount++
    }

    /**
     * Deduct from gift card balance.
     */
    fun deductGiftCardBalance(amount: BigDecimal) {
        require(discountType == DiscountType.GIFT_CARD) { "Not a gift card voucher" }
        require(giftCardBalance != null && giftCardBalance!! >= amount) {
            "Insufficient gift card balance"
        }
        giftCardBalance = giftCardBalance!! - amount
    }

    /**
     * Activate the voucher.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Deactivate the voucher.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Check if the voucher has expired.
     */
    fun hasExpired(): Boolean {
        return validUntil != null && Instant.now().isAfter(validUntil)
    }

    /**
     * Check if the voucher usage limit has been reached.
     */
    fun hasReachedLimit(): Boolean {
        return maxUses != null && currentUseCount >= maxUses!!
    }
}
