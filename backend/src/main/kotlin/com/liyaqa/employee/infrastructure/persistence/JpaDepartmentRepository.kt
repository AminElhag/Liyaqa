package com.liyaqa.employee.infrastructure.persistence

import com.liyaqa.employee.domain.model.Department
import com.liyaqa.employee.domain.model.DepartmentStatus
import com.liyaqa.employee.domain.ports.DepartmentRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for Department entity.
 */
interface SpringDataDepartmentRepository : JpaRepository<Department, UUID> {

    fun findByStatus(status: DepartmentStatus): List<Department>

    fun findByParentDepartmentId(parentId: UUID): List<Department>

    @Query("SELECT d FROM Department d WHERE d.parentDepartmentId IS NULL ORDER BY d.sortOrder")
    fun findRootDepartments(): List<Department>

    fun existsByParentDepartmentId(parentId: UUID): Boolean
}

/**
 * Adapter implementing DepartmentRepository using Spring Data JPA.
 */
@Repository
class JpaDepartmentRepository(
    private val springDataRepository: SpringDataDepartmentRepository
) : DepartmentRepository {

    override fun save(department: Department): Department {
        return springDataRepository.save(department)
    }

    override fun findById(id: UUID): Optional<Department> {
        return springDataRepository.findById(id)
    }

    override fun findAll(): List<Department> {
        return springDataRepository.findAll()
    }

    override fun findAll(pageable: Pageable): Page<Department> {
        return springDataRepository.findAll(pageable)
    }

    override fun findAllByIds(ids: List<UUID>): List<Department> {
        return springDataRepository.findAllById(ids).toList()
    }

    override fun findByStatus(status: DepartmentStatus): List<Department> {
        return springDataRepository.findByStatus(status)
    }

    override fun findByParentDepartmentId(parentId: UUID): List<Department> {
        return springDataRepository.findByParentDepartmentId(parentId)
    }

    override fun findRootDepartments(): List<Department> {
        return springDataRepository.findRootDepartments()
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun existsByParentDepartmentId(parentId: UUID): Boolean {
        return springDataRepository.existsByParentDepartmentId(parentId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }
}
