package com.liyaqa.crm.api

import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadActivity
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.model.LeadPriority
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import org.springframework.data.domain.Page
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ===== Pagination Response =====

data class PageResponse<T : Any>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
) {
    companion object {
        fun <T : Any> from(page: Page<T>): PageResponse<T> = PageResponse(
            content = page.content,
            page = page.number,
            size = page.size,
            totalElements = page.totalElements,
            totalPages = page.totalPages,
            first = page.isFirst,
            last = page.isLast
        )
    }
}

// ===== Request DTOs =====

data class CreateLeadRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    val phone: String? = null,

    @field:NotNull(message = "Source is required")
    val source: LeadSource,

    val assignedToUserId: UUID? = null,
    val notes: String? = null,
    val priority: LeadPriority? = null,
    val expectedConversionDate: LocalDate? = null,
    val campaignSource: String? = null,
    val campaignMedium: String? = null,
    val campaignName: String? = null
)

data class UpdateLeadRequest(
    val name: String? = null,
    @field:Email(message = "Email must be valid")
    val email: String? = null,
    val phone: String? = null,
    val source: LeadSource? = null,
    val assignedToUserId: UUID? = null,
    val notes: String? = null,
    val priority: LeadPriority? = null,
    val expectedConversionDate: LocalDate? = null
)

data class TransitionStatusRequest(
    @field:NotNull(message = "Status is required")
    val status: LeadStatus,
    val reason: String? = null,
    val memberId: UUID? = null
)

data class AssignLeadRequest(
    val assignToUserId: UUID?
)

data class BulkAssignRequest(
    @field:NotNull(message = "Lead IDs are required")
    val leadIds: List<UUID>,
    @field:NotNull(message = "User ID is required")
    val assignToUserId: UUID
)

data class ConvertLeadRequest(
    @field:NotNull(message = "Member ID is required")
    val memberId: UUID
)

data class LogActivityRequest(
    @field:NotNull(message = "Activity type is required")
    val type: LeadActivityType,
    val notes: String? = null,
    val contactMethod: String? = null,
    val outcome: String? = null,
    val followUpDate: LocalDate? = null,
    val durationMinutes: Int? = null
)

data class CompleteFollowUpRequest(
    val outcome: String? = null,
    val notes: String? = null
)

// ===== Response DTOs =====

data class LeadResponse(
    val id: UUID,
    val name: String,
    val email: String,
    val phone: String?,
    val status: LeadStatus,
    val source: LeadSource,
    val assignedToUserId: UUID?,
    val notes: String?,
    val priority: LeadPriority?,
    val score: Int,
    val contactedAt: LocalDate?,
    val tourScheduledAt: LocalDate?,
    val trialStartedAt: LocalDate?,
    val negotiationStartedAt: LocalDate?,
    val wonAt: LocalDate?,
    val lostAt: LocalDate?,
    val lossReason: String?,
    val expectedConversionDate: LocalDate?,
    val convertedMemberId: UUID?,
    val campaignSource: String?,
    val campaignMedium: String?,
    val campaignName: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(lead: Lead): LeadResponse = LeadResponse(
            id = lead.id,
            name = lead.name,
            email = lead.email,
            phone = lead.phone,
            status = lead.status,
            source = lead.source,
            assignedToUserId = lead.assignedToUserId,
            notes = lead.notes,
            priority = lead.priority,
            score = lead.score,
            contactedAt = lead.contactedAt,
            tourScheduledAt = lead.tourScheduledAt,
            trialStartedAt = lead.trialStartedAt,
            negotiationStartedAt = lead.negotiationStartedAt,
            wonAt = lead.wonAt,
            lostAt = lead.lostAt,
            lossReason = lead.lossReason,
            expectedConversionDate = lead.expectedConversionDate,
            convertedMemberId = lead.convertedMemberId,
            campaignSource = lead.campaignSource,
            campaignMedium = lead.campaignMedium,
            campaignName = lead.campaignName,
            createdAt = lead.createdAt,
            updatedAt = lead.updatedAt
        )
    }
}

data class LeadActivityResponse(
    val id: UUID,
    val leadId: UUID,
    val type: LeadActivityType,
    val notes: String?,
    val performedByUserId: UUID?,
    val contactMethod: String?,
    val outcome: String?,
    val followUpDate: LocalDate?,
    val followUpCompleted: Boolean,
    val durationMinutes: Int?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(activity: LeadActivity): LeadActivityResponse = LeadActivityResponse(
            id = activity.id,
            leadId = activity.leadId,
            type = activity.type,
            notes = activity.notes,
            performedByUserId = activity.performedByUserId,
            contactMethod = activity.contactMethod,
            outcome = activity.outcome,
            followUpDate = activity.followUpDate,
            followUpCompleted = activity.followUpCompleted,
            durationMinutes = activity.durationMinutes,
            createdAt = activity.createdAt,
            updatedAt = activity.updatedAt
        )
    }
}

data class PipelineStatsResponse(
    val byStatus: Map<LeadStatus, Long>,
    val total: Long,
    val active: Long,
    val conversionRate: Double
)

data class SourceStatsResponse(
    val bySource: Map<LeadSource, Long>,
    val total: Long
)

data class ActivityStatsResponse(
    val totalActivities: Long,
    val pendingFollowUps: Long,
    val overdueFollowUps: Long,
    val byType: Map<LeadActivityType, Long>
)

data class LeadSummaryResponse(
    val id: UUID,
    val name: String,
    val email: String,
    val status: LeadStatus,
    val source: LeadSource,
    val priority: LeadPriority?,
    val score: Int,
    val assignedToUserId: UUID?,
    val createdAt: Instant
) {
    companion object {
        fun from(lead: Lead): LeadSummaryResponse = LeadSummaryResponse(
            id = lead.id,
            name = lead.name,
            email = lead.email,
            status = lead.status,
            source = lead.source,
            priority = lead.priority,
            score = lead.score,
            assignedToUserId = lead.assignedToUserId,
            createdAt = lead.createdAt
        )
    }
}
