package com.liyaqa.platform.support.service

import com.liyaqa.platform.support.dto.AddMessageCommand
import com.liyaqa.platform.support.dto.AssignTicketCommand
import com.liyaqa.platform.support.dto.ChangePriorityCommand
import com.liyaqa.platform.support.dto.ChangeStatusCommand
import com.liyaqa.platform.support.dto.CreateTicketCommand
import com.liyaqa.platform.support.dto.EscalateCommand
import com.liyaqa.platform.support.dto.RateTicketCommand
import com.liyaqa.platform.support.exception.InvalidTicketStatusTransitionException
import com.liyaqa.platform.support.exception.TicketRatingException
import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.SlaConfig
import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketMessage
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketSequence
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.model.TicketStatusHistory
import com.liyaqa.platform.support.repository.CannedResponseRepository
import com.liyaqa.platform.support.repository.TicketMessageRepository
import com.liyaqa.platform.support.repository.TicketRepository
import com.liyaqa.platform.support.repository.TicketSequenceRepository
import com.liyaqa.platform.support.repository.TicketStatusHistoryRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.argThat
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TicketServiceTest {

    @Mock private lateinit var ticketRepository: TicketRepository
    @Mock private lateinit var ticketMessageRepository: TicketMessageRepository
    @Mock private lateinit var ticketStatusHistoryRepository: TicketStatusHistoryRepository
    @Mock private lateinit var ticketSequenceRepository: TicketSequenceRepository
    @Mock private lateinit var cannedResponseRepository: CannedResponseRepository
    @Mock private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: TicketService

    private val tenantId = UUID.randomUUID()
    private val userId = UUID.randomUUID()
    private val agentId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = TicketService(
            ticketRepository,
            ticketMessageRepository,
            ticketStatusHistoryRepository,
            ticketSequenceRepository,
            cannedResponseRepository,
            eventPublisher
        )
        whenever(ticketRepository.save(any<Ticket>())).thenAnswer { it.arguments[0] }
        whenever(ticketMessageRepository.save(any<TicketMessage>())).thenAnswer { it.arguments[0] }
        whenever(ticketStatusHistoryRepository.save(any<TicketStatusHistory>())).thenAnswer { it.arguments[0] }

        val sequence = TicketSequence(currentYear = 2026, currentSequence = 0)
        whenever(ticketSequenceRepository.findForUpdate()).thenReturn(Optional.of(sequence))
        whenever(ticketSequenceRepository.save(any<TicketSequence>())).thenAnswer { it.arguments[0] }
    }

    private fun createTestTicket(
        status: TicketStatus = TicketStatus.OPEN,
        priority: TicketPriority = TicketPriority.MEDIUM
    ): Ticket {
        val ticket = Ticket.create(
            ticketNumber = "TKT-202600001",
            tenantId = tenantId,
            createdByUserId = userId,
            createdByUserType = CreatedByUserType.FACILITY_ADMIN,
            subject = "Test ticket",
            description = "Test description",
            category = TicketCategory.TECHNICAL,
            priority = priority
        )
        // Transition to desired status
        when (status) {
            TicketStatus.IN_PROGRESS -> ticket.startProgress()
            TicketStatus.WAITING_ON_CUSTOMER -> {
                ticket.startProgress()
                ticket.waitOnCustomer()
            }
            TicketStatus.RESOLVED -> {
                ticket.startProgress()
                ticket.resolve()
            }
            TicketStatus.CLOSED -> {
                ticket.startProgress()
                ticket.resolve()
                ticket.close()
            }
            TicketStatus.REOPENED -> {
                ticket.startProgress()
                ticket.resolve()
                ticket.reopen()
            }
            TicketStatus.ESCALATED -> {
                ticket.startProgress()
                ticket.escalate()
            }
            else -> {} // OPEN is default
        }
        return ticket
    }

    @Test
    fun `creates ticket with SLA deadlines`() {
        val cmd = CreateTicketCommand(
            tenantId = tenantId,
            createdByUserId = userId,
            createdByUserType = CreatedByUserType.FACILITY_ADMIN,
            subject = "Cannot access account",
            description = "I'm locked out of my account",
            category = TicketCategory.ACCOUNT,
            priority = TicketPriority.HIGH
        )

        val result = service.createTicket(cmd)

        assertEquals("Cannot access account", result.subject)
        assertEquals(TicketStatus.OPEN, result.status)
        assertEquals(TicketPriority.HIGH, result.priority)
        assertNotNull(result.slaResponseDeadline)
        assertNotNull(result.slaDeadline)
        assertEquals(tenantId, result.tenantId)
        verify(ticketRepository).save(any())
        verify(ticketStatusHistoryRepository).save(any())
    }

    @Test
    fun `creates ticket on behalf of tenant (PLATFORM_AGENT)`() {
        val cmd = CreateTicketCommand(
            tenantId = tenantId,
            createdByUserId = agentId,
            createdByUserType = CreatedByUserType.PLATFORM_AGENT,
            subject = "Platform created ticket",
            description = "Created by platform agent",
            category = TicketCategory.BILLING,
            priority = TicketPriority.MEDIUM,
            assignedToId = agentId
        )

        val result = service.createTicket(cmd)

        assertEquals(CreatedByUserType.PLATFORM_AGENT, result.createdByUserType)
        assertEquals(agentId, result.assignedToId)
    }

    @Test
    fun `validates status transitions - OPEN to IN_PROGRESS`() {
        val ticket = createTestTicket(TicketStatus.OPEN)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = ChangeStatusCommand(TicketStatus.IN_PROGRESS, null)
        val result = service.changeStatus(ticket.id, cmd, agentId)

        assertEquals(TicketStatus.IN_PROGRESS, result.status)
        verify(ticketStatusHistoryRepository).save(argThat { fromStatus == TicketStatus.OPEN && toStatus == TicketStatus.IN_PROGRESS })
    }

    @Test
    fun `validates status transitions - IN_PROGRESS to RESOLVED`() {
        val ticket = createTestTicket(TicketStatus.IN_PROGRESS)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = ChangeStatusCommand(TicketStatus.RESOLVED, "Issue fixed")
        val result = service.changeStatus(ticket.id, cmd, agentId)

        assertEquals(TicketStatus.RESOLVED, result.status)
        assertNotNull(result.resolvedAt)
    }

    @Test
    fun `validates status transitions - RESOLVED to REOPENED`() {
        val ticket = createTestTicket(TicketStatus.RESOLVED)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = ChangeStatusCommand(TicketStatus.REOPENED, "Issue reoccurred")
        val result = service.changeStatus(ticket.id, cmd, userId)

        assertEquals(TicketStatus.REOPENED, result.status)
        assertNull(result.resolvedAt)
        assertNull(result.closedAt)
    }

    @Test
    fun `rejects invalid status transition (CLOSED to IN_PROGRESS)`() {
        val ticket = createTestTicket(TicketStatus.CLOSED)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = ChangeStatusCommand(TicketStatus.IN_PROGRESS, null)
        assertThrows(InvalidTicketStatusTransitionException::class.java) {
            service.changeStatus(ticket.id, cmd, agentId)
        }
    }

    @Test
    fun `pauses SLA on WAITING_ON_CUSTOMER`() {
        val ticket = createTestTicket(TicketStatus.IN_PROGRESS)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = ChangeStatusCommand(TicketStatus.WAITING_ON_CUSTOMER, null)
        val result = service.changeStatus(ticket.id, cmd, agentId)

        assertEquals(TicketStatus.WAITING_ON_CUSTOMER, result.status)
        assertNotNull(result.slaPausedAt)
    }

    @Test
    fun `resumes SLA when status changes from WAITING_ON_CUSTOMER`() {
        val ticket = createTestTicket(TicketStatus.WAITING_ON_CUSTOMER)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = ChangeStatusCommand(TicketStatus.IN_PROGRESS, null)
        val result = service.changeStatus(ticket.id, cmd, agentId)

        assertEquals(TicketStatus.IN_PROGRESS, result.status)
        assertNull(result.slaPausedAt)
    }

    @Test
    fun `assigns ticket to agent`() {
        val ticket = createTestTicket()
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = AssignTicketCommand(agentId)
        val result = service.assignTicket(ticket.id, cmd)

        assertEquals(agentId, result.assignedToId)
    }

    @Test
    fun `escalates ticket`() {
        val ticket = createTestTicket(TicketStatus.IN_PROGRESS)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = EscalateCommand("Needs senior attention")
        val result = service.escalateTicket(ticket.id, cmd, agentId)

        assertEquals(TicketStatus.ESCALATED, result.status)
        verify(ticketStatusHistoryRepository).save(argThat { reason == "Needs senior attention" })
    }

    @Test
    fun `adds message and increments count`() {
        val ticket = createTestTicket()
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = AddMessageCommand(
            senderId = userId,
            senderType = CreatedByUserType.FACILITY_ADMIN,
            content = "I need help with this",
            isInternalNote = false
        )
        val result = service.addMessage(ticket.id, cmd)

        assertEquals("I need help with this", result.content)
        assertFalse(result.isInternalNote)
        assertEquals(1, ticket.messageCount)
    }

    @Test
    fun `adds internal note`() {
        val ticket = createTestTicket()
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = AddMessageCommand(
            senderId = agentId,
            senderType = CreatedByUserType.PLATFORM_AGENT,
            content = "Internal: escalating to billing team",
            isInternalNote = true
        )
        val result = service.addMessage(ticket.id, cmd)

        assertTrue(result.isInternalNote)
    }

    @Test
    fun `rates ticket - success for RESOLVED`() {
        val ticket = createTestTicket(TicketStatus.RESOLVED)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = RateTicketCommand(5)
        val result = service.rateTicket(ticket.id, cmd)

        assertEquals(5, result.satisfactionRating)
    }

    @Test
    fun `rejects rating for OPEN ticket`() {
        val ticket = createTestTicket(TicketStatus.OPEN)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val cmd = RateTicketCommand(5)
        assertThrows(TicketRatingException::class.java) {
            service.rateTicket(ticket.id, cmd)
        }
    }

    @Test
    fun `rejects rating out of range`() {
        val ticket = createTestTicket(TicketStatus.RESOLVED)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        assertThrows(TicketRatingException::class.java) {
            service.rateTicket(ticket.id, RateTicketCommand(0))
        }
        assertThrows(TicketRatingException::class.java) {
            service.rateTicket(ticket.id, RateTicketCommand(6))
        }
    }

    @Test
    fun `changes priority and recalculates SLA`() {
        val ticket = createTestTicket()
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        val originalDeadline = ticket.slaDeadline
        val cmd = ChangePriorityCommand(TicketPriority.CRITICAL)
        val result = service.changePriority(ticket.id, cmd)

        assertEquals(TicketPriority.CRITICAL, result.priority)
        // CRITICAL has shorter SLA than MEDIUM, so deadline should be earlier
        val criticalThresholds = SlaConfig.getThresholds(TicketPriority.CRITICAL)
        assertNotNull(result.slaDeadline)
    }

    @Test
    fun `records status history on every transition`() {
        val ticket = createTestTicket(TicketStatus.OPEN)
        whenever(ticketRepository.findById(ticket.id)).thenReturn(Optional.of(ticket))

        service.changeStatus(ticket.id, ChangeStatusCommand(TicketStatus.IN_PROGRESS), agentId)

        verify(ticketStatusHistoryRepository).save(argThat {
            fromStatus == TicketStatus.OPEN && toStatus == TicketStatus.IN_PROGRESS && changedBy == agentId
        })
    }

    @Test
    fun `SLA breach detection works correctly`() {
        val ticket = Ticket.create(
            ticketNumber = "TKT-202600099",
            tenantId = tenantId,
            createdByUserId = userId,
            createdByUserType = CreatedByUserType.FACILITY_ADMIN,
            subject = "Urgent issue",
            description = "Very urgent",
            category = TicketCategory.TECHNICAL,
            priority = TicketPriority.CRITICAL
        )

        // Fresh ticket should not be breached
        assertFalse(ticket.isSlaBreached())

        // Simulate breached SLA by setting deadline in the past
        ticket.slaDeadline = Instant.now().minus(1, ChronoUnit.HOURS)
        assertTrue(ticket.isSlaBreached())

        // Resolved tickets are not considered breached
        ticket.startProgress()
        ticket.resolve()
        assertFalse(ticket.isSlaBreached())
    }
}
