package com.liyaqa.shop.application.services

import com.liyaqa.billing.application.commands.CreateInvoiceCommand
import com.liyaqa.billing.application.commands.LineItemCommand
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shop.domain.model.Order
import com.liyaqa.shop.domain.model.OrderItem
import com.liyaqa.shop.domain.model.OrderStatus
import com.liyaqa.shop.domain.model.ProductType
import com.liyaqa.shop.domain.ports.OrderRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Application service for managing shopping cart and orders.
 */
@Service
@Transactional
class OrderService(
    private val orderRepository: OrderRepository,
    private val productService: ProductService
) {
    private val logger = LoggerFactory.getLogger(OrderService::class.java)

    // === CART OPERATIONS ===

    /**
     * Get or create a shopping cart for the member.
     * There can only be one active cart per member.
     */
    fun getOrCreateCart(memberId: UUID): Order {
        return orderRepository.findByMemberIdAndStatus(memberId, OrderStatus.CART)
            .orElseGet {
                val cart = Order(memberId = memberId)
                orderRepository.save(cart)
            }
    }

    /**
     * Get the current cart for a member (without creating if not exists).
     */
    @Transactional(readOnly = true)
    fun getCart(memberId: UUID): Order? {
        return orderRepository.findByMemberIdAndStatus(memberId, OrderStatus.CART).orElse(null)
    }

    /**
     * Add a product to the member's cart.
     */
    fun addToCart(memberId: UUID, productId: UUID, quantity: Int): Order {
        require(quantity > 0) { "Quantity must be positive" }

        val cart = getOrCreateCart(memberId)
        val product = productService.getById(productId)

        // Validate availability
        require(product.isAvailable()) { "Product is not available" }

        // Validate purchase (single-use, max quantity, stock)
        val existingQuantity = cart.items.find { it.productId == productId }?.quantity ?: 0
        productService.validatePurchase(memberId, productId, existingQuantity + quantity)

        cart.addItem(product, quantity)
        return orderRepository.save(cart)
    }

    /**
     * Update the quantity of an item in the cart.
     */
    fun updateCartItem(memberId: UUID, productId: UUID, quantity: Int): Order {
        val cart = getOrCreateCart(memberId)

        if (quantity > 0) {
            // Validate the new quantity
            productService.validatePurchase(memberId, productId, quantity)
        }

        cart.updateItemQuantity(productId, quantity)
        return orderRepository.save(cart)
    }

    /**
     * Remove an item from the cart.
     */
    fun removeFromCart(memberId: UUID, productId: UUID): Order {
        val cart = getOrCreateCart(memberId)
        cart.removeItem(productId)
        return orderRepository.save(cart)
    }

    /**
     * Clear all items from the cart.
     */
    fun clearCart(memberId: UUID): Order {
        val cart = getOrCreateCart(memberId)
        cart.clearCart()
        return orderRepository.save(cart)
    }

    // === CHECKOUT ===

    /**
     * Checkout the cart and create an invoice.
     * Returns the checkout result containing the order ID and invoice ID.
     */
    fun checkout(memberId: UUID, invoiceService: InvoiceService, notes: String? = null): CheckoutResult {
        val cart = orderRepository.findByMemberIdAndStatus(memberId, OrderStatus.CART)
            .orElseThrow { NoSuchElementException("No active cart found") }

        require(!cart.isEmpty()) { "Cart is empty" }

        // Re-validate all items before checkout
        for (item in cart.items) {
            productService.validatePurchase(memberId, item.productId, item.quantity)
        }

        // Set notes if provided
        notes?.let { cart.notes = it }

        // Place the order (moves to PENDING status)
        cart.placeOrder()

        // Create invoice from cart items
        val invoice = invoiceService.createInvoice(
            CreateInvoiceCommand(
                memberId = memberId,
                lineItems = cart.items.map { item ->
                    LineItemCommand(
                        description = item.productName,
                        quantity = item.quantity,
                        unitPrice = item.unitPrice,
                        itemType = when (item.productType) {
                            ProductType.GOODS -> LineItemType.MERCHANDISE
                            ProductType.SERVICE -> LineItemType.OTHER
                            ProductType.BUNDLE -> LineItemType.MERCHANDISE
                        }
                    )
                },
                notes = notes?.let { LocalizedText(en = it) }
            )
        )

        cart.invoiceId = invoice.id
        orderRepository.save(cart)

        logger.info("Checkout complete for member $memberId. Order: ${cart.id}, Invoice: ${invoice.id}")

        return CheckoutResult(
            orderId = cart.id,
            invoiceId = invoice.id,
            grandTotal = cart.getGrandTotal()
        )
    }

    // === ORDER FULFILLMENT ===

    /**
     * Fulfill an order after payment is confirmed.
     * This deducts stock, grants access, and records purchases.
     */
    fun fulfillOrder(orderId: UUID) {
        val order = orderRepository.findById(orderId)
            .orElseThrow { NoSuchElementException("Order not found: $orderId") }

        require(order.invoiceId != null) { "Order has no associated invoice" }

        // Mark as paid
        order.markPaid(order.invoiceId!!)

        // Process each item
        for (item in order.items) {
            productService.processPurchase(
                order.memberId,
                item.productId,
                item.quantity,
                order.invoiceId!!
            )
        }

        // Complete the order
        order.complete()
        orderRepository.save(order)

        logger.info("Order ${order.id} fulfilled for member ${order.memberId}")
    }

    /**
     * Find an order by its associated invoice ID.
     */
    @Transactional(readOnly = true)
    fun getOrderByInvoiceId(invoiceId: UUID): Order? {
        return orderRepository.findByInvoiceId(invoiceId).orElse(null)
    }

    // === ORDER QUERIES ===

    /**
     * Get an order by ID.
     */
    @Transactional(readOnly = true)
    fun getOrder(id: UUID): Order {
        return orderRepository.findById(id)
            .orElseThrow { NoSuchElementException("Order not found: $id") }
    }

    /**
     * Get order history for a member (excludes cart).
     */
    @Transactional(readOnly = true)
    fun getMemberOrders(memberId: UUID, pageable: Pageable): Page<Order> {
        return orderRepository.findByMemberIdExcludingStatus(memberId, OrderStatus.CART, pageable)
    }

    /**
     * Cancel an order (only for CART or PENDING orders).
     */
    fun cancelOrder(orderId: UUID): Order {
        val order = orderRepository.findById(orderId)
            .orElseThrow { NoSuchElementException("Order not found: $orderId") }

        order.cancel()
        return orderRepository.save(order)
    }
}

/**
 * Result of a checkout operation.
 */
data class CheckoutResult(
    val orderId: UUID,
    val invoiceId: UUID,
    val grandTotal: Money
)
