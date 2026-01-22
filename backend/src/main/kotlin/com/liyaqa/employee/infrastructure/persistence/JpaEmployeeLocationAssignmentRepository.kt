package com.liyaqa.employee.infrastructure.persistence

import com.liyaqa.employee.domain.model.AssignmentStatus
import com.liyaqa.employee.domain.model.EmployeeLocationAssignment
import com.liyaqa.employee.domain.ports.EmployeeLocationAssignmentRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for EmployeeLocationAssignment entity.
 */
interface SpringDataEmployeeLocationAssignmentRepository : JpaRepository<EmployeeLocationAssignment, UUID> {

    fun findByEmployeeId(employeeId: UUID): List<EmployeeLocationAssignment>

    fun findByLocationId(locationId: UUID): List<EmployeeLocationAssignment>

    fun findByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID): Optional<EmployeeLocationAssignment>

    @Query("SELECT ela FROM EmployeeLocationAssignment ela WHERE ela.employeeId = :employeeId AND ela.status = :status")
    fun findByEmployeeIdAndStatus(
        @Param("employeeId") employeeId: UUID,
        @Param("status") status: AssignmentStatus
    ): List<EmployeeLocationAssignment>

    @Query("SELECT ela FROM EmployeeLocationAssignment ela WHERE ela.locationId = :locationId AND ela.status = :status")
    fun findByLocationIdAndStatus(
        @Param("locationId") locationId: UUID,
        @Param("status") status: AssignmentStatus
    ): List<EmployeeLocationAssignment>

    @Query("SELECT ela FROM EmployeeLocationAssignment ela WHERE ela.employeeId = :employeeId AND ela.isPrimary = true")
    fun findPrimaryByEmployeeId(@Param("employeeId") employeeId: UUID): Optional<EmployeeLocationAssignment>

    fun existsByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID): Boolean

    fun deleteByEmployeeId(employeeId: UUID)

    fun deleteByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID)

    @Modifying
    @Query("UPDATE EmployeeLocationAssignment ela SET ela.isPrimary = false WHERE ela.employeeId = :employeeId")
    fun clearPrimaryByEmployeeId(@Param("employeeId") employeeId: UUID)

    fun countByEmployeeId(employeeId: UUID): Long

    fun countByLocationId(locationId: UUID): Long

    @Query("SELECT COUNT(ela) FROM EmployeeLocationAssignment ela WHERE ela.locationId = :locationId AND ela.status = 'ACTIVE'")
    fun countActiveByLocationId(@Param("locationId") locationId: UUID): Long
}

/**
 * Adapter implementing EmployeeLocationAssignmentRepository using Spring Data JPA.
 */
@Repository
class JpaEmployeeLocationAssignmentRepository(
    private val springDataRepository: SpringDataEmployeeLocationAssignmentRepository
) : EmployeeLocationAssignmentRepository {

    override fun save(assignment: EmployeeLocationAssignment): EmployeeLocationAssignment {
        return springDataRepository.save(assignment)
    }

    override fun findById(id: UUID): Optional<EmployeeLocationAssignment> {
        return springDataRepository.findById(id)
    }

    override fun findByEmployeeId(employeeId: UUID): List<EmployeeLocationAssignment> {
        return springDataRepository.findByEmployeeId(employeeId)
    }

    override fun findActiveByEmployeeId(employeeId: UUID): List<EmployeeLocationAssignment> {
        return springDataRepository.findByEmployeeIdAndStatus(employeeId, AssignmentStatus.ACTIVE)
    }

    override fun findByLocationId(locationId: UUID): List<EmployeeLocationAssignment> {
        return springDataRepository.findByLocationId(locationId)
    }

    override fun findActiveByLocationId(locationId: UUID): List<EmployeeLocationAssignment> {
        return springDataRepository.findByLocationIdAndStatus(locationId, AssignmentStatus.ACTIVE)
    }

    override fun findByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID): Optional<EmployeeLocationAssignment> {
        return springDataRepository.findByEmployeeIdAndLocationId(employeeId, locationId)
    }

    override fun findPrimaryByEmployeeId(employeeId: UUID): Optional<EmployeeLocationAssignment> {
        return springDataRepository.findPrimaryByEmployeeId(employeeId)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun existsByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID): Boolean {
        return springDataRepository.existsByEmployeeIdAndLocationId(employeeId, locationId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun deleteByEmployeeId(employeeId: UUID) {
        springDataRepository.deleteByEmployeeId(employeeId)
    }

    override fun deleteByEmployeeIdAndLocationId(employeeId: UUID, locationId: UUID) {
        springDataRepository.deleteByEmployeeIdAndLocationId(employeeId, locationId)
    }

    override fun clearPrimaryByEmployeeId(employeeId: UUID) {
        springDataRepository.clearPrimaryByEmployeeId(employeeId)
    }

    override fun countByEmployeeId(employeeId: UUID): Long {
        return springDataRepository.countByEmployeeId(employeeId)
    }

    override fun countByLocationId(locationId: UUID): Long {
        return springDataRepository.countByLocationId(locationId)
    }

    override fun countActiveByLocationId(locationId: UUID): Long {
        return springDataRepository.countActiveByLocationId(locationId)
    }
}
