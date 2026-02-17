package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.ClassCategory
import com.liyaqa.scheduling.domain.ports.ClassCategoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataClassCategoryRepository : JpaRepository<ClassCategory, UUID> {
    fun findByIsActiveTrue(): List<ClassCategory>
}

@Repository
class JpaClassCategoryRepository(
    private val springDataRepository: SpringDataClassCategoryRepository
) : ClassCategoryRepository {

    override fun save(category: ClassCategory): ClassCategory =
        springDataRepository.save(category)

    override fun findById(id: UUID): Optional<ClassCategory> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ClassCategory> =
        springDataRepository.findAll(pageable)

    override fun findByIsActiveTrue(): List<ClassCategory> =
        springDataRepository.findByIsActiveTrue()

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()
}
