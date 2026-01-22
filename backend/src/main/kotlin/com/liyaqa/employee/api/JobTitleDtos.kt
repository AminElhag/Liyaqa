package com.liyaqa.employee.api

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.employee.application.commands.CreateJobTitleCommand
import com.liyaqa.employee.application.commands.UpdateJobTitleCommand
import com.liyaqa.employee.domain.model.JobTitle
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

// ==================== REQUEST DTOs ====================

/**
 * Request to create a new job title.
 */
data class CreateJobTitleRequest(
    @field:Valid
    @field:NotNull(message = "Job title name is required")
    val name: LocalizedTextInput,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val departmentId: UUID? = null,

    val defaultRole: Role = Role.STAFF,

    val sortOrder: Int = 0
) {
    fun toCommand(): CreateJobTitleCommand {
        return CreateJobTitleCommand(
            name = name.toLocalizedText(),
            description = description?.toLocalizedText(),
            departmentId = departmentId,
            defaultRole = defaultRole,
            sortOrder = sortOrder
        )
    }
}

/**
 * Request to update a job title.
 */
data class UpdateJobTitleRequest(
    @field:Valid
    val name: LocalizedTextInput? = null,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val departmentId: UUID? = null,

    val defaultRole: Role? = null,

    val sortOrder: Int? = null
) {
    fun toCommand(): UpdateJobTitleCommand {
        return UpdateJobTitleCommand(
            name = name?.toLocalizedText(),
            description = description?.toLocalizedText(),
            departmentId = departmentId,
            defaultRole = defaultRole,
            sortOrder = sortOrder
        )
    }
}

// ==================== RESPONSE DTOs ====================

/**
 * Full job title response.
 */
data class JobTitleResponse(
    val id: UUID,
    val name: LocalizedText,
    val description: LocalizedText?,
    val departmentId: UUID?,
    val departmentName: LocalizedText?,
    val defaultRole: Role,
    val isActive: Boolean,
    val sortOrder: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(
            jobTitle: JobTitle,
            departmentName: LocalizedText? = null
        ): JobTitleResponse {
            return JobTitleResponse(
                id = jobTitle.id,
                name = jobTitle.name,
                description = jobTitle.description,
                departmentId = jobTitle.departmentId,
                departmentName = departmentName,
                defaultRole = jobTitle.defaultRole,
                isActive = jobTitle.isActive,
                sortOrder = jobTitle.sortOrder,
                createdAt = jobTitle.createdAt,
                updatedAt = jobTitle.updatedAt
            )
        }
    }
}

/**
 * Job title summary for list views.
 */
data class JobTitleSummaryResponse(
    val id: UUID,
    val name: LocalizedText,
    val departmentId: UUID?,
    val departmentName: LocalizedText?,
    val defaultRole: Role,
    val isActive: Boolean
) {
    companion object {
        fun from(
            jobTitle: JobTitle,
            departmentName: LocalizedText? = null
        ): JobTitleSummaryResponse {
            return JobTitleSummaryResponse(
                id = jobTitle.id,
                name = jobTitle.name,
                departmentId = jobTitle.departmentId,
                departmentName = departmentName,
                defaultRole = jobTitle.defaultRole,
                isActive = jobTitle.isActive
            )
        }
    }
}

/**
 * Job title statistics response.
 */
data class JobTitleStatsResponse(
    val total: Long,
    val active: Long,
    val inactive: Long
)
