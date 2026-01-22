package com.liyaqa.employee.domain.ports

import com.liyaqa.employee.domain.model.AssignmentStatus
import com.liyaqa.employee.domain.model.EmployeeLocationAssignment
import java.util.Optional
import java.util.UUID

/**
 * Repository port for EmployeeLocationAssignment entity.
 */
interface EmployeeLocationAssignmentRepository {

    fun save(assignment: EmployeeLocationAssignment): EmployeeLocationAssignment

    fun findById(id: UUID): Optional<EmployeeLocationAssignment>

    fun findByEmployeeId(employeeId: UUID): List<EmployeeLocationAssignment>

    fun findActiveByEmployeeId(employeeId: UUID): List<EmployeeLocationAssignment>

    fun findByLocationId(locationId: UUID): List<EmployeeLocationAssignment>

    fun findActiveByLocationId(locationId: UUID): List<EmployeeLocationAssignment>

    fun findByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID): Optional<EmployeeLocationAssignment>

    /**
     * Find the primary location assignment for an employee.
     */
    fun findPrimaryByEmployeeId(employeeId: UUID): Optional<EmployeeLocationAssignment>

    fun existsById(id: UUID): Boolean

    fun existsByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID): Boolean

    fun deleteById(id: UUID)

    fun deleteByEmployeeId(employeeId: UUID)

    fun deleteByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID)

    /**
     * Clear primary flag for all assignments of an employee.
     * Used before setting a new primary location.
     */
    fun clearPrimaryByEmployeeId(employeeId: UUID)

    fun countByEmployeeId(employeeId: UUID): Long

    fun countByLocationId(locationId: UUID): Long

    fun countActiveByLocationId(locationId: UUID): Long
}
