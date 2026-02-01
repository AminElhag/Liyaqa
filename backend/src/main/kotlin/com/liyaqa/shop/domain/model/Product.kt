package com.liyaqa.shop.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

/**
 * Entity representing a sellable product (goods, services, or bundles).
 * Products support stock-based pricing, zone access grants, and single-use restrictions.
 */
@Entity
@Table(name = "products")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Product(
    id: UUID = UUID.randomUUID(),

    // === BASIC INFO ===

    /**
     * Bilingual name of the product.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    /**
     * Optional bilingual description.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    /**
     * Stock Keeping Unit - unique identifier for inventory.
     */
    @Column(name = "sku", length = 50, unique = true)
    var sku: String? = null,

    // === CLASSIFICATION ===

    /**
     * Type of product (GOODS, SERVICE, or BUNDLE).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false)
    var productType: ProductType,

    /**
     * Optional category for organization.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    var category: ProductCategory? = null,

    /**
     * Lifecycle status of the product.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ProductStatus = ProductStatus.DRAFT,

    // === PRICING ===

    /**
     * Base list price of the product.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "list_price", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "currency", nullable = false))
    )
    var listPrice: Money,

    /**
     * Tax rate percentage (e.g., 15.00 for 15% VAT).
     */
    @Column(name = "tax_rate", nullable = false)
    var taxRate: BigDecimal = BigDecimal("15.00"),

    /**
     * Stock-based pricing rules (different price when low/out of stock).
     */
    @Embedded
    var stockPricing: StockPricing? = null,

    // === INVENTORY (for GOODS only) ===

    /**
     * Current stock quantity. Null means unlimited (for services).
     */
    @Column(name = "stock_quantity")
    var stockQuantity: Int? = null,

    /**
     * Whether to track inventory for this product.
     */
    @Column(name = "track_inventory", nullable = false)
    var trackInventory: Boolean = false,

    // === EXPIRATION (for perishables) ===

    /**
     * Whether this product has expiration tracking.
     */
    @Column(name = "has_expiration", nullable = false)
    var hasExpiration: Boolean = false,

    /**
     * Number of days until expiration from purchase date.
     */
    @Column(name = "expiration_days")
    var expirationDays: Int? = null,

    // === ZONE ACCESS ===

    /**
     * Facility zones this product grants access to.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_zone_access", joinColumns = [JoinColumn(name = "product_id")])
    @Enumerated(EnumType.STRING)
    @Column(name = "zone_type")
    var zoneAccess: MutableSet<ZoneAccessType> = mutableSetOf(),

    /**
     * How many days access is granted for. Null means permanent.
     */
    @Column(name = "access_duration_days")
    var accessDurationDays: Int? = null,

    // === RESTRICTIONS ===

    /**
     * Whether this product can only be purchased once per member.
     */
    @Column(name = "is_single_use", nullable = false)
    var isSingleUse: Boolean = false,

    /**
     * Maximum quantity allowed per order. Null means unlimited.
     */
    @Column(name = "max_quantity_per_order")
    var maxQuantityPerOrder: Int? = null,

    // === DISPLAY ===

    /**
     * Display order for sorting products.
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    /**
     * URL to product image.
     */
    @Column(name = "image_url", length = 500)
    var imageUrl: String? = null

) : BaseEntity(id) {

    // === STATUS TRANSITIONS ===

    /**
     * Activate a product (from DRAFT or INACTIVE).
     * Cannot activate discontinued products.
     */
    fun activate() {
        require(status != ProductStatus.DISCONTINUED) { "Cannot activate discontinued product" }
        status = ProductStatus.ACTIVE
    }

    /**
     * Deactivate a product (temporarily unavailable).
     */
    fun deactivate() {
        status = ProductStatus.INACTIVE
    }

    /**
     * Discontinue a product (no longer sold).
     */
    fun discontinue() {
        status = ProductStatus.DISCONTINUED
    }

    /**
     * Publish a draft product (make it active).
     */
    fun publish() {
        require(status == ProductStatus.DRAFT) { "Only draft products can be published" }
        status = ProductStatus.ACTIVE
    }

    // === PRICING LOGIC ===

    /**
     * Get the effective price based on stock levels.
     * Returns low stock price if below threshold, out of stock price if depleted,
     * or list price otherwise.
     */
    fun getEffectivePrice(): Money {
        if (!trackInventory || stockQuantity == null || stockPricing == null) {
            return listPrice
        }

        val qty = stockQuantity!!
        val pricing = stockPricing!!

        return when {
            qty == 0 && pricing.outOfStockPrice != null -> pricing.outOfStockPrice!!
            qty <= pricing.lowStockThreshold && pricing.lowStockPrice != null -> pricing.lowStockPrice!!
            else -> listPrice
        }
    }

    /**
     * Check if product is available for sale.
     */
    fun isAvailable(): Boolean {
        if (status != ProductStatus.ACTIVE) return false
        if (!trackInventory) return true
        if (stockQuantity == null) return true
        return stockQuantity!! > 0 || stockPricing?.outOfStockPrice != null
    }

    /**
     * Get gross price including tax.
     */
    fun getGrossPrice(): Money {
        val net = getEffectivePrice()
        val tax = net.amount.multiply(taxRate).divide(BigDecimal("100"), 2, RoundingMode.HALF_UP)
        return Money(net.amount + tax, net.currency)
    }

    // === INVENTORY ===

    /**
     * Deduct stock after a purchase.
     */
    fun deductStock(quantity: Int) {
        if (trackInventory && stockQuantity != null) {
            require(stockQuantity!! >= quantity) { "Insufficient stock" }
            stockQuantity = stockQuantity!! - quantity
        }
    }

    /**
     * Add stock (for restocking or returns).
     */
    fun addStock(quantity: Int) {
        if (trackInventory && stockQuantity != null) {
            stockQuantity = stockQuantity!! + quantity
        }
    }

    // === ZONE ACCESS ===

    /**
     * Check if this product grants any zone access.
     */
    fun grantsAccess(): Boolean = zoneAccess.isNotEmpty()

    /**
     * Check if this product grants access to a specific zone.
     */
    fun grantsAccessTo(zone: ZoneAccessType): Boolean = zoneAccess.contains(zone)

    // === UPDATE ===

    /**
     * Update product details.
     */
    fun update(
        name: LocalizedText? = null,
        description: LocalizedText? = null,
        sku: String? = null,
        category: ProductCategory? = null,
        listPrice: Money? = null,
        taxRate: BigDecimal? = null,
        stockPricing: StockPricing? = null,
        stockQuantity: Int? = null,
        trackInventory: Boolean? = null,
        hasExpiration: Boolean? = null,
        expirationDays: Int? = null,
        zoneAccess: Set<ZoneAccessType>? = null,
        accessDurationDays: Int? = null,
        isSingleUse: Boolean? = null,
        maxQuantityPerOrder: Int? = null,
        sortOrder: Int? = null,
        imageUrl: String? = null
    ) {
        name?.let { this.name = it }
        description?.let { this.description = it }
        sku?.let { this.sku = it }
        category?.let { this.category = it }
        listPrice?.let { this.listPrice = it }
        taxRate?.let { this.taxRate = it }
        stockPricing?.let { this.stockPricing = it }
        stockQuantity?.let { this.stockQuantity = it }
        trackInventory?.let { this.trackInventory = it }
        hasExpiration?.let { this.hasExpiration = it }
        expirationDays?.let { this.expirationDays = it }
        zoneAccess?.let { this.zoneAccess = it.toMutableSet() }
        accessDurationDays?.let { this.accessDurationDays = it }
        isSingleUse?.let { this.isSingleUse = it }
        maxQuantityPerOrder?.let { this.maxQuantityPerOrder = it }
        sortOrder?.let { this.sortOrder = it }
        imageUrl?.let { this.imageUrl = it }
    }
}
