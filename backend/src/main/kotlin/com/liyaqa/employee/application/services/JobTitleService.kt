package com.liyaqa.employee.application.services

import com.liyaqa.employee.application.commands.CreateJobTitleCommand
import com.liyaqa.employee.application.commands.UpdateJobTitleCommand
import com.liyaqa.employee.domain.model.JobTitle
import com.liyaqa.employee.domain.ports.DepartmentRepository
import com.liyaqa.employee.domain.ports.JobTitleRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing job titles.
 *
 * Handles:
 * - Job title CRUD operations
 * - Activation/deactivation
 * - Department association
 */
@Service
@Transactional
class JobTitleService(
    private val jobTitleRepository: JobTitleRepository,
    private val departmentRepository: DepartmentRepository
) {
    private val logger = LoggerFactory.getLogger(JobTitleService::class.java)

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new job title.
     */
    fun createJobTitle(command: CreateJobTitleCommand): JobTitle {
        // Verify department exists if specified
        command.departmentId?.let { deptId ->
            require(departmentRepository.existsById(deptId)) {
                "Department not found with id: $deptId"
            }
        }

        val jobTitle = JobTitle.create(
            name = command.name,
            description = command.description,
            departmentId = command.departmentId,
            defaultRole = command.defaultRole,
            sortOrder = command.sortOrder
        )

        val saved = jobTitleRepository.save(jobTitle)
        logger.info("Created job title ${saved.id}: ${saved.name.en}")
        return saved
    }

    /**
     * Get job title by ID.
     */
    @Transactional(readOnly = true)
    fun getJobTitle(id: UUID): JobTitle {
        return jobTitleRepository.findById(id)
            .orElseThrow { NoSuchElementException("Job title not found with id: $id") }
    }

    /**
     * Get all job titles.
     */
    @Transactional(readOnly = true)
    fun getAllJobTitles(): List<JobTitle> {
        return jobTitleRepository.findAll()
    }

    /**
     * Get all job titles with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllJobTitles(pageable: Pageable): Page<JobTitle> {
        return jobTitleRepository.findAll(pageable)
    }

    /**
     * Get active job titles.
     */
    @Transactional(readOnly = true)
    fun getActiveJobTitles(): List<JobTitle> {
        return jobTitleRepository.findActive()
    }

    /**
     * Get job titles by department.
     */
    @Transactional(readOnly = true)
    fun getJobTitlesByDepartment(departmentId: UUID): List<JobTitle> {
        return jobTitleRepository.findByDepartmentId(departmentId)
    }

    /**
     * Get active job titles by department.
     */
    @Transactional(readOnly = true)
    fun getActiveJobTitlesByDepartment(departmentId: UUID): List<JobTitle> {
        return jobTitleRepository.findActiveByDepartmentId(departmentId)
    }

    /**
     * Update a job title.
     */
    fun updateJobTitle(id: UUID, command: UpdateJobTitleCommand): JobTitle {
        val jobTitle = getJobTitle(id)

        command.name?.let { jobTitle.name = it }
        command.description?.let { jobTitle.description = it }
        command.departmentId?.let { deptId ->
            require(departmentRepository.existsById(deptId)) {
                "Department not found with id: $deptId"
            }
            jobTitle.setDepartment(deptId)
        }
        command.defaultRole?.let { jobTitle.setRole(it) }
        command.sortOrder?.let { jobTitle.sortOrder = it }

        val updated = jobTitleRepository.save(jobTitle)
        logger.info("Updated job title $id")
        return updated
    }

    /**
     * Delete a job title.
     */
    fun deleteJobTitle(id: UUID) {
        require(jobTitleRepository.existsById(id)) {
            "Job title not found with id: $id"
        }

        jobTitleRepository.deleteById(id)
        logger.info("Deleted job title $id")
    }

    // ==================== STATUS MANAGEMENT ====================

    fun activateJobTitle(id: UUID): JobTitle {
        val jobTitle = getJobTitle(id)
        jobTitle.activate()
        val updated = jobTitleRepository.save(jobTitle)
        logger.info("Activated job title $id")
        return updated
    }

    fun deactivateJobTitle(id: UUID): JobTitle {
        val jobTitle = getJobTitle(id)
        jobTitle.deactivate()
        val updated = jobTitleRepository.save(jobTitle)
        logger.info("Deactivated job title $id")
        return updated
    }

    // ==================== STATISTICS ====================

    @Transactional(readOnly = true)
    fun getJobTitleCount(): Long {
        return jobTitleRepository.count()
    }
}
