package com.liyaqa.shop.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

/**
 * Entity representing an item in an order.
 * Captures product details at time of order (snapshot).
 */
@Entity
@Table(name = "order_items")
class OrderItem(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    /**
     * The order this item belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    val order: Order,

    /**
     * Reference to the product.
     */
    @Column(name = "product_id", nullable = false)
    val productId: UUID,

    /**
     * Product name at time of order (snapshot).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "product_name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "product_name_ar"))
    )
    val productName: LocalizedText,

    /**
     * Product type at time of order.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false)
    val productType: ProductType,

    /**
     * Quantity ordered.
     */
    @Column(name = "quantity", nullable = false)
    var quantity: Int,

    /**
     * Unit price at time of order (snapshot).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "unit_price", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "currency", nullable = false))
    )
    val unitPrice: Money,

    /**
     * Tax rate at time of order (snapshot).
     */
    @Column(name = "tax_rate", nullable = false)
    val taxRate: BigDecimal
) {

    /**
     * Get line total (unit price × quantity, before tax).
     */
    fun getLineTotal(): Money {
        val total = unitPrice.amount.multiply(BigDecimal(quantity))
        return Money(total, unitPrice.currency)
    }

    /**
     * Get tax amount for this line.
     */
    fun getLineTax(): Money {
        val tax = getLineTotal().amount
            .multiply(taxRate)
            .divide(BigDecimal("100"), 2, RoundingMode.HALF_UP)
        return Money(tax, unitPrice.currency)
    }

    /**
     * Get gross amount (line total + tax).
     */
    fun getLineGross(): Money {
        val gross = getLineTotal().amount.add(getLineTax().amount)
        return Money(gross, unitPrice.currency)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is OrderItem) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
