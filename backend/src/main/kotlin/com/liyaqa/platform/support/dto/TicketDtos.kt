package com.liyaqa.platform.support.dto

import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketMessage
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.model.TicketStatusHistory
import java.time.Instant
import java.util.UUID

// --- Commands ---

data class CreateTicketCommand(
    val tenantId: UUID,
    val createdByUserId: UUID,
    val createdByUserType: CreatedByUserType,
    val subject: String,
    val description: String,
    val category: TicketCategory,
    val priority: TicketPriority,
    val assignedToId: UUID? = null
)

data class UpdateTicketCommand(
    val subject: String? = null,
    val description: String? = null,
    val category: TicketCategory? = null
)

data class ChangeStatusCommand(
    val status: TicketStatus,
    val reason: String? = null
)

data class AssignTicketCommand(
    val assignedToId: UUID
)

data class ChangePriorityCommand(
    val priority: TicketPriority
)

data class EscalateCommand(
    val reason: String? = null
)

data class AddMessageCommand(
    val senderId: UUID,
    val senderType: CreatedByUserType,
    val content: String,
    val isInternalNote: Boolean = false,
    val attachmentUrls: List<String>? = null
)

data class RateTicketCommand(
    val rating: Int
)

// --- Requests ---

data class CreateTicketRequest(
    val tenantId: UUID,
    val subject: String,
    val description: String,
    val category: TicketCategory,
    val priority: TicketPriority,
    val assignedToId: UUID? = null
) {
    fun toCommand(userId: UUID, userType: CreatedByUserType) = CreateTicketCommand(
        tenantId = tenantId,
        createdByUserId = userId,
        createdByUserType = userType,
        subject = subject,
        description = description,
        category = category,
        priority = priority,
        assignedToId = assignedToId
    )
}

data class UpdateTicketRequest(
    val subject: String? = null,
    val description: String? = null,
    val category: TicketCategory? = null
) {
    fun toCommand() = UpdateTicketCommand(subject, description, category)
}

data class ChangeStatusRequest(
    val status: TicketStatus,
    val reason: String? = null
) {
    fun toCommand() = ChangeStatusCommand(status, reason)
}

data class AssignTicketRequest(
    val assignedToId: UUID
) {
    fun toCommand() = AssignTicketCommand(assignedToId)
}

data class ChangePriorityRequest(
    val priority: TicketPriority
) {
    fun toCommand() = ChangePriorityCommand(priority)
}

data class EscalateRequest(
    val reason: String? = null
) {
    fun toCommand() = EscalateCommand(reason)
}

data class AddMessageRequest(
    val content: String,
    val isInternalNote: Boolean = false,
    val attachmentUrls: List<String>? = null
) {
    fun toCommand(senderId: UUID, senderType: CreatedByUserType) = AddMessageCommand(
        senderId = senderId,
        senderType = senderType,
        content = content,
        isInternalNote = isInternalNote,
        attachmentUrls = attachmentUrls
    )
}

data class RateTicketRequest(
    val rating: Int
) {
    fun toCommand() = RateTicketCommand(rating)
}

// --- Responses ---

data class TicketResponse(
    val id: UUID,
    val ticketNumber: String,
    val tenantId: UUID,
    val createdByUserId: UUID,
    val createdByUserType: CreatedByUserType,
    val subject: String,
    val description: String,
    val category: TicketCategory,
    val priority: TicketPriority,
    val status: TicketStatus,
    val assignedToId: UUID?,
    val slaResponseDeadline: Instant?,
    val slaDeadline: Instant?,
    val slaPausedAt: Instant?,
    val slaPausedDuration: Long,
    val resolvedAt: Instant?,
    val closedAt: Instant?,
    val satisfactionRating: Int?,
    val messageCount: Int,
    val lastMessageAt: Instant?,
    val slaBreached: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(ticket: Ticket) = TicketResponse(
            id = ticket.id,
            ticketNumber = ticket.ticketNumber,
            tenantId = ticket.tenantId,
            createdByUserId = ticket.createdByUserId,
            createdByUserType = ticket.createdByUserType,
            subject = ticket.subject,
            description = ticket.description,
            category = ticket.category,
            priority = ticket.priority,
            status = ticket.status,
            assignedToId = ticket.assignedToId,
            slaResponseDeadline = ticket.slaResponseDeadline,
            slaDeadline = ticket.slaDeadline,
            slaPausedAt = ticket.slaPausedAt,
            slaPausedDuration = ticket.slaPausedDuration,
            resolvedAt = ticket.resolvedAt,
            closedAt = ticket.closedAt,
            satisfactionRating = ticket.satisfactionRating,
            messageCount = ticket.messageCount,
            lastMessageAt = ticket.lastMessageAt,
            slaBreached = ticket.isSlaBreached(),
            createdAt = ticket.createdAt,
            updatedAt = ticket.updatedAt
        )
    }
}

data class TicketSummaryResponse(
    val id: UUID,
    val ticketNumber: String,
    val subject: String,
    val category: TicketCategory,
    val status: TicketStatus,
    val priority: TicketPriority,
    val assignedToId: UUID?,
    val tenantId: UUID,
    val slaBreached: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(ticket: Ticket) = TicketSummaryResponse(
            id = ticket.id,
            ticketNumber = ticket.ticketNumber,
            subject = ticket.subject,
            category = ticket.category,
            status = ticket.status,
            priority = ticket.priority,
            assignedToId = ticket.assignedToId,
            tenantId = ticket.tenantId,
            slaBreached = ticket.isSlaBreached(),
            createdAt = ticket.createdAt
        )
    }
}

data class TicketDetailResponse(
    val ticket: TicketResponse,
    val messages: List<TicketMessageResponse>,
    val statusHistory: List<StatusHistoryResponse>
)

data class TicketMessageResponse(
    val id: UUID,
    val ticketId: UUID,
    val senderId: UUID,
    val senderType: CreatedByUserType,
    val content: String,
    val isInternalNote: Boolean,
    val attachmentUrls: List<String>,
    val createdAt: Instant
) {
    companion object {
        fun from(message: TicketMessage) = TicketMessageResponse(
            id = message.id,
            ticketId = message.ticketId,
            senderId = message.senderId,
            senderType = message.senderType,
            content = message.content,
            isInternalNote = message.isInternalNote,
            attachmentUrls = message.getAttachmentUrlsList(),
            createdAt = message.createdAt
        )
    }
}

data class StatusHistoryResponse(
    val id: UUID,
    val ticketId: UUID,
    val fromStatus: TicketStatus,
    val toStatus: TicketStatus,
    val changedBy: UUID,
    val changedAt: Instant,
    val reason: String?
) {
    companion object {
        fun from(history: TicketStatusHistory) = StatusHistoryResponse(
            id = history.id,
            ticketId = history.ticketId,
            fromStatus = history.fromStatus,
            toStatus = history.toStatus,
            changedBy = history.changedBy,
            changedAt = history.changedAt,
            reason = history.reason
        )
    }
}
