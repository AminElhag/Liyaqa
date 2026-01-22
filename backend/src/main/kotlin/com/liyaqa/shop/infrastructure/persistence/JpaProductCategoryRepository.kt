package com.liyaqa.shop.infrastructure.persistence

import com.liyaqa.shop.domain.model.Department
import com.liyaqa.shop.domain.model.ProductCategory
import com.liyaqa.shop.domain.ports.ProductCategoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for ProductCategory.
 */
interface SpringDataProductCategoryRepository : JpaRepository<ProductCategory, UUID> {
    fun findByDepartment(department: Department, pageable: Pageable): Page<ProductCategory>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<ProductCategory>
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaProductCategoryRepository(
    private val springDataRepository: SpringDataProductCategoryRepository
) : ProductCategoryRepository {

    override fun save(category: ProductCategory): ProductCategory {
        return springDataRepository.save(category)
    }

    override fun findById(id: UUID): Optional<ProductCategory> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<ProductCategory> {
        return springDataRepository.findAll(pageable)
    }

    override fun findByDepartment(department: Department, pageable: Pageable): Page<ProductCategory> {
        return springDataRepository.findByDepartment(department, pageable)
    }

    override fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<ProductCategory> {
        return springDataRepository.findByIsActive(isActive, pageable)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }
}
