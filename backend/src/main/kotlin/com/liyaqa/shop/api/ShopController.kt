package com.liyaqa.shop.api

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.shop.application.services.OrderService
import com.liyaqa.shop.application.services.ProductCategoryService
import com.liyaqa.shop.application.services.ProductService
import com.liyaqa.shop.domain.model.ProductStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * REST controller for shop operations.
 * Supports both:
 * - Client-service model: Admin/Staff select a member and shop on their behalf
 * - Self-service model: Members shop for themselves
 */
@RestController
@RequestMapping("/api/shop")
@Tag(name = "Shop", description = "Shop operations (browse, cart, checkout) - supports client-service and self-service")
class ShopController(
    private val productService: ProductService,
    private val categoryService: ProductCategoryService,
    private val orderService: OrderService,
    private val invoiceService: InvoiceService,
    private val memberService: MemberService
) {
    companion object {
        private val ADMIN_ROLES = setOf(Role.SUPER_ADMIN, Role.CLUB_ADMIN, Role.STAFF)
    }

    /**
     * Checks if the principal has admin/staff role.
     */
    private fun isAdminOrStaff(principal: JwtUserPrincipal): Boolean {
        return principal.role in ADMIN_ROLES
    }

    /**
     * Resolves the target member for cart operations.
     * - ADMIN/STAFF: Can specify any memberId via query param
     * - MEMBER role: Uses their own linked member record
     */
    private fun resolveTargetMember(principal: JwtUserPrincipal, requestedMemberId: UUID?): Member {
        if (isAdminOrStaff(principal) && requestedMemberId != null) {
            // Admin/Staff can operate on any member's cart
            return memberService.getMember(requestedMemberId)
        }

        // Fall back to authenticated user's member record
        return memberService.findMemberByUserId(principal.userId)
            ?: throw IllegalStateException("No member record found for user. Admin/Staff must specify memberId parameter.")
    }

    // ==================== BROWSE PRODUCTS ====================

    /**
     * Browse available products (only ACTIVE products).
     */
    @GetMapping("/products")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Browse products", description = "Browse available products for purchase")
    fun browseProducts(
        @RequestParam categoryId: UUID?,
        @RequestParam search: String?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<ProductResponse>> {
        // Only show active products for shop browsing
        val products = when {
            search != null -> productService.search(search, ProductStatus.ACTIVE, pageable)
            categoryId != null -> productService.getByCategoryAndStatus(categoryId, ProductStatus.ACTIVE, pageable)
            else -> productService.getByStatus(ProductStatus.ACTIVE, pageable)
        }

        return ResponseEntity.ok(
            products.map { ProductResponse.from(it) }
        )
    }

    /**
     * Get product details.
     */
    @GetMapping("/products/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get product details", description = "Get detailed information about a product")
    fun getProduct(@PathVariable id: UUID): ResponseEntity<ProductResponse> {
        val product = productService.getById(id)
        val bundleItems = if (product.productType.name == "BUNDLE") {
            productService.getBundleItems(id)
        } else null

        return ResponseEntity.ok(ProductResponse.from(product, bundleItems))
    }

    /**
     * Browse product categories.
     */
    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Browse categories", description = "Browse product categories")
    fun browseCategories(
        @PageableDefault(size = 50) pageable: Pageable
    ): ResponseEntity<Page<ProductCategoryResponse>> {
        val categories = categoryService.getActiveCategories(pageable)
        return ResponseEntity.ok(categories.map { ProductCategoryResponse.from(it) })
    }

    // ==================== CART OPERATIONS ====================

    /**
     * Get shopping cart.
     * Admin/Staff can specify memberId to get a member's cart.
     * Members get their own cart.
     */
    @GetMapping("/cart")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get cart", description = "Get shopping cart. Admin/Staff can specify memberId for client-service.")
    fun getCart(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) memberId: UUID?
    ): ResponseEntity<CartResponse> {
        val member = resolveTargetMember(principal, memberId)
        val cart = orderService.getOrCreateCart(member.id)
        return ResponseEntity.ok(CartResponse.from(cart, member))
    }

    /**
     * Add a product to the cart.
     * Admin/Staff can specify memberId to add to a member's cart.
     */
    @PostMapping("/cart/items")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add to cart", description = "Add a product to cart. Admin/Staff can specify memberId.")
    fun addToCart(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) memberId: UUID?,
        @Valid @RequestBody request: AddToCartRequest
    ): ResponseEntity<CartResponse> {
        val member = resolveTargetMember(principal, memberId)
        val cart = orderService.addToCart(member.id, request.productId, request.quantity)
        return ResponseEntity.ok(CartResponse.from(cart, member))
    }

    /**
     * Update the quantity of an item in the cart.
     * Admin/Staff can specify memberId to update a member's cart.
     */
    @PatchMapping("/cart/items/{productId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update cart item", description = "Update quantity. Admin/Staff can specify memberId.")
    fun updateCartItem(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) memberId: UUID?,
        @PathVariable productId: UUID,
        @Valid @RequestBody request: UpdateCartItemRequest
    ): ResponseEntity<CartResponse> {
        val member = resolveTargetMember(principal, memberId)
        val cart = orderService.updateCartItem(member.id, productId, request.quantity)
        return ResponseEntity.ok(CartResponse.from(cart, member))
    }

    /**
     * Remove an item from the cart.
     * Admin/Staff can specify memberId to remove from a member's cart.
     */
    @DeleteMapping("/cart/items/{productId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove from cart", description = "Remove item. Admin/Staff can specify memberId.")
    fun removeFromCart(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) memberId: UUID?,
        @PathVariable productId: UUID
    ): ResponseEntity<CartResponse> {
        val member = resolveTargetMember(principal, memberId)
        val cart = orderService.removeFromCart(member.id, productId)
        return ResponseEntity.ok(CartResponse.from(cart, member))
    }

    /**
     * Clear the entire cart.
     * Admin/Staff can specify memberId to clear a member's cart.
     */
    @DeleteMapping("/cart")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Clear cart", description = "Clear all items. Admin/Staff can specify memberId.")
    fun clearCart(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) memberId: UUID?
    ): ResponseEntity<CartResponse> {
        val member = resolveTargetMember(principal, memberId)
        val cart = orderService.clearCart(member.id)
        return ResponseEntity.ok(CartResponse.from(cart, member))
    }

    // ==================== CHECKOUT ====================

    /**
     * Checkout and create an invoice for the cart.
     * Admin/Staff can specify memberId to checkout a member's cart.
     */
    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Checkout", description = "Checkout cart and create invoice. Admin/Staff can specify memberId.")
    fun checkout(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) memberId: UUID?,
        @RequestBody request: CheckoutRequest?
    ): ResponseEntity<CheckoutResultResponse> {
        val member = resolveTargetMember(principal, memberId)
        val result = orderService.checkout(member.id, invoiceService, request?.notes)
        return ResponseEntity.ok(CheckoutResultResponse.from(result, member))
    }

    // ==================== ORDER HISTORY ====================

    /**
     * Get order history.
     * Admin/Staff can specify memberId to get a member's order history.
     */
    @GetMapping("/orders")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get orders", description = "Get order history. Admin/Staff can specify memberId.")
    fun getMyOrders(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) memberId: UUID?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<OrderResponse>> {
        val member = resolveTargetMember(principal, memberId)
        val orders = orderService.getMemberOrders(member.id, pageable)
        return ResponseEntity.ok(orders.map { OrderResponse.from(it, member) })
    }

    /**
     * Get a specific order by ID.
     * Admin/Staff can access any order. Members can only access their own orders.
     */
    @GetMapping("/orders/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get order", description = "Get order details. Admin/Staff can access any order.")
    fun getOrder(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @PathVariable id: UUID
    ): ResponseEntity<OrderResponse> {
        val order = orderService.getOrder(id)

        // Admin/Staff can access any order, members can only access their own
        if (!isAdminOrStaff(principal)) {
            val member = memberService.findMemberByUserId(principal.userId)
                ?: return ResponseEntity.notFound().build()
            if (order.memberId != member.id) {
                return ResponseEntity.notFound().build()
            }
        }

        // Get the member for the order to include in response
        val orderMember = memberService.getMember(order.memberId)
        return ResponseEntity.ok(OrderResponse.from(order, orderMember))
    }
}
