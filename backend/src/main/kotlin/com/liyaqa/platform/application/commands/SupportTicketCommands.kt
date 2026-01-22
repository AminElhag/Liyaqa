package com.liyaqa.platform.application.commands

import com.liyaqa.platform.domain.model.TicketCategory
import com.liyaqa.platform.domain.model.TicketPriority
import com.liyaqa.platform.domain.model.TicketStatus
import java.util.UUID

/**
 * Command to create a new support ticket.
 */
data class CreateSupportTicketCommand(
    val organizationId: UUID,
    val clubId: UUID? = null,
    val subject: String,
    val description: String,
    val category: TicketCategory,
    val priority: TicketPriority,
    val assignedToId: UUID? = null,
    val createdById: UUID,
    val createdByEmail: String? = null,
    val isInternal: Boolean = false,
    val tags: List<String>? = null
)

/**
 * Command to update an existing support ticket.
 */
data class UpdateSupportTicketCommand(
    val subject: String? = null,
    val description: String? = null,
    val category: TicketCategory? = null,
    val priority: TicketPriority? = null,
    val tags: List<String>? = null
)

/**
 * Command to change ticket status.
 */
data class ChangeTicketStatusCommand(
    val status: TicketStatus,
    val resolution: String? = null
)

/**
 * Command to assign ticket to a user.
 */
data class AssignTicketCommand(
    val assignedToId: UUID
)

/**
 * Command to add a message to a ticket.
 */
data class CreateTicketMessageCommand(
    val content: String,
    val isInternal: Boolean = false,
    val isFromClient: Boolean = false,
    val authorId: UUID
)
