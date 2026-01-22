package com.liyaqa.employee.domain.ports

import com.liyaqa.employee.domain.model.JobTitle
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for JobTitle entity.
 */
interface JobTitleRepository {

    fun save(jobTitle: JobTitle): JobTitle

    fun findById(id: UUID): Optional<JobTitle>

    fun findAll(): List<JobTitle>

    fun findAll(pageable: Pageable): Page<JobTitle>

    fun findAllByIds(ids: List<UUID>): List<JobTitle>

    fun findByDepartmentId(departmentId: UUID): List<JobTitle>

    /**
     * Find all active job titles.
     */
    fun findActive(): List<JobTitle>

    /**
     * Find active job titles for a specific department.
     */
    fun findActiveByDepartmentId(departmentId: UUID): List<JobTitle>

    fun existsById(id: UUID): Boolean

    fun deleteById(id: UUID)

    fun count(): Long
}
