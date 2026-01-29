package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

/**
 * Pricing tier for contract terms, allowing discounts for longer commitments.
 * E.g., Annual contract = 20% off, Semi-annual = 10% off.
 */
@Entity
@Table(name = "contract_pricing_tiers")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ContractPricingTier(
    id: UUID = UUID.randomUUID(),

    @Column(name = "plan_id", nullable = false)
    val planId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_term", nullable = false)
    var contractTerm: ContractTerm,

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    var discountPercentage: BigDecimal? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "override_monthly_fee_amount")),
        AttributeOverride(name = "currency", column = Column(name = "override_monthly_fee_currency"))
    )
    var overrideMonthlyFee: Money? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : BaseEntity(id) {

    /**
     * Calculate the effective monthly fee based on this tier.
     * Either uses the override fee directly, or applies discount to base fee.
     */
    fun calculateEffectiveMonthlyFee(baseFee: Money): Money {
        // If there's an override, use it directly
        overrideMonthlyFee?.let { return it }

        // Otherwise apply discount percentage
        val discount = discountPercentage ?: BigDecimal.ZERO
        if (discount <= BigDecimal.ZERO) return baseFee

        val discountMultiplier = BigDecimal.ONE - discount.divide(BigDecimal(100), 4, RoundingMode.HALF_UP)
        return Money(
            baseFee.amount.multiply(discountMultiplier).setScale(2, RoundingMode.HALF_UP),
            baseFee.currency
        )
    }

    /**
     * Calculate savings compared to base fee.
     */
    fun calculateMonthlySavings(baseFee: Money): Money {
        val effectiveFee = calculateEffectiveMonthlyFee(baseFee)
        return baseFee - effectiveFee
    }

    /**
     * Calculate total savings over the contract term.
     */
    fun calculateTotalSavings(baseFee: Money): Money {
        val monthlySavings = calculateMonthlySavings(baseFee)
        return monthlySavings * contractTerm.toMonths()
    }

    /**
     * Get the effective discount percentage.
     */
    fun getEffectiveDiscountPercentage(baseFee: Money): BigDecimal {
        discountPercentage?.let { return it }

        overrideMonthlyFee?.let { override ->
            if (baseFee.amount <= BigDecimal.ZERO) return BigDecimal.ZERO
            val savings = baseFee.amount - override.amount
            return savings.divide(baseFee.amount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal(100))
                .setScale(2, RoundingMode.HALF_UP)
        }

        return BigDecimal.ZERO
    }

    /**
     * Deactivate this pricing tier.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Activate this pricing tier.
     */
    fun activate() {
        isActive = true
    }
}
