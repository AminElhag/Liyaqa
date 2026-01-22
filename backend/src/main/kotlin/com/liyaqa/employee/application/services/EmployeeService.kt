package com.liyaqa.employee.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.employee.application.commands.*
import com.liyaqa.employee.domain.model.Employee
import com.liyaqa.employee.domain.model.EmployeeLocationAssignment
import com.liyaqa.employee.domain.model.EmployeeStatus
import com.liyaqa.employee.domain.model.EmploymentType
import com.liyaqa.employee.domain.ports.DepartmentRepository
import com.liyaqa.employee.domain.ports.EmployeeLocationAssignmentRepository
import com.liyaqa.employee.domain.ports.EmployeeRepository
import com.liyaqa.employee.domain.ports.JobTitleRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service for managing employees.
 *
 * Handles:
 * - Employee CRUD operations
 * - Employee status transitions
 * - Location assignments
 * - Certification management (JSON serialization)
 */
@Service
@Transactional
class EmployeeService(
    private val employeeRepository: EmployeeRepository,
    private val locationAssignmentRepository: EmployeeLocationAssignmentRepository,
    private val departmentRepository: DepartmentRepository,
    private val jobTitleRepository: JobTitleRepository,
    private val userRepository: UserRepository,
    private val locationRepository: LocationRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(EmployeeService::class.java)

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new employee from an existing user.
     */
    fun createEmployee(command: CreateEmployeeCommand): Employee {
        // Verify user exists
        require(userRepository.existsById(command.userId)) {
            "User not found with id: ${command.userId}"
        }

        // Verify employee doesn't already exist for this user in this organization
        require(!employeeRepository.existsByUserIdAndOrganizationId(command.userId, command.organizationId)) {
            "An employee profile already exists for user ${command.userId} in organization ${command.organizationId}"
        }

        // Verify department if specified
        command.departmentId?.let { deptId ->
            require(departmentRepository.existsById(deptId)) {
                "Department not found with id: $deptId"
            }
        }

        // Verify job title if specified
        command.jobTitleId?.let { jtId ->
            require(jobTitleRepository.existsById(jtId)) {
                "Job title not found with id: $jtId"
            }
        }

        val employee = Employee.create(
            userId = command.userId,
            organizationId = command.organizationId,
            tenantId = command.tenantId,
            firstName = command.firstName,
            lastName = command.lastName,
            hireDate = command.hireDate,
            employmentType = command.employmentType,
            email = command.email,
            phone = command.phone
        ).apply {
            dateOfBirth = command.dateOfBirth
            gender = command.gender
            address = command.address
            departmentId = command.departmentId
            jobTitleId = command.jobTitleId
            certifications = command.certifications?.let { serializeCertifications(it) }
            emergencyContactName = command.emergencyContactName
            emergencyContactPhone = command.emergencyContactPhone
            emergencyContactRelationship = command.emergencyContactRelationship
            salaryAmount = command.salaryAmount
            salaryCurrency = command.salaryCurrency
            salaryFrequency = command.salaryFrequency
            profileImageUrl = command.profileImageUrl
            notes = command.notes
        }

        val savedEmployee = employeeRepository.save(employee)
        logger.info("Created employee ${savedEmployee.id} for user ${command.userId}")

        // Assign to locations if specified
        command.assignedLocationIds?.forEach { locationId ->
            val isPrimary = locationId == command.primaryLocationId
            assignEmployeeToLocation(
                AssignEmployeeToLocationCommand(
                    employeeId = savedEmployee.id,
                    locationId = locationId,
                    isPrimary = isPrimary
                )
            )
        }

        // If primary location specified but not in assignedLocationIds, assign it
        command.primaryLocationId?.let { primaryLocId ->
            if (command.assignedLocationIds?.contains(primaryLocId) != true) {
                assignEmployeeToLocation(
                    AssignEmployeeToLocationCommand(
                        employeeId = savedEmployee.id,
                        locationId = primaryLocId,
                        isPrimary = true
                    )
                )
            }
        }

        return savedEmployee
    }

    /**
     * Get employee by ID.
     */
    @Transactional(readOnly = true)
    fun getEmployee(id: UUID): Employee {
        return employeeRepository.findById(id)
            .orElseThrow { NoSuchElementException("Employee not found with id: $id") }
    }

    /**
     * Get employee by user ID.
     */
    @Transactional(readOnly = true)
    fun getEmployeeByUserId(userId: UUID): Employee {
        return employeeRepository.findByUserId(userId)
            .orElseThrow { NoSuchElementException("Employee not found for user: $userId") }
    }

    /**
     * Find employee by user ID (returns null if not found).
     */
    @Transactional(readOnly = true)
    fun findEmployeeByUserId(userId: UUID): Employee? {
        return employeeRepository.findByUserId(userId).orElse(null)
    }

    /**
     * Get all employees with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllEmployees(pageable: Pageable): Page<Employee> {
        return employeeRepository.findAll(pageable)
    }

    /**
     * Search employees with optional filters.
     */
    @Transactional(readOnly = true)
    fun searchEmployees(
        search: String?,
        status: EmployeeStatus?,
        departmentId: UUID?,
        employmentType: EmploymentType?,
        pageable: Pageable
    ): Page<Employee> {
        return employeeRepository.search(search, status, departmentId, employmentType, pageable)
    }

    /**
     * Get employees by department.
     */
    @Transactional(readOnly = true)
    fun getEmployeesByDepartment(departmentId: UUID, pageable: Pageable): Page<Employee> {
        return employeeRepository.findByDepartmentId(departmentId, pageable)
    }

    /**
     * Get employees by job title.
     */
    @Transactional(readOnly = true)
    fun getEmployeesByJobTitle(jobTitleId: UUID, pageable: Pageable): Page<Employee> {
        return employeeRepository.findByJobTitleId(jobTitleId, pageable)
    }

    /**
     * Update an employee.
     */
    fun updateEmployee(id: UUID, command: UpdateEmployeeCommand): Employee {
        val employee = getEmployee(id)

        command.firstName?.let { employee.firstName = it }
        command.lastName?.let { employee.lastName = it }
        command.dateOfBirth?.let { employee.dateOfBirth = it }
        command.gender?.let { employee.gender = it }
        command.email?.let { employee.email = it }
        command.phone?.let { employee.phone = it }
        command.address?.let { employee.address = it }
        command.departmentId?.let {
            require(departmentRepository.existsById(it)) { "Department not found with id: $it" }
            employee.departmentId = it
        }
        command.jobTitleId?.let {
            require(jobTitleRepository.existsById(it)) { "Job title not found with id: $it" }
            employee.jobTitleId = it
        }
        command.employmentType?.let { employee.employmentType = it }
        command.certifications?.let { employee.certifications = serializeCertifications(it) }
        command.emergencyContactName?.let { employee.emergencyContactName = it }
        command.emergencyContactPhone?.let { employee.emergencyContactPhone = it }
        command.emergencyContactRelationship?.let { employee.emergencyContactRelationship = it }
        command.salaryAmount?.let { employee.salaryAmount = it }
        command.salaryCurrency?.let { employee.salaryCurrency = it }
        command.salaryFrequency?.let { employee.salaryFrequency = it }
        command.profileImageUrl?.let { employee.profileImageUrl = it }
        command.notes?.let { employee.notes = it }

        val updated = employeeRepository.save(employee)
        logger.info("Updated employee $id")
        return updated
    }

    /**
     * Delete an employee.
     */
    fun deleteEmployee(id: UUID) {
        val employee = getEmployee(id)
        require(employee.status == EmployeeStatus.TERMINATED || employee.status == EmployeeStatus.INACTIVE) {
            "Can only delete terminated or inactive employees"
        }

        // Delete location assignments first
        locationAssignmentRepository.deleteByEmployeeId(id)

        employeeRepository.deleteById(id)
        logger.info("Deleted employee $id")
    }

    // ==================== STATUS TRANSITIONS ====================

    fun activateEmployee(id: UUID): Employee {
        val employee = getEmployee(id)
        employee.activate()
        val updated = employeeRepository.save(employee)
        logger.info("Activated employee $id")
        return updated
    }

    fun deactivateEmployee(id: UUID): Employee {
        val employee = getEmployee(id)
        employee.deactivate()
        val updated = employeeRepository.save(employee)
        logger.info("Deactivated employee $id")
        return updated
    }

    fun setEmployeeOnLeave(id: UUID): Employee {
        val employee = getEmployee(id)
        employee.setOnLeave()
        val updated = employeeRepository.save(employee)
        logger.info("Set employee $id on leave")
        return updated
    }

    fun returnEmployeeFromLeave(id: UUID): Employee {
        val employee = getEmployee(id)
        employee.returnFromLeave()
        val updated = employeeRepository.save(employee)
        logger.info("Returned employee $id from leave")
        return updated
    }

    fun terminateEmployee(id: UUID, terminationDate: LocalDate = LocalDate.now()): Employee {
        val employee = getEmployee(id)
        employee.terminate(terminationDate)
        val updated = employeeRepository.save(employee)
        logger.info("Terminated employee $id")
        return updated
    }

    // ==================== LOCATION ASSIGNMENTS ====================

    /**
     * Assign employee to a location.
     */
    fun assignEmployeeToLocation(command: AssignEmployeeToLocationCommand): EmployeeLocationAssignment {
        // Verify employee exists
        require(employeeRepository.existsById(command.employeeId)) {
            "Employee not found with id: ${command.employeeId}"
        }

        // Verify location exists
        require(locationRepository.existsById(command.locationId)) {
            "Location not found with id: ${command.locationId}"
        }

        // Check if assignment already exists
        val existing = locationAssignmentRepository.findByEmployeeIdAndLocationId(
            command.employeeId,
            command.locationId
        )
        if (existing.isPresent) {
            val assignment = existing.get()
            if (command.isPrimary && !assignment.isPrimary) {
                // Clear other primary assignments and set this one
                locationAssignmentRepository.clearPrimaryByEmployeeId(command.employeeId)
                assignment.setAsPrimary()
                return locationAssignmentRepository.save(assignment)
            }
            return assignment
        }

        // If setting as primary, clear existing primary
        if (command.isPrimary) {
            locationAssignmentRepository.clearPrimaryByEmployeeId(command.employeeId)
        }

        val assignment = EmployeeLocationAssignment.create(
            employeeId = command.employeeId,
            locationId = command.locationId,
            isPrimary = command.isPrimary
        )

        val saved = locationAssignmentRepository.save(assignment)
        logger.info("Assigned employee ${command.employeeId} to location ${command.locationId}")
        return saved
    }

    /**
     * Get employee's location assignments.
     */
    @Transactional(readOnly = true)
    fun getEmployeeLocationAssignments(employeeId: UUID): List<EmployeeLocationAssignment> {
        return locationAssignmentRepository.findActiveByEmployeeId(employeeId)
    }

    /**
     * Remove employee from a location.
     */
    fun removeEmployeeFromLocation(employeeId: UUID, locationId: UUID) {
        locationAssignmentRepository.deleteByEmployeeIdAndLocationId(employeeId, locationId)
        logger.info("Removed employee $employeeId from location $locationId")
    }

    /**
     * Set a location as the employee's primary location.
     */
    fun setPrimaryLocation(employeeId: UUID, locationId: UUID): EmployeeLocationAssignment {
        val assignment = locationAssignmentRepository.findByEmployeeIdAndLocationId(employeeId, locationId)
            .orElseThrow { NoSuchElementException("Assignment not found for employee $employeeId and location $locationId") }

        locationAssignmentRepository.clearPrimaryByEmployeeId(employeeId)
        assignment.setAsPrimary()

        return locationAssignmentRepository.save(assignment)
    }

    // ==================== CERTIFICATIONS ====================

    /**
     * Find employees with certifications expiring within the given number of days.
     */
    @Transactional(readOnly = true)
    fun findEmployeesWithExpiringCertifications(daysAhead: Int): List<EmployeeWithExpiringCertification> {
        val expirationDate = LocalDate.now().plusDays(daysAhead.toLong())
        val employees = employeeRepository.findWithExpiringCertifications(expirationDate)

        return employees.flatMap { employee ->
            val certifications = parseCertifications(employee.certifications)
            certifications.filter { cert ->
                cert.expiresAt != null && !cert.expiresAt.isAfter(expirationDate)
            }.map { cert ->
                EmployeeWithExpiringCertification(
                    employeeId = employee.id,
                    employeeName = employee.fullName,
                    certificationName = cert.name,
                    expiresAt = cert.expiresAt!!
                )
            }
        }
    }

    // ==================== STATISTICS ====================

    @Transactional(readOnly = true)
    fun getEmployeeCount(): Long {
        return employeeRepository.count()
    }

    @Transactional(readOnly = true)
    fun getEmployeeCountByStatus(status: EmployeeStatus): Long {
        return employeeRepository.countByStatus(status)
    }

    @Transactional(readOnly = true)
    fun getEmployeeCountByDepartment(departmentId: UUID): Long {
        return employeeRepository.countByDepartmentId(departmentId)
    }

    // ==================== BULK OPERATIONS ====================

    fun bulkActivateEmployees(ids: List<UUID>): Map<UUID, Result<Employee>> {
        val employees = employeeRepository.findAllByIds(ids).associateBy { it.id }
        return ids.associateWith { id ->
            runCatching {
                val employee = employees[id]
                    ?: throw NoSuchElementException("Employee not found with id: $id")
                employee.activate()
                employeeRepository.save(employee)
            }
        }
    }

    fun bulkDeactivateEmployees(ids: List<UUID>): Map<UUID, Result<Employee>> {
        val employees = employeeRepository.findAllByIds(ids).associateBy { it.id }
        return ids.associateWith { id ->
            runCatching {
                val employee = employees[id]
                    ?: throw NoSuchElementException("Employee not found with id: $id")
                employee.deactivate()
                employeeRepository.save(employee)
            }
        }
    }

    fun bulkTerminateEmployees(ids: List<UUID>, terminationDate: LocalDate = LocalDate.now()): Map<UUID, Result<Employee>> {
        val employees = employeeRepository.findAllByIds(ids).associateBy { it.id }
        return ids.associateWith { id ->
            runCatching {
                val employee = employees[id]
                    ?: throw NoSuchElementException("Employee not found with id: $id")
                employee.terminate(terminationDate)
                employeeRepository.save(employee)
            }
        }
    }

    // ==================== HELPERS ====================

    private fun serializeCertifications(certifications: List<CertificationInput>): String {
        return objectMapper.writeValueAsString(certifications)
    }

    private fun parseCertifications(json: String?): List<CertificationInput> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            objectMapper.readValue(json)
        } catch (e: Exception) {
            logger.warn("Failed to parse certifications JSON: $json", e)
            emptyList()
        }
    }
}

/**
 * Data class for employee with expiring certification alert.
 */
data class EmployeeWithExpiringCertification(
    val employeeId: UUID,
    val employeeName: com.liyaqa.shared.domain.LocalizedText,
    val certificationName: String,
    val expiresAt: LocalDate
)
