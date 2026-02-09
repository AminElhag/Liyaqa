package com.liyaqa.platform.support.service

import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.model.TicketStatusHistory
import com.liyaqa.platform.support.repository.TicketMessageRepository
import com.liyaqa.platform.support.repository.TicketRepository
import com.liyaqa.platform.support.repository.TicketStatusHistoryRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SupportScheduledJobsTest {

    @Mock private lateinit var ticketRepository: TicketRepository
    @Mock private lateinit var ticketMessageRepository: TicketMessageRepository
    @Mock private lateinit var ticketStatusHistoryRepository: TicketStatusHistoryRepository

    private lateinit var scheduledJobs: SupportScheduledJobs

    private val tenantId = UUID.randomUUID()
    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        scheduledJobs = SupportScheduledJobs(
            ticketRepository,
            ticketMessageRepository,
            ticketStatusHistoryRepository
        )
        whenever(ticketRepository.save(any<Ticket>())).thenAnswer { it.arguments[0] }
        whenever(ticketStatusHistoryRepository.save(any<TicketStatusHistory>())).thenAnswer { it.arguments[0] }
    }

    private fun createResolvedTicket(resolvedAt: Instant): Ticket {
        val ticket = Ticket.create(
            ticketNumber = "TKT-2026${(1..99999).random().toString().padStart(5, '0')}",
            tenantId = tenantId,
            createdByUserId = userId,
            createdByUserType = CreatedByUserType.FACILITY_ADMIN,
            subject = "Resolved ticket",
            description = "Already resolved",
            category = TicketCategory.TECHNICAL,
            priority = TicketPriority.MEDIUM
        )
        ticket.startProgress()
        ticket.resolve()
        // Override resolvedAt to simulate age
        ticket.resolvedAt = resolvedAt
        return ticket
    }

    @Test
    fun `auto-closes resolved tickets older than 7 days`() {
        val oldResolvedAt = Instant.now().minus(10, ChronoUnit.DAYS)
        val ticket = createResolvedTicket(oldResolvedAt)

        whenever(ticketRepository.findByStatusAndResolvedAtBefore(eq(TicketStatus.RESOLVED), any()))
            .thenReturn(listOf(ticket))
        whenever(ticketMessageRepository.countByTicketIdAndCreatedAtAfter(eq(ticket.id), any()))
            .thenReturn(0L)

        scheduledJobs.autoCloseResolvedTickets()

        verify(ticketRepository).save(any())
        verify(ticketStatusHistoryRepository).save(any())
    }

    @Test
    fun `does not close resolved tickets with recent messages`() {
        val oldResolvedAt = Instant.now().minus(10, ChronoUnit.DAYS)
        val ticket = createResolvedTicket(oldResolvedAt)

        whenever(ticketRepository.findByStatusAndResolvedAtBefore(eq(TicketStatus.RESOLVED), any()))
            .thenReturn(listOf(ticket))
        whenever(ticketMessageRepository.countByTicketIdAndCreatedAtAfter(eq(ticket.id), any()))
            .thenReturn(2L)  // Has recent messages

        scheduledJobs.autoCloseResolvedTickets()

        verify(ticketRepository, never()).save(any())
    }

    @Test
    fun `does not close tickets in non-RESOLVED status`() {
        whenever(ticketRepository.findByStatusAndResolvedAtBefore(eq(TicketStatus.RESOLVED), any()))
            .thenReturn(emptyList())

        scheduledJobs.autoCloseResolvedTickets()

        verify(ticketRepository, never()).save(any())
        verify(ticketStatusHistoryRepository, never()).save(any())
    }
}
