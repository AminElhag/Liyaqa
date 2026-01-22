package com.liyaqa.shop.api

import com.liyaqa.shop.application.services.ProductService
import com.liyaqa.shop.domain.model.ProductStatus
import com.liyaqa.shop.domain.model.ProductType
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * REST controller for products.
 */
@RestController
@RequestMapping("/api/products")
class ProductController(
    private val productService: ProductService
) {

    /**
     * Get all products with optional filtering.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('products_view')")
    fun getProducts(
        @RequestParam status: ProductStatus?,
        @RequestParam type: ProductType?,
        @RequestParam categoryId: UUID?,
        @RequestParam search: String?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<ProductResponse>> {
        val products = when {
            search != null -> productService.search(search, pageable)
            status != null && type != null -> productService.getByStatusAndType(status, type, pageable)
            status != null -> productService.getByStatus(status, pageable)
            type != null -> productService.getByType(type, pageable)
            categoryId != null -> productService.getByCategory(categoryId, pageable)
            else -> productService.getAll(pageable)
        }
        return ResponseEntity.ok(products.map { ProductResponse.from(it) })
    }

    /**
     * Get product by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('products_view')")
    fun getProduct(@PathVariable id: UUID): ResponseEntity<ProductResponse> {
        val product = productService.getById(id)
        val bundleItems = if (product.productType == ProductType.BUNDLE) {
            productService.getBundleItems(id)
        } else null
        return ResponseEntity.ok(ProductResponse.from(product, bundleItems))
    }

    /**
     * Get product statistics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('products_view')")
    fun getStats(): ResponseEntity<ProductStatsResponse> {
        val stats = productService.getStats()
        return ResponseEntity.ok(ProductStatsResponse.from(stats))
    }

    /**
     * Create a new product.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('products_create')")
    fun createProduct(
        @Valid @RequestBody request: CreateProductRequest
    ): ResponseEntity<ProductResponse> {
        val product = productService.create(request.toCommand())
        val bundleItems = if (product.productType == ProductType.BUNDLE) {
            productService.getBundleItems(product.id)
        } else null
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ProductResponse.from(product, bundleItems))
    }

    /**
     * Update a product.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('products_update')")
    fun updateProduct(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateProductRequest
    ): ResponseEntity<ProductResponse> {
        val existingProduct = productService.getById(id)
        val product = productService.update(id, request.toCommand(existingProduct.listPrice.currency))
        val bundleItems = if (product.productType == ProductType.BUNDLE) {
            productService.getBundleItems(product.id)
        } else null
        return ResponseEntity.ok(ProductResponse.from(product, bundleItems))
    }

    /**
     * Delete a product.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('products_delete')")
    fun deleteProduct(@PathVariable id: UUID): ResponseEntity<Void> {
        productService.delete(id)
        return ResponseEntity.noContent().build()
    }

    // === STATUS TRANSITIONS ===

    /**
     * Publish a draft product.
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('products_update')")
    fun publishProduct(@PathVariable id: UUID): ResponseEntity<ProductResponse> {
        val product = productService.publish(id)
        return ResponseEntity.ok(ProductResponse.from(product))
    }

    /**
     * Activate a product.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('products_update')")
    fun activateProduct(@PathVariable id: UUID): ResponseEntity<ProductResponse> {
        val product = productService.activate(id)
        return ResponseEntity.ok(ProductResponse.from(product))
    }

    /**
     * Deactivate a product.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('products_update')")
    fun deactivateProduct(@PathVariable id: UUID): ResponseEntity<ProductResponse> {
        val product = productService.deactivate(id)
        return ResponseEntity.ok(ProductResponse.from(product))
    }

    /**
     * Discontinue a product.
     */
    @PostMapping("/{id}/discontinue")
    @PreAuthorize("hasAuthority('products_update')")
    fun discontinueProduct(@PathVariable id: UUID): ResponseEntity<ProductResponse> {
        val product = productService.discontinue(id)
        return ResponseEntity.ok(ProductResponse.from(product))
    }

    // === INVENTORY OPERATIONS ===

    /**
     * Add stock to a product.
     */
    @PostMapping("/{id}/add-stock")
    @PreAuthorize("hasAuthority('products_update')")
    fun addStock(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AdjustStockRequest
    ): ResponseEntity<ProductResponse> {
        val product = productService.addStock(id, request.quantity)
        return ResponseEntity.ok(ProductResponse.from(product))
    }

    /**
     * Deduct stock from a product.
     */
    @PostMapping("/{id}/deduct-stock")
    @PreAuthorize("hasAuthority('products_update')")
    fun deductStock(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AdjustStockRequest
    ): ResponseEntity<ProductResponse> {
        val product = productService.deductStock(id, request.quantity)
        return ResponseEntity.ok(ProductResponse.from(product))
    }

    // === BUNDLE OPERATIONS ===

    /**
     * Get bundle items for a bundle product.
     */
    @GetMapping("/{id}/bundle-items")
    @PreAuthorize("hasAuthority('products_view')")
    fun getBundleItems(@PathVariable id: UUID): ResponseEntity<List<BundleItemResponse>> {
        val items = productService.getBundleItems(id)
        return ResponseEntity.ok(items.map { BundleItemResponse.from(it) })
    }
}
