package com.liyaqa.shop.domain.model

import com.liyaqa.shared.domain.Money
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.util.UUID

/**
 * Entity representing an item within a bundle product.
 * Links a bundle (Product of type BUNDLE) to its included products/services.
 */
@Entity
@Table(name = "bundle_items")
class BundleItem(
    @Id
    val id: UUID = UUID.randomUUID(),

    /**
     * The bundle product this item belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id", nullable = false)
    val bundle: Product,

    /**
     * The product included in the bundle.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    val product: Product,

    /**
     * Quantity of this product in the bundle.
     */
    @Column(name = "quantity", nullable = false)
    val quantity: Int = 1,

    /**
     * Display order within the bundle.
     */
    @Column(name = "sort_order", nullable = false)
    val sortOrder: Int = 0
) {
    init {
        require(bundle.productType == ProductType.BUNDLE) { "Bundle must be of type BUNDLE" }
        require(product.productType != ProductType.BUNDLE) { "Cannot nest bundles" }
        require(quantity > 0) { "Quantity must be positive" }
    }

    /**
     * Calculate the line value (product price * quantity).
     */
    fun lineValue(): Money {
        val unitPrice = product.listPrice
        return Money(
            amount = unitPrice.amount.multiply(quantity.toBigDecimal()),
            currency = unitPrice.currency
        )
    }
}
