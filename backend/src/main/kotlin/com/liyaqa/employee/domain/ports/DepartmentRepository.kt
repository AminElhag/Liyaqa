package com.liyaqa.employee.domain.ports

import com.liyaqa.employee.domain.model.Department
import com.liyaqa.employee.domain.model.DepartmentStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Department entity.
 */
interface DepartmentRepository {

    fun save(department: Department): Department

    fun findById(id: UUID): Optional<Department>

    fun findAll(): List<Department>

    fun findAll(pageable: Pageable): Page<Department>

    fun findAllByIds(ids: List<UUID>): List<Department>

    fun findByStatus(status: DepartmentStatus): List<Department>

    fun findByParentDepartmentId(parentId: UUID): List<Department>

    /**
     * Find all root departments (departments with no parent).
     */
    fun findRootDepartments(): List<Department>

    fun existsById(id: UUID): Boolean

    fun existsByParentDepartmentId(parentId: UUID): Boolean

    fun deleteById(id: UUID)

    fun count(): Long
}
