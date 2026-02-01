package com.liyaqa.employee.domain.model

import com.liyaqa.auth.domain.model.Role
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
 * JobTitle entity representing a position within the organization.
 *
 * Key features:
 * - Links to a system Role for permissions
 * - Can be associated with a department
 * - Bilingual name and description
 * - Tenant-scoped (belongs to a club)
 */
@Entity
@Table(name = "job_titles")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class JobTitle(
    id: UUID = UUID.randomUUID(),

    /**
     * Job title name (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    /**
     * Job title description (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    /**
     * Department this job title belongs to (optional).
     */
    @Column(name = "department_id")
    var departmentId: UUID? = null,

    /**
     * Default system role for users with this job title.
     * Links to the existing Role enum for authorization.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "default_role", nullable = false)
    var defaultRole: Role = Role.STAFF,

    /**
     * Whether this job title is active and can be assigned.
     */
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    /**
     * Sort order for display purposes.
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0

) : BaseEntity(id) {

    // ========== Status Management ==========

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }

    // ========== Department Association ==========

    fun setDepartment(departmentId: UUID?) {
        this.departmentId = departmentId
    }

    fun clearDepartment() {
        this.departmentId = null
    }

    // ========== Role Management ==========

    fun setRole(role: Role) {
        this.defaultRole = role
    }

    companion object {
        fun create(
            name: LocalizedText,
            description: LocalizedText? = null,
            departmentId: UUID? = null,
            defaultRole: Role = Role.STAFF,
            sortOrder: Int = 0
        ): JobTitle {
            return JobTitle(
                name = name,
                description = description,
                departmentId = departmentId,
                defaultRole = defaultRole,
                sortOrder = sortOrder
            )
        }
    }
}
