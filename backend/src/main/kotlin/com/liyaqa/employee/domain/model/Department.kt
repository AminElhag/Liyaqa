package com.liyaqa.employee.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Department entity representing an organizational unit within a club.
 *
 * Key features:
 * - Supports hierarchical structure (parent-child departments)
 * - Can have a manager (employee)
 * - Bilingual name and description
 * - Tenant-scoped (belongs to a club)
 */
@Entity
@Table(name = "departments")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Department(
    id: UUID = UUID.randomUUID(),

    /**
     * Department name (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    /**
     * Department description (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    /**
     * Parent department for hierarchical structure.
     * NULL means this is a root department.
     */
    @Column(name = "parent_department_id")
    var parentDepartmentId: UUID? = null,

    /**
     * Employee who manages this department.
     */
    @Column(name = "manager_employee_id")
    var managerEmployeeId: UUID? = null,

    /**
     * Department status.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: DepartmentStatus = DepartmentStatus.ACTIVE,

    /**
     * Sort order for display purposes.
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0

) : BaseEntity(id) {

    // ========== Status Transitions ==========

    fun activate() {
        status = DepartmentStatus.ACTIVE
    }

    fun deactivate() {
        status = DepartmentStatus.INACTIVE
    }

    // ========== Manager Management ==========

    fun setManager(employeeId: UUID?) {
        this.managerEmployeeId = employeeId
    }

    fun clearManager() {
        this.managerEmployeeId = null
    }

    // ========== Hierarchy Management ==========

    fun setParent(parentId: UUID?) {
        this.parentDepartmentId = parentId
    }

    fun isRootDepartment(): Boolean = parentDepartmentId == null

    // ========== Query Helpers ==========

    fun isActive(): Boolean = status == DepartmentStatus.ACTIVE

    companion object {
        fun create(
            name: LocalizedText,
            description: LocalizedText? = null,
            parentDepartmentId: UUID? = null,
            sortOrder: Int = 0
        ): Department {
            return Department(
                name = name,
                description = description,
                parentDepartmentId = parentDepartmentId,
                sortOrder = sortOrder
            )
        }
    }
}
