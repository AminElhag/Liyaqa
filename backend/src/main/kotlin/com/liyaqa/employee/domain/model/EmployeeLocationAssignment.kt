package com.liyaqa.employee.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * EmployeeLocationAssignment entity represents the many-to-many relationship
 * between employees and locations.
 *
 * Key features:
 * - Employees can be assigned to multiple locations
 * - One location can be marked as primary
 * - Assignment can be active or inactive
 * - Tenant-scoped
 */
@Entity
@Table(name = "employee_location_assignments")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class EmployeeLocationAssignment(
    id: UUID = UUID.randomUUID(),

    /**
     * The employee being assigned.
     */
    @Column(name = "employee_id", nullable = false)
    var employeeId: UUID,

    /**
     * The location the employee is assigned to.
     */
    @Column(name = "location_id", nullable = false)
    var locationId: UUID,

    /**
     * Whether this is the employee's primary location.
     */
    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false,

    /**
     * Assignment status.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: AssignmentStatus = AssignmentStatus.ACTIVE

) : BaseEntity(id) {

    // ========== Status Management ==========

    fun activate() {
        status = AssignmentStatus.ACTIVE
    }

    fun deactivate() {
        status = AssignmentStatus.INACTIVE
    }

    // ========== Primary Location Management ==========

    fun setAsPrimary() {
        isPrimary = true
    }

    fun clearPrimary() {
        isPrimary = false
    }

    // ========== Query Helpers ==========

    fun isActive(): Boolean = status == AssignmentStatus.ACTIVE

    companion object {
        fun create(
            employeeId: UUID,
            locationId: UUID,
            isPrimary: Boolean = false
        ): EmployeeLocationAssignment {
            return EmployeeLocationAssignment(
                employeeId = employeeId,
                locationId = locationId,
                isPrimary = isPrimary
            )
        }
    }
}
