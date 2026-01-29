package com.liyaqa.platform.api.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.platform.application.commands.AssignTicketCommand
import com.liyaqa.platform.application.commands.ChangeTicketStatusCommand
import com.liyaqa.platform.application.commands.CreateSupportTicketCommand
import com.liyaqa.platform.application.commands.CreateTicketMessageCommand
import com.liyaqa.platform.application.commands.UpdateSupportTicketCommand
import com.liyaqa.platform.application.services.TicketStats
import com.liyaqa.platform.domain.model.SupportTicket
import com.liyaqa.platform.domain.model.TicketCategory
import com.liyaqa.platform.domain.model.TicketMessage
import com.liyaqa.platform.domain.model.TicketPriority
import com.liyaqa.platform.domain.model.TicketStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

/**
 * Request to create a new support ticket.
 */
data class CreateSupportTicketRequest(
    @field:NotNull(message = "Organization ID is required")
    val organizationId: UUID,

    val clubId: String? = null,  // Can be UUID string or club slug

    @field:NotBlank(message = "Subject is required")
    @field:Size(max = 200, message = "Subject must not exceed 200 characters")
    val subject: String,

    @field:NotBlank(message = "Description is required")
    val description: String,

    @field:NotNull(message = "Category is required")
    val category: TicketCategory,

    @field:NotNull(message = "Priority is required")
    val priority: TicketPriority,

    val assignedToId: UUID? = null,
    val isInternal: Boolean = false,
    val tags: List<String>? = null
) {
    fun toCommand(createdById: UUID, createdByEmail: String? = null) = CreateSupportTicketCommand(
        organizationId = organizationId,
        clubId = clubId,
        subject = subject,
        description = description,
        category = category,
        priority = priority,
        assignedToId = assignedToId,
        createdById = createdById,
        createdByEmail = createdByEmail,
        isInternal = isInternal,
        tags = tags
    )
}

/**
 * Request to update a support ticket.
 */
data class UpdateSupportTicketRequest(
    val subject: String? = null,
    val description: String? = null,
    val category: TicketCategory? = null,
    val priority: TicketPriority? = null,
    val tags: List<String>? = null
) {
    fun toCommand() = UpdateSupportTicketCommand(
        subject = subject,
        description = description,
        category = category,
        priority = priority,
        tags = tags
    )
}

/**
 * Request to change ticket status.
 */
data class ChangeTicketStatusRequest(
    @field:NotNull(message = "Status is required")
    val status: TicketStatus,

    val resolution: String? = null
) {
    fun toCommand() = ChangeTicketStatusCommand(
        status = status,
        resolution = resolution
    )
}

/**
 * Request to assign ticket.
 */
data class AssignTicketRequest(
    @field:NotNull(message = "Assigned to ID is required")
    val assignedToId: UUID
) {
    fun toCommand() = AssignTicketCommand(
        assignedToId = assignedToId
    )
}

/**
 * Request to create a ticket message.
 */
data class CreateTicketMessageRequest(
    @field:NotBlank(message = "Content is required")
    val content: String,

    val isInternal: Boolean = false
) {
    fun toCommand(authorId: UUID, isFromClient: Boolean = false) = CreateTicketMessageCommand(
        content = content,
        isInternal = isInternal,
        isFromClient = isFromClient,
        authorId = authorId
    )
}

// ============================================
// Response DTOs
// ============================================

/**
 * Full support ticket response.
 */
data class SupportTicketResponse(
    val id: UUID,
    val ticketNumber: String,
    val organizationId: UUID,
    val organizationName: String?,
    val clubId: UUID?,
    val clubName: String?,
    val subject: String,
    val description: String,
    val category: TicketCategory,
    val status: TicketStatus,
    val priority: TicketPriority,
    val assignedToId: UUID?,
    val assignedToName: String?,
    val createdById: UUID,
    val createdByName: String?,
    val createdByEmail: String?,
    @get:JsonProperty("isInternal")
    val isInternal: Boolean,
    val tags: List<String>?,
    val messageCount: Int,
    val lastMessageAt: Instant?,
    val resolvedAt: Instant?,
    val closedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(ticket: SupportTicket) = SupportTicketResponse(
            id = ticket.id,
            ticketNumber = ticket.ticketNumber,
            organizationId = ticket.organization.id,
            organizationName = ticket.organization.name.en,
            clubId = ticket.club?.id,
            clubName = ticket.club?.name?.en,
            subject = ticket.subject,
            description = ticket.description,
            category = ticket.category,
            status = ticket.status,
            priority = ticket.priority,
            assignedToId = ticket.assignedTo?.id,
            assignedToName = ticket.assignedTo?.displayName?.en,
            createdById = ticket.createdBy.id,
            createdByName = ticket.createdBy.displayName.en,
            createdByEmail = ticket.createdByEmail,
            isInternal = ticket.isInternal,
            tags = ticket.getTagsList().takeIf { it.isNotEmpty() },
            messageCount = ticket.messageCount,
            lastMessageAt = ticket.lastMessageAt,
            resolvedAt = ticket.resolvedAt,
            closedAt = ticket.closedAt,
            createdAt = ticket.createdAt,
            updatedAt = ticket.updatedAt
        )
    }
}

/**
 * Summary support ticket response for lists.
 */
data class SupportTicketSummaryResponse(
    val id: UUID,
    val ticketNumber: String,
    val organizationId: UUID,
    val organizationName: String?,
    val subject: String,
    val category: TicketCategory,
    val status: TicketStatus,
    val priority: TicketPriority,
    val assignedToName: String?,
    val messageCount: Int,
    val lastMessageAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(ticket: SupportTicket) = SupportTicketSummaryResponse(
            id = ticket.id,
            ticketNumber = ticket.ticketNumber,
            organizationId = ticket.organization.id,
            organizationName = ticket.organization.name.en,
            subject = ticket.subject,
            category = ticket.category,
            status = ticket.status,
            priority = ticket.priority,
            assignedToName = ticket.assignedTo?.displayName?.en,
            messageCount = ticket.messageCount,
            lastMessageAt = ticket.lastMessageAt,
            createdAt = ticket.createdAt
        )
    }
}

/**
 * Ticket message response.
 */
data class TicketMessageResponse(
    val id: UUID,
    val ticketId: UUID,
    val content: String,
    val authorId: UUID,
    val authorName: String,
    val authorEmail: String?,
    @get:JsonProperty("isFromClient")
    val isFromClient: Boolean,
    @get:JsonProperty("isInternal")
    val isInternal: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(message: TicketMessage) = TicketMessageResponse(
            id = message.id,
            ticketId = message.ticket.id,
            content = message.content,
            authorId = message.author.id,
            authorName = message.author.displayName.en,
            authorEmail = message.authorEmail,
            isFromClient = message.isFromClient,
            isInternal = message.isInternal,
            createdAt = message.createdAt
        )
    }
}

/**
 * Ticket statistics response.
 */
data class TicketStatsResponse(
    val total: Long,
    val open: Long,
    val inProgress: Long,
    val waitingOnClient: Long,
    val resolved: Long,
    val closed: Long,
    val avgResolutionTimeHours: Double?,
    val ticketsResolvedToday: Long?
) {
    companion object {
        fun from(stats: TicketStats) = TicketStatsResponse(
            total = stats.total,
            open = stats.open,
            inProgress = stats.inProgress,
            waitingOnClient = stats.waitingOnClient,
            resolved = stats.resolved,
            closed = stats.closed,
            avgResolutionTimeHours = stats.avgResolutionTimeHours,
            ticketsResolvedToday = stats.ticketsResolvedToday
        )
    }
}
