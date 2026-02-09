package com.liyaqa.platform.support.service

import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.repository.TicketRepository
import com.liyaqa.platform.support.repository.TicketStatusHistoryRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TicketAnalyticsServiceTest {

    @Mock private lateinit var ticketRepository: TicketRepository
    @Mock private lateinit var ticketStatusHistoryRepository: TicketStatusHistoryRepository

    private lateinit var service: TicketAnalyticsService

    private val tenantId = UUID.randomUUID()
    private val userId = UUID.randomUUID()
    private val agentId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = TicketAnalyticsService(ticketRepository, ticketStatusHistoryRepository)
    }

    private fun createTicket(
        category: TicketCategory = TicketCategory.TECHNICAL,
        priority: TicketPriority = TicketPriority.MEDIUM,
        assignedTo: UUID? = null
    ): Ticket {
        val ticket = Ticket.create(
            ticketNumber = "TKT-2026${(1..99999).random().toString().padStart(5, '0')}",
            tenantId = tenantId,
            createdByUserId = userId,
            createdByUserType = CreatedByUserType.FACILITY_ADMIN,
            subject = "Test ticket",
            description = "Test description",
            category = category,
            priority = priority
        )
        assignedTo?.let { ticket.assignTo(it) }
        return ticket
    }

    @Test
    fun `calculates overview with correct counts`() {
        val openTickets = listOf(createTicket(), createTicket())
        val inProgressTickets = listOf(createTicket().also { it.startProgress() })

        whenever(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(2L)
        whenever(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(1L)
        whenever(ticketRepository.findByStatus(TicketStatus.OPEN)).thenReturn(openTickets)
        whenever(ticketRepository.findByStatus(TicketStatus.IN_PROGRESS)).thenReturn(inProgressTickets)
        whenever(ticketRepository.findByStatus(TicketStatus.RESOLVED)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.CLOSED)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.ESCALATED)).thenReturn(emptyList())
        whenever(ticketRepository.count()).thenReturn(3L)

        val overview = service.getOverview()

        assertEquals(2L, overview.openCount)
        assertEquals(1L, overview.inProgressCount)
    }

    @Test
    fun `calculates SLA compliance percentage`() {
        val openTickets = listOf(createTicket(), createTicket())

        whenever(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(2L)
        whenever(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(0L)
        whenever(ticketRepository.findByStatus(TicketStatus.OPEN)).thenReturn(openTickets)
        whenever(ticketRepository.findByStatus(TicketStatus.IN_PROGRESS)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.RESOLVED)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.CLOSED)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.ESCALATED)).thenReturn(emptyList())
        whenever(ticketRepository.count()).thenReturn(2L)

        val overview = service.getOverview()

        // No breached tickets -> 100% compliance
        assertEquals(100.0, overview.slaCompliancePercent)
    }

    @Test
    fun `calculates average resolution time`() {
        val resolvedTicket = createTicket().also {
            it.startProgress()
            it.resolve()
        }

        whenever(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(0L)
        whenever(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(0L)
        whenever(ticketRepository.findByStatus(TicketStatus.OPEN)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.IN_PROGRESS)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.RESOLVED)).thenReturn(listOf(resolvedTicket))
        whenever(ticketRepository.findByStatus(TicketStatus.CLOSED)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.ESCALATED)).thenReturn(emptyList())
        whenever(ticketRepository.count()).thenReturn(1L)

        val overview = service.getOverview()

        // Resolution time should be very small (nearly 0) since we just created and resolved it
        assertTrue(overview.avgResolutionTimeHours >= 0.0)
    }

    @Test
    fun `calculates agent performance metrics`() {
        val agent1Ticket = createTicket(assignedTo = agentId).also {
            it.startProgress()
            it.resolve()
            it.rate(4)
        }
        val agent1Ticket2 = createTicket(assignedTo = agentId)

        whenever(ticketRepository.findByStatus(TicketStatus.RESOLVED)).thenReturn(listOf(agent1Ticket))
        whenever(ticketRepository.findByStatus(TicketStatus.CLOSED)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.IN_PROGRESS)).thenReturn(emptyList())
        whenever(ticketRepository.findByStatus(TicketStatus.OPEN)).thenReturn(listOf(agent1Ticket2))

        val performance = service.getAgentPerformance()

        assertEquals(1, performance.size)
        assertEquals(agentId, performance[0].agentId)
        assertEquals(2L, performance[0].ticketsAssigned)
        assertEquals(1L, performance[0].ticketsResolved)
        assertEquals(4.0, performance[0].avgSatisfactionRating)
    }
}
