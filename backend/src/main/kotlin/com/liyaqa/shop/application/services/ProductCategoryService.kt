package com.liyaqa.shop.application.services

import com.liyaqa.shop.application.commands.CreateProductCategoryCommand
import com.liyaqa.shop.application.commands.UpdateProductCategoryCommand
import com.liyaqa.shop.domain.model.Department
import com.liyaqa.shop.domain.model.ProductCategory
import com.liyaqa.shop.domain.ports.ProductCategoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Application service for managing product categories.
 */
@Service
@Transactional
class ProductCategoryService(
    private val repository: ProductCategoryRepository
) {

    /**
     * Create a new product category.
     */
    fun create(command: CreateProductCategoryCommand): ProductCategory {
        val category = ProductCategory(
            name = command.name,
            description = command.description,
            icon = command.icon,
            department = command.department,
            customDepartment = command.customDepartment,
            sortOrder = command.sortOrder
        )
        return repository.save(category)
    }

    /**
     * Get a category by ID.
     */
    @Transactional(readOnly = true)
    fun getById(id: UUID): ProductCategory {
        return repository.findById(id)
            .orElseThrow { NoSuchElementException("Product category not found: $id") }
    }

    /**
     * Get all categories with pagination.
     */
    @Transactional(readOnly = true)
    fun getAll(pageable: Pageable): Page<ProductCategory> {
        return repository.findAll(pageable)
    }

    /**
     * Get categories by department.
     */
    @Transactional(readOnly = true)
    fun getByDepartment(department: Department, pageable: Pageable): Page<ProductCategory> {
        return repository.findByDepartment(department, pageable)
    }

    /**
     * Get active or inactive categories.
     */
    @Transactional(readOnly = true)
    fun getByActive(isActive: Boolean, pageable: Pageable): Page<ProductCategory> {
        return repository.findByIsActive(isActive, pageable)
    }

    /**
     * Get active categories (convenience method for shop browsing).
     */
    @Transactional(readOnly = true)
    fun getActiveCategories(pageable: Pageable): Page<ProductCategory> {
        return repository.findByIsActive(true, pageable)
    }

    /**
     * Update a category.
     */
    fun update(id: UUID, command: UpdateProductCategoryCommand): ProductCategory {
        val category = getById(id)
        category.update(
            name = command.name,
            description = command.description,
            icon = command.icon,
            department = command.department,
            customDepartment = command.customDepartment,
            sortOrder = command.sortOrder
        )
        return repository.save(category)
    }

    /**
     * Activate a category.
     */
    fun activate(id: UUID): ProductCategory {
        val category = getById(id)
        category.activate()
        return repository.save(category)
    }

    /**
     * Deactivate a category.
     */
    fun deactivate(id: UUID): ProductCategory {
        val category = getById(id)
        category.deactivate()
        return repository.save(category)
    }

    /**
     * Delete a category.
     */
    fun delete(id: UUID) {
        if (!repository.existsById(id)) {
            throw NoSuchElementException("Product category not found: $id")
        }
        repository.deleteById(id)
    }

    /**
     * Get category statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(): CategoryStats {
        val total = repository.count()
        val active = repository.findByIsActive(true, Pageable.unpaged()).totalElements
        val inactive = total - active
        return CategoryStats(
            total = total,
            active = active,
            inactive = inactive
        )
    }
}

data class CategoryStats(
    val total: Long,
    val active: Long,
    val inactive: Long
)
