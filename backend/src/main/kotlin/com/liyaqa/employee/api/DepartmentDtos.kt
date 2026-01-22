package com.liyaqa.employee.api

import com.liyaqa.employee.application.commands.CreateDepartmentCommand
import com.liyaqa.employee.application.commands.SetDepartmentManagerCommand
import com.liyaqa.employee.application.commands.UpdateDepartmentCommand
import com.liyaqa.employee.application.services.DepartmentTreeNode
import com.liyaqa.employee.domain.model.Department
import com.liyaqa.employee.domain.model.DepartmentStatus
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

// ==================== REQUEST DTOs ====================

/**
 * Request to create a new department.
 */
data class CreateDepartmentRequest(
    @field:Valid
    @field:NotNull(message = "Department name is required")
    val name: LocalizedTextInput,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val parentDepartmentId: UUID? = null,

    val sortOrder: Int = 0
) {
    fun toCommand(): CreateDepartmentCommand {
        return CreateDepartmentCommand(
            name = name.toLocalizedText(),
            description = description?.toLocalizedText(),
            parentDepartmentId = parentDepartmentId,
            sortOrder = sortOrder
        )
    }
}

/**
 * Request to update a department.
 */
data class UpdateDepartmentRequest(
    @field:Valid
    val name: LocalizedTextInput? = null,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val parentDepartmentId: UUID? = null,

    val sortOrder: Int? = null
) {
    fun toCommand(): UpdateDepartmentCommand {
        return UpdateDepartmentCommand(
            name = name?.toLocalizedText(),
            description = description?.toLocalizedText(),
            parentDepartmentId = parentDepartmentId,
            sortOrder = sortOrder
        )
    }
}

/**
 * Request to set a department manager.
 */
data class SetDepartmentManagerRequest(
    val employeeId: UUID?
) {
    fun toCommand(departmentId: UUID): SetDepartmentManagerCommand {
        return SetDepartmentManagerCommand(
            departmentId = departmentId,
            employeeId = employeeId
        )
    }
}

// ==================== RESPONSE DTOs ====================

/**
 * Full department response.
 */
data class DepartmentResponse(
    val id: UUID,
    val name: LocalizedText,
    val description: LocalizedText?,
    val parentDepartmentId: UUID?,
    val managerEmployeeId: UUID?,
    val status: DepartmentStatus,
    val sortOrder: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(department: Department): DepartmentResponse {
            return DepartmentResponse(
                id = department.id,
                name = department.name,
                description = department.description,
                parentDepartmentId = department.parentDepartmentId,
                managerEmployeeId = department.managerEmployeeId,
                status = department.status,
                sortOrder = department.sortOrder,
                createdAt = department.createdAt,
                updatedAt = department.updatedAt
            )
        }
    }
}

/**
 * Department summary for list views.
 */
data class DepartmentSummaryResponse(
    val id: UUID,
    val name: LocalizedText,
    val status: DepartmentStatus,
    val parentDepartmentId: UUID?,
    val hasChildren: Boolean,
    val employeeCount: Long
) {
    companion object {
        fun from(
            department: Department,
            hasChildren: Boolean = false,
            employeeCount: Long = 0
        ): DepartmentSummaryResponse {
            return DepartmentSummaryResponse(
                id = department.id,
                name = department.name,
                status = department.status,
                parentDepartmentId = department.parentDepartmentId,
                hasChildren = hasChildren,
                employeeCount = employeeCount
            )
        }
    }
}

/**
 * Department tree node response for hierarchical display.
 */
data class DepartmentTreeNodeResponse(
    val id: UUID,
    val name: LocalizedText,
    val description: LocalizedText?,
    val status: DepartmentStatus,
    val managerEmployeeId: UUID?,
    val employeeCount: Long,
    val children: List<DepartmentTreeNodeResponse>
) {
    companion object {
        fun from(node: DepartmentTreeNode): DepartmentTreeNodeResponse {
            return DepartmentTreeNodeResponse(
                id = node.department.id,
                name = node.department.name,
                description = node.department.description,
                status = node.department.status,
                managerEmployeeId = node.department.managerEmployeeId,
                employeeCount = node.employeeCount,
                children = node.children.map { from(it) }
            )
        }
    }
}

/**
 * Department statistics response.
 */
data class DepartmentStatsResponse(
    val total: Long,
    val active: Long,
    val inactive: Long
)
