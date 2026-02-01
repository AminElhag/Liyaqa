package com.liyaqa.shop.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.Money
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Entity representing a member's order (shopping cart or placed order).
 * Manages the lifecycle from cart → payment → fulfillment.
 */
@Entity
@Table(name = "orders")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Order(
    id: UUID = UUID.randomUUID(),

    /**
     * The member who owns this order.
     */
    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    /**
     * Current status of the order.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: OrderStatus = OrderStatus.CART,

    /**
     * Items in this order.
     */
    @OneToMany(mappedBy = "order", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    val items: MutableList<OrderItem> = mutableListOf(),

    /**
     * Associated invoice ID after checkout.
     */
    @Column(name = "invoice_id")
    var invoiceId: UUID? = null,

    /**
     * Optional notes from the member.
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    /**
     * When the order was placed (moved from CART to PENDING).
     */
    @Column(name = "placed_at")
    var placedAt: Instant? = null,

    /**
     * When the order was completed (fulfilled).
     */
    @Column(name = "completed_at")
    var completedAt: Instant? = null

) : BaseEntity(id) {

    // === CART OPERATIONS ===

    /**
     * Add a product to the cart.
     * If the product already exists, increase quantity.
     */
    fun addItem(product: Product, quantity: Int): OrderItem {
        require(status == OrderStatus.CART) { "Cannot modify non-cart order" }
        require(quantity > 0) { "Quantity must be positive" }

        val existingItem = items.find { it.productId == product.id }
        if (existingItem != null) {
            existingItem.quantity += quantity
            return existingItem
        }

        val item = OrderItem(
            order = this,
            productId = product.id,
            productName = product.name,
            productType = product.productType,
            quantity = quantity,
            unitPrice = product.getEffectivePrice(),
            taxRate = product.taxRate
        )
        items.add(item)
        return item
    }

    /**
     * Update quantity of an item in the cart.
     * If quantity is 0 or less, the item is removed.
     */
    fun updateItemQuantity(productId: UUID, quantity: Int) {
        require(status == OrderStatus.CART) { "Cannot modify non-cart order" }

        val item = items.find { it.productId == productId }
            ?: throw NoSuchElementException("Item not in cart")

        if (quantity <= 0) {
            items.remove(item)
        } else {
            item.quantity = quantity
        }
    }

    /**
     * Remove an item from the cart.
     */
    fun removeItem(productId: UUID) {
        require(status == OrderStatus.CART) { "Cannot modify non-cart order" }
        items.removeIf { it.productId == productId }
    }

    /**
     * Clear all items from the cart.
     */
    fun clearCart() {
        require(status == OrderStatus.CART) { "Cannot modify non-cart order" }
        items.clear()
    }

    // === PRICING CALCULATIONS ===

    /**
     * Get subtotal (sum of line totals before tax).
     */
    fun getSubtotal(): Money {
        if (items.isEmpty()) return Money.ZERO
        val currency = items.first().unitPrice.currency
        val total = items.sumOf { it.getLineTotal().amount }
        return Money(total, currency)
    }

    /**
     * Get total tax amount.
     */
    fun getTaxTotal(): Money {
        if (items.isEmpty()) return Money.ZERO
        val currency = items.first().unitPrice.currency
        val total = items.sumOf { it.getLineTax().amount }
        return Money(total, currency)
    }

    /**
     * Get grand total (subtotal + tax).
     */
    fun getGrandTotal(): Money {
        if (items.isEmpty()) return Money.ZERO
        val currency = items.first().unitPrice.currency
        val total = items.sumOf { it.getLineGross().amount }
        return Money(total, currency)
    }

    /**
     * Get total number of items (sum of quantities).
     */
    fun getItemCount(): Int = items.sumOf { it.quantity }

    /**
     * Check if the cart is empty.
     */
    fun isEmpty(): Boolean = items.isEmpty()

    // === STATUS TRANSITIONS ===

    /**
     * Place the order (move from CART to PENDING).
     */
    fun placeOrder() {
        require(status == OrderStatus.CART) { "Order already placed" }
        require(items.isNotEmpty()) { "Cannot place empty order" }
        status = OrderStatus.PENDING
        placedAt = Instant.now()
    }

    /**
     * Mark order as paid after successful payment.
     */
    fun markPaid(invoiceId: UUID) {
        require(status == OrderStatus.PENDING) { "Order not pending payment" }
        this.invoiceId = invoiceId
        status = OrderStatus.PAID
    }

    /**
     * Start processing the order (fulfillment).
     */
    fun startProcessing() {
        require(status == OrderStatus.PAID) { "Order not paid" }
        status = OrderStatus.PROCESSING
    }

    /**
     * Complete the order (all items fulfilled).
     */
    fun complete() {
        require(status == OrderStatus.PROCESSING || status == OrderStatus.PAID) {
            "Order must be paid or processing to complete"
        }
        status = OrderStatus.COMPLETED
        completedAt = Instant.now()
    }

    /**
     * Cancel the order.
     * Only cart and pending orders can be cancelled.
     */
    fun cancel() {
        require(status in listOf(OrderStatus.CART, OrderStatus.PENDING)) {
            "Cannot cancel order in status $status"
        }
        status = OrderStatus.CANCELLED
    }
}
