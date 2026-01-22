package com.liyaqa.shop.domain.model

import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Embedded

/**
 * Embeddable value object for stock-based pricing rules.
 * Allows different pricing when stock is low or depleted.
 */
@Embeddable
data class StockPricing(
    /**
     * Threshold below which low stock pricing applies.
     * When stock_quantity <= lowStockThreshold, lowStockPrice is used.
     */
    @Column(name = "low_stock_threshold")
    val lowStockThreshold: Int = 10,

    /**
     * Price to charge when stock is low (at or below threshold).
     * Null means use regular list price even when stock is low.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "low_stock_price")),
        AttributeOverride(name = "currency", column = Column(name = "low_stock_currency"))
    )
    val lowStockPrice: Money? = null,

    /**
     * Price to charge when stock is depleted (zero).
     * Null means product is unavailable when out of stock.
     * If set, allows selling even when stock is zero (backorder/preorder).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "out_of_stock_price")),
        AttributeOverride(name = "currency", column = Column(name = "out_of_stock_currency"))
    )
    val outOfStockPrice: Money? = null
) {
    companion object {
        /**
         * Creates a stock pricing with only a low stock threshold and premium price.
         */
        fun withLowStockPremium(threshold: Int, premiumPrice: Money): StockPricing =
            StockPricing(lowStockThreshold = threshold, lowStockPrice = premiumPrice)

        /**
         * Creates a stock pricing that allows backorder at a specific price.
         */
        fun withBackorder(backorderPrice: Money): StockPricing =
            StockPricing(outOfStockPrice = backorderPrice)
    }
}
