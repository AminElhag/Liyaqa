package com.liyaqa.shop.application.services

import com.liyaqa.shop.application.commands.BundleItemCommand
import com.liyaqa.shop.application.commands.CreateProductCommand
import com.liyaqa.shop.application.commands.UpdateProductCommand
import com.liyaqa.shop.domain.model.BundleItem
import com.liyaqa.shop.domain.model.Product
import com.liyaqa.shop.domain.model.ProductStatus
import com.liyaqa.shop.domain.model.ProductType
import com.liyaqa.shop.domain.ports.MemberProductAccess
import com.liyaqa.shop.domain.ports.ProductCategoryRepository
import com.liyaqa.shop.domain.ports.ProductRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Application service for managing products.
 */
@Service
@Transactional
class ProductService(
    private val productRepository: ProductRepository,
    private val categoryRepository: ProductCategoryRepository
) {

    // === PRODUCT CRUD ===

    /**
     * Create a new product.
     */
    fun create(command: CreateProductCommand): Product {
        // Validate SKU uniqueness
        command.sku?.let {
            require(!productRepository.existsBySku(it)) { "SKU already exists: $it" }
        }

        // Get category if specified
        val category = command.categoryId?.let {
            categoryRepository.findById(it)
                .orElseThrow { NoSuchElementException("Category not found: $it") }
        }

        val product = Product(
            name = command.name,
            description = command.description,
            sku = command.sku,
            productType = command.productType,
            category = category,
            listPrice = command.listPrice,
            taxRate = command.taxRate,
            stockPricing = command.stockPricing,
            stockQuantity = command.stockQuantity,
            trackInventory = command.trackInventory,
            hasExpiration = command.hasExpiration,
            expirationDays = command.expirationDays,
            zoneAccess = command.zoneAccess.toMutableSet(),
            accessDurationDays = command.accessDurationDays,
            isSingleUse = command.isSingleUse,
            maxQuantityPerOrder = command.maxQuantityPerOrder,
            sortOrder = command.sortOrder,
            imageUrl = command.imageUrl
        )

        val savedProduct = productRepository.save(product)

        // Add bundle items if this is a bundle
        if (command.productType == ProductType.BUNDLE && !command.bundleItems.isNullOrEmpty()) {
            saveBundleItems(savedProduct, command.bundleItems)
        }

        return savedProduct
    }

    /**
     * Get a product by ID.
     */
    @Transactional(readOnly = true)
    fun getById(id: UUID): Product {
        return productRepository.findById(id)
            .orElseThrow { NoSuchElementException("Product not found: $id") }
    }

    /**
     * Get all products with pagination.
     */
    @Transactional(readOnly = true)
    fun getAll(pageable: Pageable): Page<Product> {
        return productRepository.findAll(pageable)
    }

    /**
     * Get products by status.
     */
    @Transactional(readOnly = true)
    fun getByStatus(status: ProductStatus, pageable: Pageable): Page<Product> {
        return productRepository.findByStatus(status, pageable)
    }

    /**
     * Get products by type.
     */
    @Transactional(readOnly = true)
    fun getByType(type: ProductType, pageable: Pageable): Page<Product> {
        return productRepository.findByProductType(type, pageable)
    }

    /**
     * Get products by category.
     */
    @Transactional(readOnly = true)
    fun getByCategory(categoryId: UUID, pageable: Pageable): Page<Product> {
        return productRepository.findByCategoryId(categoryId, pageable)
    }

    /**
     * Get products by category and status.
     */
    @Transactional(readOnly = true)
    fun getByCategoryAndStatus(categoryId: UUID, status: ProductStatus, pageable: Pageable): Page<Product> {
        return productRepository.findByCategoryIdAndStatus(categoryId, status, pageable)
    }

    /**
     * Get products by status and type.
     */
    @Transactional(readOnly = true)
    fun getByStatusAndType(status: ProductStatus, type: ProductType, pageable: Pageable): Page<Product> {
        return productRepository.findByStatusAndProductType(status, type, pageable)
    }

    /**
     * Search products by name.
     */
    @Transactional(readOnly = true)
    fun search(query: String, pageable: Pageable): Page<Product> {
        return productRepository.searchByName(query, pageable)
    }

    /**
     * Search products by name and status.
     */
    @Transactional(readOnly = true)
    fun search(query: String, status: ProductStatus, pageable: Pageable): Page<Product> {
        return productRepository.searchByNameAndStatus(query, status, pageable)
    }

    /**
     * Update a product.
     */
    fun update(id: UUID, command: UpdateProductCommand): Product {
        val product = getById(id)

        // Validate SKU uniqueness if changing
        command.sku?.let { newSku ->
            if (newSku != product.sku && productRepository.existsBySku(newSku)) {
                throw IllegalArgumentException("SKU already exists: $newSku")
            }
        }

        // Get new category if specified
        val category = command.categoryId?.let {
            categoryRepository.findById(it)
                .orElseThrow { NoSuchElementException("Category not found: $it") }
        }

        product.update(
            name = command.name,
            description = command.description,
            sku = command.sku,
            category = category ?: product.category,
            listPrice = command.listPrice,
            taxRate = command.taxRate,
            stockPricing = command.stockPricing,
            stockQuantity = command.stockQuantity,
            trackInventory = command.trackInventory,
            hasExpiration = command.hasExpiration,
            expirationDays = command.expirationDays,
            zoneAccess = command.zoneAccess,
            accessDurationDays = command.accessDurationDays,
            isSingleUse = command.isSingleUse,
            maxQuantityPerOrder = command.maxQuantityPerOrder,
            sortOrder = command.sortOrder,
            imageUrl = command.imageUrl
        )

        val savedProduct = productRepository.save(product)

        // Update bundle items if this is a bundle
        if (product.productType == ProductType.BUNDLE && command.bundleItems != null) {
            productRepository.deleteBundleItemsByBundleId(id)
            saveBundleItems(savedProduct, command.bundleItems)
        }

        return savedProduct
    }

    /**
     * Delete a product.
     */
    fun delete(id: UUID) {
        val product = getById(id)

        // Delete bundle items first if it's a bundle
        if (product.productType == ProductType.BUNDLE) {
            productRepository.deleteBundleItemsByBundleId(id)
        }

        productRepository.deleteById(id)
    }

    // === STATUS TRANSITIONS ===

    /**
     * Publish a draft product.
     */
    fun publish(id: UUID): Product {
        val product = getById(id)
        product.publish()
        return productRepository.save(product)
    }

    /**
     * Activate a product.
     */
    fun activate(id: UUID): Product {
        val product = getById(id)
        product.activate()
        return productRepository.save(product)
    }

    /**
     * Deactivate a product.
     */
    fun deactivate(id: UUID): Product {
        val product = getById(id)
        product.deactivate()
        return productRepository.save(product)
    }

    /**
     * Discontinue a product.
     */
    fun discontinue(id: UUID): Product {
        val product = getById(id)
        product.discontinue()
        return productRepository.save(product)
    }

    // === BUNDLE OPERATIONS ===

    /**
     * Get bundle items for a product.
     */
    @Transactional(readOnly = true)
    fun getBundleItems(bundleId: UUID): List<BundleItem> {
        val product = getById(bundleId)
        require(product.productType == ProductType.BUNDLE) { "Product is not a bundle" }
        return productRepository.findBundleItems(bundleId)
    }

    private fun saveBundleItems(bundle: Product, items: List<BundleItemCommand>) {
        items.forEachIndexed { index, itemCmd ->
            val includedProduct = productRepository.findById(itemCmd.productId)
                .orElseThrow { NoSuchElementException("Bundle item product not found: ${itemCmd.productId}") }

            require(includedProduct.productType != ProductType.BUNDLE) { "Cannot nest bundles" }

            productRepository.saveBundleItem(
                BundleItem(
                    bundle = bundle,
                    product = includedProduct,
                    quantity = itemCmd.quantity,
                    sortOrder = index
                )
            )
        }
    }

    // === INVENTORY OPERATIONS ===

    /**
     * Add stock to a product.
     */
    fun addStock(id: UUID, quantity: Int): Product {
        require(quantity > 0) { "Quantity must be positive" }
        val product = getById(id)
        product.addStock(quantity)
        return productRepository.save(product)
    }

    /**
     * Deduct stock from a product.
     */
    fun deductStock(id: UUID, quantity: Int): Product {
        require(quantity > 0) { "Quantity must be positive" }
        val product = getById(id)
        product.deductStock(quantity)
        return productRepository.save(product)
    }

    // === PURCHASE VALIDATION & PROCESSING ===

    /**
     * Validate a purchase before processing.
     */
    fun validatePurchase(memberId: UUID, productId: UUID, quantity: Int) {
        val product = getById(productId)

        // Check availability
        require(product.isAvailable()) { "Product is not available" }

        // Check single-use restriction
        if (product.isSingleUse) {
            require(!productRepository.hasMemberPurchased(memberId, productId)) {
                "This product can only be purchased once"
            }
        }

        // Check max quantity
        product.maxQuantityPerOrder?.let { max ->
            require(quantity <= max) { "Maximum quantity per order is $max" }
        }

        // Check stock for goods
        if (product.trackInventory && product.stockQuantity != null) {
            require(product.stockQuantity!! >= quantity) {
                "Insufficient stock. Available: ${product.stockQuantity}"
            }
        }
    }

    /**
     * Process a purchase after payment.
     */
    fun processPurchase(memberId: UUID, productId: UUID, quantity: Int, invoiceId: UUID) {
        val product = getById(productId)

        // Deduct stock
        if (product.trackInventory) {
            product.deductStock(quantity)
            productRepository.save(product)
        }

        // Record purchase for single-use tracking
        if (product.isSingleUse) {
            productRepository.recordMemberPurchase(memberId, productId, invoiceId)
        }

        // Grant zone access
        if (product.grantsAccess()) {
            val expiresAt = product.accessDurationDays?.let {
                Instant.now().plus(it.toLong(), ChronoUnit.DAYS)
            }
            product.zoneAccess.forEach { zone ->
                productRepository.grantMemberAccess(memberId, productId, zone, expiresAt, invoiceId)
            }
        }
    }

    // === MEMBER ACCESS QUERIES ===

    /**
     * Get a member's active product access.
     */
    @Transactional(readOnly = true)
    fun getMemberAccess(memberId: UUID): List<MemberProductAccess> {
        return productRepository.getMemberActiveAccess(memberId)
    }

    // === STATISTICS ===

    /**
     * Get product statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(): ProductStats {
        val total = productRepository.count()
        val active = productRepository.findByStatus(ProductStatus.ACTIVE, Pageable.unpaged()).totalElements
        val inactive = productRepository.findByStatus(ProductStatus.INACTIVE, Pageable.unpaged()).totalElements
        val draft = productRepository.findByStatus(ProductStatus.DRAFT, Pageable.unpaged()).totalElements
        val discontinued = productRepository.findByStatus(ProductStatus.DISCONTINUED, Pageable.unpaged()).totalElements

        val goods = productRepository.findByProductType(ProductType.GOODS, Pageable.unpaged()).totalElements
        val services = productRepository.findByProductType(ProductType.SERVICE, Pageable.unpaged()).totalElements
        val bundles = productRepository.findByProductType(ProductType.BUNDLE, Pageable.unpaged()).totalElements

        return ProductStats(
            total = total,
            active = active,
            inactive = inactive,
            draft = draft,
            discontinued = discontinued,
            goods = goods,
            services = services,
            bundles = bundles
        )
    }
}

data class ProductStats(
    val total: Long,
    val active: Long,
    val inactive: Long,
    val draft: Long,
    val discontinued: Long,
    val goods: Long,
    val services: Long,
    val bundles: Long
)
