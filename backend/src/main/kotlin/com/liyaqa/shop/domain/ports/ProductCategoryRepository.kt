package com.liyaqa.shop.domain.ports

import com.liyaqa.shop.domain.model.Department
import com.liyaqa.shop.domain.model.ProductCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ProductCategory aggregate.
 */
interface ProductCategoryRepository {
    fun save(category: ProductCategory): ProductCategory
    fun findById(id: UUID): Optional<ProductCategory>
    fun findAll(pageable: Pageable): Page<ProductCategory>
    fun findByDepartment(department: Department, pageable: Pageable): Page<ProductCategory>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<ProductCategory>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
    fun count(): Long
}
