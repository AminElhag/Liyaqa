package com.liyaqa.employee.domain.ports

import com.liyaqa.employee.domain.model.Employee
import com.liyaqa.employee.domain.model.EmployeeStatus
import com.liyaqa.employee.domain.model.EmploymentType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Employee aggregate.
 */
interface EmployeeRepository {

    fun save(employee: Employee): Employee

    fun findById(id: UUID): Optional<Employee>

    fun findByUserId(userId: UUID): Optional<Employee>

    fun findAll(pageable: Pageable): Page<Employee>

    fun findAllByIds(ids: List<UUID>): List<Employee>

    /**
     * Search employees with optional filters.
     *
     * @param search Partial match on name or email
     * @param status Filter by employee status
     * @param departmentId Filter by department
     * @param employmentType Filter by employment type
     * @param pageable Pagination and sorting
     */
    fun search(
        search: String?,
        status: EmployeeStatus?,
        departmentId: UUID?,
        employmentType: EmploymentType?,
        pageable: Pageable
    ): Page<Employee>

    fun findByDepartmentId(departmentId: UUID, pageable: Pageable): Page<Employee>

    fun findByJobTitleId(jobTitleId: UUID, pageable: Pageable): Page<Employee>

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Employee>

    fun existsById(id: UUID): Boolean

    fun existsByUserId(userId: UUID): Boolean

    fun existsByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Boolean

    fun deleteById(id: UUID)

    fun count(): Long

    fun countByDepartmentId(departmentId: UUID): Long

    fun countByStatus(status: EmployeeStatus): Long

    /**
     * Find employees with certifications expiring on or before the given date.
     * Note: This requires parsing the JSON certifications field.
     */
    fun findWithExpiringCertifications(expirationDate: LocalDate): List<Employee>
}
