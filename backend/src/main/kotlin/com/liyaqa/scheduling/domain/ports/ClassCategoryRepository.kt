package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.ClassCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface ClassCategoryRepository {
    fun save(category: ClassCategory): ClassCategory
    fun findById(id: UUID): Optional<ClassCategory>
    fun findAll(pageable: Pageable): Page<ClassCategory>
    fun findByIsActiveTrue(): List<ClassCategory>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
}
