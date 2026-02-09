package com.liyaqa.platform.support.service

import com.liyaqa.platform.support.dto.AddMessageCommand
import com.liyaqa.platform.support.dto.AssignTicketCommand
import com.liyaqa.platform.support.dto.CannedResponseResponse
import com.liyaqa.platform.support.dto.ChangePriorityCommand
import com.liyaqa.platform.support.dto.ChangeStatusCommand
import com.liyaqa.platform.support.dto.CreateCannedResponseCommand
import com.liyaqa.platform.support.dto.CreateTicketCommand
import com.liyaqa.platform.support.dto.EscalateCommand
import com.liyaqa.platform.support.dto.RateTicketCommand
import com.liyaqa.platform.support.dto.StatusHistoryResponse
import com.liyaqa.platform.support.dto.TicketDetailResponse
import com.liyaqa.platform.support.dto.TicketMessageResponse
import com.liyaqa.platform.support.dto.TicketResponse
import com.liyaqa.platform.support.dto.UpdateCannedResponseCommand
import com.liyaqa.platform.support.dto.UpdateTicketCommand
import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.platform.support.exception.CannedResponseNotFoundException
import com.liyaqa.platform.support.exception.TicketNotFoundException
import com.liyaqa.platform.support.exception.TicketRatingException
import com.liyaqa.platform.support.model.CannedResponse
import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketMessage
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.model.TicketStatusHistory
import com.liyaqa.platform.support.repository.CannedResponseRepository
import com.liyaqa.platform.support.repository.TicketMessageRepository
import com.liyaqa.platform.support.repository.TicketRepository
import com.liyaqa.platform.support.repository.TicketSequenceRepository
import com.liyaqa.platform.support.repository.TicketStatusHistoryRepository
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class TicketService(
    private val ticketRepository: TicketRepository,
    private val ticketMessageRepository: TicketMessageRepository,
    private val ticketStatusHistoryRepository: TicketStatusHistoryRepository,
    private val ticketSequenceRepository: TicketSequenceRepository,
    private val cannedResponseRepository: CannedResponseRepository,
    private val eventPublisher: ApplicationEventPublisher
) {

    fun createTicket(cmd: CreateTicketCommand): Ticket {
        val ticketNumber = generateTicketNumber()
        val ticket = Ticket.create(
            ticketNumber = ticketNumber,
            tenantId = cmd.tenantId,
            createdByUserId = cmd.createdByUserId,
            createdByUserType = cmd.createdByUserType,
            subject = cmd.subject,
            description = cmd.description,
            category = cmd.category,
            priority = cmd.priority
        )
        cmd.assignedToId?.let { ticket.assignTo(it) }

        val saved = ticketRepository.save(ticket)

        ticketStatusHistoryRepository.save(
            TicketStatusHistory.create(
                ticketId = saved.id,
                fromStatus = TicketStatus.OPEN,
                toStatus = TicketStatus.OPEN,
                changedBy = cmd.createdByUserId,
                reason = "Ticket created"
            )
        )

        eventPublisher.publishEvent(PlatformEvent.TicketCreated(
            ticketId = saved.id,
            tenantId = cmd.tenantId,
            ticketNumber = ticketNumber,
            subject = cmd.subject,
            priority = cmd.priority.name
        ))

        return saved
    }

    @Transactional(readOnly = true)
    fun getTicket(id: UUID): TicketDetailResponse {
        val ticket = findTicketOrThrow(id)
        val messages = ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(id)
        val history = ticketStatusHistoryRepository.findByTicketIdOrderByChangedAtAsc(id)

        return TicketDetailResponse(
            ticket = TicketResponse.from(ticket),
            messages = messages.map { TicketMessageResponse.from(it) },
            statusHistory = history.map { StatusHistoryResponse.from(it) }
        )
    }

    @Transactional(readOnly = true)
    fun listTickets(
        status: TicketStatus?,
        priority: TicketPriority?,
        category: TicketCategory?,
        assignedToId: UUID?,
        tenantId: UUID?,
        slaBreached: Boolean?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?,
        pageable: Pageable
    ): Page<Ticket> {
        return ticketRepository.findByFilters(
            status, priority, category, assignedToId, tenantId,
            slaBreached, dateFrom, dateTo, search, pageable
        )
    }

    fun updateTicket(id: UUID, cmd: UpdateTicketCommand): Ticket {
        val ticket = findTicketOrThrow(id)
        cmd.subject?.let { ticket.subject = it }
        cmd.description?.let { ticket.description = it }
        cmd.category?.let { ticket.category = it }
        return ticketRepository.save(ticket)
    }

    fun changeStatus(id: UUID, cmd: ChangeStatusCommand, changedBy: UUID): Ticket {
        val ticket = findTicketOrThrow(id)
        val previousStatus = when (cmd.status) {
            TicketStatus.IN_PROGRESS -> ticket.startProgress()
            TicketStatus.WAITING_ON_CUSTOMER -> ticket.waitOnCustomer()
            TicketStatus.WAITING_ON_THIRD_PARTY -> ticket.waitOnThirdParty()
            TicketStatus.ESCALATED -> ticket.escalate()
            TicketStatus.RESOLVED -> ticket.resolve()
            TicketStatus.CLOSED -> ticket.close()
            TicketStatus.REOPENED -> ticket.reopen()
            TicketStatus.OPEN -> throw IllegalArgumentException("Cannot transition to OPEN")
        }

        ticketStatusHistoryRepository.save(
            TicketStatusHistory.create(
                ticketId = ticket.id,
                fromStatus = previousStatus,
                toStatus = cmd.status,
                changedBy = changedBy,
                reason = cmd.reason
            )
        )

        val saved = ticketRepository.save(ticket)

        eventPublisher.publishEvent(PlatformEvent.TicketStatusChanged(
            ticketId = ticket.id,
            tenantId = ticket.tenantId,
            ticketNumber = ticket.ticketNumber,
            fromStatus = previousStatus.name,
            toStatus = cmd.status.name
        ))

        return saved
    }

    fun assignTicket(id: UUID, cmd: AssignTicketCommand): Ticket {
        val ticket = findTicketOrThrow(id)
        ticket.assignTo(cmd.assignedToId)
        val saved = ticketRepository.save(ticket)

        eventPublisher.publishEvent(PlatformEvent.TicketAssigned(
            ticketId = ticket.id,
            tenantId = ticket.tenantId,
            ticketNumber = ticket.ticketNumber,
            assignedToId = cmd.assignedToId
        ))

        return saved
    }

    fun changePriority(id: UUID, cmd: ChangePriorityCommand): Ticket {
        val ticket = findTicketOrThrow(id)
        ticket.changePriority(cmd.priority, ticket.createdAt)
        return ticketRepository.save(ticket)
    }

    fun escalateTicket(id: UUID, cmd: EscalateCommand, escalatedBy: UUID): Ticket {
        val ticket = findTicketOrThrow(id)
        val previousStatus = ticket.escalate()

        ticketStatusHistoryRepository.save(
            TicketStatusHistory.create(
                ticketId = ticket.id,
                fromStatus = previousStatus,
                toStatus = TicketStatus.ESCALATED,
                changedBy = escalatedBy,
                reason = cmd.reason
            )
        )

        val saved = ticketRepository.save(ticket)

        eventPublisher.publishEvent(PlatformEvent.TicketEscalated(
            ticketId = ticket.id,
            tenantId = ticket.tenantId,
            ticketNumber = ticket.ticketNumber,
            reason = cmd.reason,
            escalatedBy = escalatedBy
        ))

        return saved
    }

    fun addMessage(ticketId: UUID, cmd: AddMessageCommand): TicketMessage {
        val ticket = findTicketOrThrow(ticketId)

        val message = if (cmd.isInternalNote) {
            TicketMessage.createInternalNote(
                ticketId = ticketId,
                senderId = cmd.senderId,
                senderType = cmd.senderType,
                content = cmd.content,
                attachmentUrls = cmd.attachmentUrls
            )
        } else {
            TicketMessage.createMessage(
                ticketId = ticketId,
                senderId = cmd.senderId,
                senderType = cmd.senderType,
                content = cmd.content,
                attachmentUrls = cmd.attachmentUrls
            )
        }

        ticket.incrementMessageCount()
        ticketRepository.save(ticket)

        return ticketMessageRepository.save(message)
    }

    fun rateTicket(id: UUID, cmd: RateTicketCommand): Ticket {
        val ticket = findTicketOrThrow(id)
        try {
            ticket.rate(cmd.rating)
        } catch (e: IllegalArgumentException) {
            throw TicketRatingException(e.message ?: "Invalid rating")
        }
        return ticketRepository.save(ticket)
    }

    @Transactional(readOnly = true)
    fun getMessages(ticketId: UUID): List<TicketMessage> {
        return ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
    }

    @Transactional(readOnly = true)
    fun getStatusHistory(ticketId: UUID): List<TicketStatusHistory> {
        return ticketStatusHistoryRepository.findByTicketIdOrderByChangedAtAsc(ticketId)
    }

    // --- Canned Responses ---

    fun createCannedResponse(cmd: CreateCannedResponseCommand): CannedResponse {
        val response = CannedResponse.create(
            title = cmd.title,
            titleAr = cmd.titleAr,
            content = cmd.content,
            contentAr = cmd.contentAr,
            category = cmd.category,
            createdBy = cmd.createdBy
        )
        return cannedResponseRepository.save(response)
    }

    fun updateCannedResponse(id: UUID, cmd: UpdateCannedResponseCommand): CannedResponse {
        val response = cannedResponseRepository.findById(id)
            .orElseThrow { CannedResponseNotFoundException(id) }
        cmd.title?.let { response.title = it }
        cmd.titleAr?.let { response.titleAr = it }
        cmd.content?.let { response.content = it }
        cmd.contentAr?.let { response.contentAr = it }
        cmd.category?.let { response.category = it }
        return cannedResponseRepository.save(response)
    }

    @Transactional(readOnly = true)
    fun listCannedResponses(category: TicketCategory?): List<CannedResponse> {
        return if (category != null) {
            cannedResponseRepository.findByCategoryAndIsActiveTrue(category)
        } else {
            cannedResponseRepository.findByIsActiveTrue()
        }
    }

    fun deleteCannedResponse(id: UUID) {
        cannedResponseRepository.deleteById(id)
    }

    private fun findTicketOrThrow(id: UUID): Ticket {
        return ticketRepository.findById(id)
            .orElseThrow { TicketNotFoundException(id) }
    }

    private fun generateTicketNumber(): String {
        val year = LocalDate.now().year
        val sequence = ticketSequenceRepository.findForUpdate()
            .orElseThrow { IllegalStateException("Ticket sequence not initialized") }
        val ticketNumber = sequence.getNextTicketNumber(year)
        ticketSequenceRepository.save(sequence)
        return ticketNumber
    }
}
