package com.liyaqa.shop.api

import com.liyaqa.shop.application.services.ProductCategoryService
import com.liyaqa.shop.domain.model.Department
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
 * REST controller for product categories.
 */
@RestController
@RequestMapping("/api/product-categories")
class ProductCategoryController(
    private val categoryService: ProductCategoryService
) {

    /**
     * Get all categories with optional filtering.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('product_categories_view')")
    fun getCategories(
        @RequestParam department: Department?,
        @RequestParam active: Boolean?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<ProductCategoryResponse>> {
        val categories = when {
            department != null -> categoryService.getByDepartment(department, pageable)
            active != null -> categoryService.getByActive(active, pageable)
            else -> categoryService.getAll(pageable)
        }
        return ResponseEntity.ok(categories.map { ProductCategoryResponse.from(it) })
    }

    /**
     * Get category by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('product_categories_view')")
    fun getCategory(@PathVariable id: UUID): ResponseEntity<ProductCategoryResponse> {
        val category = categoryService.getById(id)
        return ResponseEntity.ok(ProductCategoryResponse.from(category))
    }

    /**
     * Get category statistics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('product_categories_view')")
    fun getStats(): ResponseEntity<CategoryStatsResponse> {
        val stats = categoryService.getStats()
        return ResponseEntity.ok(CategoryStatsResponse.from(stats))
    }

    /**
     * Create a new category.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('product_categories_create')")
    fun createCategory(
        @Valid @RequestBody request: CreateProductCategoryRequest
    ): ResponseEntity<ProductCategoryResponse> {
        val category = categoryService.create(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ProductCategoryResponse.from(category))
    }

    /**
     * Update a category.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('product_categories_update')")
    fun updateCategory(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateProductCategoryRequest
    ): ResponseEntity<ProductCategoryResponse> {
        val category = categoryService.update(id, request.toCommand())
        return ResponseEntity.ok(ProductCategoryResponse.from(category))
    }

    /**
     * Activate a category.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('product_categories_update')")
    fun activateCategory(@PathVariable id: UUID): ResponseEntity<ProductCategoryResponse> {
        val category = categoryService.activate(id)
        return ResponseEntity.ok(ProductCategoryResponse.from(category))
    }

    /**
     * Deactivate a category.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('product_categories_update')")
    fun deactivateCategory(@PathVariable id: UUID): ResponseEntity<ProductCategoryResponse> {
        val category = categoryService.deactivate(id)
        return ResponseEntity.ok(ProductCategoryResponse.from(category))
    }

    /**
     * Delete a category.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('product_categories_delete')")
    fun deleteCategory(@PathVariable id: UUID): ResponseEntity<Void> {
        categoryService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
