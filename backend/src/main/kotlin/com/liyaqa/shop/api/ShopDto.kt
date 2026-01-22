package com.liyaqa.shop.api

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shop.application.services.CheckoutResult
import com.liyaqa.shop.domain.model.Order
import com.liyaqa.shop.domain.model.OrderItem
import com.liyaqa.shop.domain.model.OrderStatus
import com.liyaqa.shop.domain.model.ProductType
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ===========================
// CART REQUEST DTOs
// ===========================

data class AddToCartRequest(
    @field:NotNull(message = "Product ID is required")
    val productId: UUID,

    @field:Positive(message = "Quantity must be positive")
    val quantity: Int = 1
)

data class UpdateCartItemRequest(
    @field:NotNull(message = "Quantity is required")
    val quantity: Int
)

data class CheckoutRequest(
    val notes: String? = null
)

// ===========================
// CART RESPONSE DTOs
// ===========================

data class CartResponse(
    val id: UUID?,
    val memberId: UUID?,
    val memberName: LocalizedText?,
    val memberEmail: String?,
    val items: List<CartItemResponse>,
    val itemCount: Int,
    val subtotal: MoneyResponse,
    val taxTotal: MoneyResponse,
    val grandTotal: MoneyResponse
) {
    companion object {
        fun from(order: Order?, member: Member? = null): CartResponse {
            if (order == null) {
                return CartResponse(
                    id = null,
                    memberId = member?.id,
                    memberName = member?.fullName,
                    memberEmail = member?.email,
                    items = emptyList(),
                    itemCount = 0,
                    subtotal = MoneyResponse.ZERO,
                    taxTotal = MoneyResponse.ZERO,
                    grandTotal = MoneyResponse.ZERO
                )
            }

            return CartResponse(
                id = order.id,
                memberId = order.memberId,
                memberName = member?.fullName,
                memberEmail = member?.email,
                items = order.items.map { CartItemResponse.from(it) },
                itemCount = order.getItemCount(),
                subtotal = MoneyResponse.from(order.getSubtotal()),
                taxTotal = MoneyResponse.from(order.getTaxTotal()),
                grandTotal = MoneyResponse.from(order.getGrandTotal())
            )
        }
    }
}

data class CartItemResponse(
    val productId: UUID,
    val productName: LocalizedText,
    val productType: ProductType,
    val quantity: Int,
    val unitPrice: MoneyResponse,
    val taxRate: BigDecimal,
    val lineTotal: MoneyResponse,
    val lineTax: MoneyResponse,
    val lineGross: MoneyResponse
) {
    companion object {
        fun from(item: OrderItem) = CartItemResponse(
            productId = item.productId,
            productName = item.productName,
            productType = item.productType,
            quantity = item.quantity,
            unitPrice = MoneyResponse.from(item.unitPrice),
            taxRate = item.taxRate,
            lineTotal = MoneyResponse.from(item.getLineTotal()),
            lineTax = MoneyResponse.from(item.getLineTax()),
            lineGross = MoneyResponse.from(item.getLineGross())
        )
    }
}

// ===========================
// CHECKOUT RESPONSE DTOs
// ===========================

data class CheckoutResultResponse(
    val orderId: UUID,
    val invoiceId: UUID,
    val memberId: UUID?,
    val memberName: LocalizedText?,
    val memberEmail: String?,
    val grandTotal: MoneyResponse
) {
    companion object {
        fun from(result: CheckoutResult, member: Member? = null) = CheckoutResultResponse(
            orderId = result.orderId,
            invoiceId = result.invoiceId,
            memberId = member?.id,
            memberName = member?.fullName,
            memberEmail = member?.email,
            grandTotal = MoneyResponse.from(result.grandTotal)
        )
    }
}

// ===========================
// ORDER RESPONSE DTOs
// ===========================

data class OrderResponse(
    val id: UUID,
    val memberId: UUID,
    val memberName: LocalizedText?,
    val memberEmail: String?,
    val status: OrderStatus,
    val items: List<CartItemResponse>,
    val itemCount: Int,
    val subtotal: MoneyResponse,
    val taxTotal: MoneyResponse,
    val grandTotal: MoneyResponse,
    val invoiceId: UUID?,
    val notes: String?,
    val placedAt: Instant?,
    val completedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(order: Order, member: Member? = null) = OrderResponse(
            id = order.id,
            memberId = order.memberId,
            memberName = member?.fullName,
            memberEmail = member?.email,
            status = order.status,
            items = order.items.map { CartItemResponse.from(it) },
            itemCount = order.getItemCount(),
            subtotal = MoneyResponse.from(order.getSubtotal()),
            taxTotal = MoneyResponse.from(order.getTaxTotal()),
            grandTotal = MoneyResponse.from(order.getGrandTotal()),
            invoiceId = order.invoiceId,
            notes = order.notes,
            placedAt = order.placedAt,
            completedAt = order.completedAt,
            createdAt = order.createdAt,
            updatedAt = order.updatedAt
        )
    }
}
