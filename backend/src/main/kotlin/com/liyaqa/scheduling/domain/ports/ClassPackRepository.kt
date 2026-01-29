package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.ClassPack
import com.liyaqa.scheduling.domain.model.ClassPackStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for ClassPack entities.
 */
interface ClassPackRepository {
    fun save(classPack: ClassPack): ClassPack
    fun findById(id: UUID): Optional<ClassPack>
    fun findAll(pageable: Pageable): Page<ClassPack>
    fun findByStatus(status: ClassPackStatus, pageable: Pageable): Page<ClassPack>
    fun findByStatusOrderBySortOrder(status: ClassPackStatus): List<ClassPack>
    fun findAllOrderBySortOrder(): List<ClassPack>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: ClassPackStatus): Long
}
