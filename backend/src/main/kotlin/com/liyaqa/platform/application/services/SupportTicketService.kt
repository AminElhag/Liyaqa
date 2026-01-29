package com.liyaqa.platform.application.services

import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.application.commands.AssignTicketCommand
import com.liyaqa.platform.application.commands.ChangeTicketStatusCommand
import com.liyaqa.platform.application.commands.CreateSupportTicketCommand
import com.liyaqa.platform.application.commands.CreateTicketMessageCommand
import com.liyaqa.platform.application.commands.UpdateSupportTicketCommand
import com.liyaqa.platform.domain.model.SupportTicket
import com.liyaqa.platform.domain.model.TicketCategory
import com.liyaqa.platform.domain.model.TicketMessage
import com.liyaqa.platform.domain.model.TicketPriority
import com.liyaqa.platform.domain.model.TicketStatus
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import com.liyaqa.platform.domain.ports.SupportTicketRepository
import com.liyaqa.platform.domain.ports.TicketMessageRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Statistics about support tickets.
 */
data class TicketStats(
    val total: Long,
    val open: Long,
    val inProgress: Long,
    val waitingOnClient: Long,
    val resolved: Long,
    val closed: Long,
    val avgResolutionTimeHours: Double? = null,
    val ticketsResolvedToday: Long? = null
)

/**
 * Service for managing support tickets.
 */
@Service
@Transactional
class SupportTicketService(
    private val ticketRepository: SupportTicketRepository,
    private val messageRepository: TicketMessageRepository,
    private val platformUserRepository: PlatformUserRepository,
    private val organizationRepository: OrganizationRepository,
    private val clubRepository: ClubRepository
) {

    /**
     * Create a new support ticket.
     */
    fun createTicket(command: CreateSupportTicketCommand): SupportTicket {
        // Get organization
        val organization = organizationRepository.findById(command.organizationId)
            .orElseThrow { NoSuchElementException("Organization not found: ${command.organizationId}") }

        // Get club if specified - supports both UUID and slug
        val club = command.clubId?.let { clubIdOrSlug ->
            // Try parsing as UUID first
            try {
                val uuid = UUID.fromString(clubIdOrSlug)
                clubRepository.findById(uuid)
                    .orElseThrow { NoSuchElementException("Club not found: $clubIdOrSlug") }
            } catch (e: IllegalArgumentException) {
                // Not a valid UUID, try as slug
                clubRepository.findBySlug(clubIdOrSlug)
                    .orElseThrow { NoSuchElementException("Club not found: $clubIdOrSlug") }
            }
        }

        // Get creator
        val createdBy = platformUserRepository.findById(command.createdById)
            .orElseThrow { NoSuchElementException("Platform user not found: ${command.createdById}") }

        // Generate ticket number
        val ticketNumber = ticketRepository.generateTicketNumber()

        // Create ticket
        val ticket = SupportTicket.create(
            ticketNumber = ticketNumber,
            organization = organization,
            club = club,
            subject = command.subject,
            description = command.description,
            category = command.category,
            priority = command.priority,
            createdBy = createdBy,
            createdByEmail = command.createdByEmail,
            isInternal = command.isInternal,
            tags = command.tags?.joinToString(",")
        )

        // Assign if specified
        command.assignedToId?.let { assigneeId ->
            val assignee = platformUserRepository.findById(assigneeId)
                .orElseThrow { NoSuchElementException("Platform user not found: $assigneeId") }
            ticket.assignTo(assignee)
        }

        return ticketRepository.save(ticket)
    }

    /**
     * Get ticket by ID.
     */
    @Transactional(readOnly = true)
    fun getTicket(id: UUID): SupportTicket {
        return ticketRepository.findById(id)
            .orElseThrow { NoSuchElementException("Support ticket not found: $id") }
    }

    /**
     * Get all tickets with pagination and optional filters.
     */
    @Transactional(readOnly = true)
    fun getAllTickets(
        status: TicketStatus? = null,
        priority: TicketPriority? = null,
        category: TicketCategory? = null,
        organizationId: UUID? = null,
        assignedToId: UUID? = null,
        search: String? = null,
        pageable: Pageable
    ): Page<SupportTicket> {
        return ticketRepository.findByFilters(
            status = status,
            priority = priority,
            category = category,
            organizationId = organizationId,
            assignedToId = assignedToId,
            search = search,
            pageable = pageable
        )
    }

    /**
     * Update ticket.
     */
    fun updateTicket(id: UUID, command: UpdateSupportTicketCommand): SupportTicket {
        val ticket = ticketRepository.findById(id)
            .orElseThrow { NoSuchElementException("Support ticket not found: $id") }

        ticket.update(
            subject = command.subject,
            description = command.description,
            category = command.category,
            priority = command.priority,
            tags = command.tags?.joinToString(",")
        )

        return ticketRepository.save(ticket)
    }

    /**
     * Change ticket status.
     */
    fun changeStatus(id: UUID, command: ChangeTicketStatusCommand): SupportTicket {
        val ticket = ticketRepository.findById(id)
            .orElseThrow { NoSuchElementException("Support ticket not found: $id") }

        when (command.status) {
            TicketStatus.OPEN -> ticket.reopen()
            TicketStatus.IN_PROGRESS -> ticket.startProgress()
            TicketStatus.WAITING_ON_CLIENT -> ticket.waitOnClient()
            TicketStatus.RESOLVED -> ticket.resolve(command.resolution)
            TicketStatus.CLOSED -> ticket.close()
        }

        return ticketRepository.save(ticket)
    }

    /**
     * Assign ticket to a user.
     */
    fun assignTicket(id: UUID, command: AssignTicketCommand): SupportTicket {
        val ticket = ticketRepository.findById(id)
            .orElseThrow { NoSuchElementException("Support ticket not found: $id") }

        val assignee = platformUserRepository.findById(command.assignedToId)
            .orElseThrow { NoSuchElementException("Platform user not found: ${command.assignedToId}") }

        ticket.assignTo(assignee)

        return ticketRepository.save(ticket)
    }

    /**
     * Unassign ticket.
     */
    fun unassignTicket(id: UUID): SupportTicket {
        val ticket = ticketRepository.findById(id)
            .orElseThrow { NoSuchElementException("Support ticket not found: $id") }

        ticket.unassign()

        return ticketRepository.save(ticket)
    }

    /**
     * Delete ticket.
     */
    fun deleteTicket(id: UUID) {
        if (!ticketRepository.existsById(id)) {
            throw NoSuchElementException("Support ticket not found: $id")
        }
        ticketRepository.deleteById(id)
    }

    /**
     * Get ticket messages.
     */
    @Transactional(readOnly = true)
    fun getMessages(ticketId: UUID): List<TicketMessage> {
        if (!ticketRepository.existsById(ticketId)) {
            throw NoSuchElementException("Support ticket not found: $ticketId")
        }
        return messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
    }

    /**
     * Add message to ticket.
     */
    fun addMessage(ticketId: UUID, command: CreateTicketMessageCommand): TicketMessage {
        val ticket = ticketRepository.findById(ticketId)
            .orElseThrow { NoSuchElementException("Support ticket not found: $ticketId") }

        val author = platformUserRepository.findById(command.authorId)
            .orElseThrow { NoSuchElementException("Platform user not found: ${command.authorId}") }

        val message = when {
            command.isInternal -> TicketMessage.createInternalNote(ticket, command.content, author)
            command.isFromClient -> TicketMessage.createFromClient(ticket, command.content, author)
            else -> TicketMessage.createFromPlatform(ticket, command.content, author, command.isInternal)
        }

        // Save ticket to update message count
        ticketRepository.save(ticket)

        return messageRepository.save(message)
    }

    /**
     * Get ticket statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(): TicketStats {
        val total = ticketRepository.count()
        val open = ticketRepository.countByStatus(TicketStatus.OPEN)
        val inProgress = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)
        val waitingOnClient = ticketRepository.countByStatus(TicketStatus.WAITING_ON_CLIENT)
        val resolved = ticketRepository.countByStatus(TicketStatus.RESOLVED)
        val closed = ticketRepository.countByStatus(TicketStatus.CLOSED)

        return TicketStats(
            total = total,
            open = open,
            inProgress = inProgress,
            waitingOnClient = waitingOnClient,
            resolved = resolved,
            closed = closed
        )
    }
}
