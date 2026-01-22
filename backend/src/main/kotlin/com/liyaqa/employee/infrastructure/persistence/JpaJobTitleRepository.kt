package com.liyaqa.employee.infrastructure.persistence

import com.liyaqa.employee.domain.model.JobTitle
import com.liyaqa.employee.domain.ports.JobTitleRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for JobTitle entity.
 */
interface SpringDataJobTitleRepository : JpaRepository<JobTitle, UUID> {

    fun findByDepartmentId(departmentId: UUID): List<JobTitle>

    @Query("SELECT jt FROM JobTitle jt WHERE jt.isActive = true ORDER BY jt.sortOrder")
    fun findActive(): List<JobTitle>

    @Query("SELECT jt FROM JobTitle jt WHERE jt.departmentId = :departmentId AND jt.isActive = true ORDER BY jt.sortOrder")
    fun findActiveByDepartmentId(@Param("departmentId") departmentId: UUID): List<JobTitle>
}

/**
 * Adapter implementing JobTitleRepository using Spring Data JPA.
 */
@Repository
class JpaJobTitleRepository(
    private val springDataRepository: SpringDataJobTitleRepository
) : JobTitleRepository {

    override fun save(jobTitle: JobTitle): JobTitle {
        return springDataRepository.save(jobTitle)
    }

    override fun findById(id: UUID): Optional<JobTitle> {
        return springDataRepository.findById(id)
    }

    override fun findAll(): List<JobTitle> {
        return springDataRepository.findAll()
    }

    override fun findAll(pageable: Pageable): Page<JobTitle> {
        return springDataRepository.findAll(pageable)
    }

    override fun findAllByIds(ids: List<UUID>): List<JobTitle> {
        return springDataRepository.findAllById(ids).toList()
    }

    override fun findByDepartmentId(departmentId: UUID): List<JobTitle> {
        return springDataRepository.findByDepartmentId(departmentId)
    }

    override fun findActive(): List<JobTitle> {
        return springDataRepository.findActive()
    }

    override fun findActiveByDepartmentId(departmentId: UUID): List<JobTitle> {
        return springDataRepository.findActiveByDepartmentId(departmentId)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }
}
