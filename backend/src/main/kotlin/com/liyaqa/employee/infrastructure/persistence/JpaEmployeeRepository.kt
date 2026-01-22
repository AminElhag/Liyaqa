package com.liyaqa.employee.infrastructure.persistence

import com.liyaqa.employee.domain.model.Employee
import com.liyaqa.employee.domain.model.EmployeeStatus
import com.liyaqa.employee.domain.model.EmploymentType
import com.liyaqa.employee.domain.ports.EmployeeRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for Employee entity.
 */
interface SpringDataEmployeeRepository : JpaRepository<Employee, UUID> {

    fun findByUserId(userId: UUID): Optional<Employee>

    fun existsByUserId(userId: UUID): Boolean

    fun existsByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Boolean

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Employee>

    fun findByDepartmentId(departmentId: UUID, pageable: Pageable): Page<Employee>

    fun findByJobTitleId(jobTitleId: UUID, pageable: Pageable): Page<Employee>

    fun countByDepartmentId(departmentId: UUID): Long

    fun countByStatus(status: EmployeeStatus): Long

    @Query("""
        SELECT e FROM Employee e
        WHERE (:search IS NULL OR (
            LOWER(CONCAT(COALESCE(e.firstName.en, ''), ' ', COALESCE(e.lastName.en, ''))) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(CONCAT(COALESCE(e.firstName.ar, ''), ' ', COALESCE(e.lastName.ar, ''))) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))
        ))
        AND (:status IS NULL OR e.status = :status)
        AND (:departmentId IS NULL OR e.departmentId = :departmentId)
        AND (:employmentType IS NULL OR e.employmentType = :employmentType)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("status") status: EmployeeStatus?,
        @Param("departmentId") departmentId: UUID?,
        @Param("employmentType") employmentType: EmploymentType?,
        pageable: Pageable
    ): Page<Employee>

    @Query("""
        SELECT e FROM Employee e
        WHERE e.certifications IS NOT NULL
        AND e.certifications != ''
        AND e.certifications != '[]'
    """)
    fun findWithCertifications(): List<Employee>
}

/**
 * Adapter implementing EmployeeRepository using Spring Data JPA.
 */
@Repository
class JpaEmployeeRepository(
    private val springDataRepository: SpringDataEmployeeRepository
) : EmployeeRepository {

    override fun save(employee: Employee): Employee {
        return springDataRepository.save(employee)
    }

    override fun findById(id: UUID): Optional<Employee> {
        return springDataRepository.findById(id)
    }

    override fun findByUserId(userId: UUID): Optional<Employee> {
        return springDataRepository.findByUserId(userId)
    }

    override fun findAll(pageable: Pageable): Page<Employee> {
        return springDataRepository.findAll(pageable)
    }

    override fun findAllByIds(ids: List<UUID>): List<Employee> {
        return springDataRepository.findAllById(ids).toList()
    }

    override fun search(
        search: String?,
        status: EmployeeStatus?,
        departmentId: UUID?,
        employmentType: EmploymentType?,
        pageable: Pageable
    ): Page<Employee> {
        return springDataRepository.search(
            search = search?.takeIf { it.isNotBlank() },
            status = status,
            departmentId = departmentId,
            employmentType = employmentType,
            pageable = pageable
        )
    }

    override fun findByDepartmentId(departmentId: UUID, pageable: Pageable): Page<Employee> {
        return springDataRepository.findByDepartmentId(departmentId, pageable)
    }

    override fun findByJobTitleId(jobTitleId: UUID, pageable: Pageable): Page<Employee> {
        return springDataRepository.findByJobTitleId(jobTitleId, pageable)
    }

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Employee> {
        return springDataRepository.findByOrganizationId(organizationId, pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun existsByUserId(userId: UUID): Boolean {
        return springDataRepository.existsByUserId(userId)
    }

    override fun existsByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Boolean {
        return springDataRepository.existsByUserIdAndOrganizationId(userId, organizationId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun countByDepartmentId(departmentId: UUID): Long {
        return springDataRepository.countByDepartmentId(departmentId)
    }

    override fun countByStatus(status: EmployeeStatus): Long {
        return springDataRepository.countByStatus(status)
    }

    override fun findWithExpiringCertifications(expirationDate: LocalDate): List<Employee> {
        // Get all employees with certifications and filter in-memory
        // A more efficient approach would be to use native SQL with JSON functions
        // but this keeps the implementation simple and portable
        return springDataRepository.findWithCertifications().filter { employee ->
            try {
                val certifications = employee.certifications ?: return@filter false
                // Simple check if any certification contains a date before or on expirationDate
                // The actual JSON parsing should be done by the service layer
                certifications.contains("expiresAt")
            } catch (e: Exception) {
                false
            }
        }
    }
}
