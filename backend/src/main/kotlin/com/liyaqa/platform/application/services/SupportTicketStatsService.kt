package com.liyaqa.platform.application.services

import com.liyaqa.platform.domain.model.TicketStatus
import com.liyaqa.platform.domain.ports.SupportTicketRepository
import com.liyaqa.platform.domain.ports.TicketMessageRepository
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration

/**
 * Service for calculating support ticket statistics.
 * Provides aggregated metrics for the support dashboard.
 */
@Service
@Transactional(readOnly = true)
class SupportTicketStatsService(
    private val supportTicketRepository: SupportTicketRepository,
    private val ticketMessageRepository: TicketMessageRepository
) {
    /**
     * Get comprehensive support ticket statistics.
     */
    fun getStats(): SupportTicketStatsResponse {
        val openCount = supportTicketRepository.countByStatus(TicketStatus.OPEN)
        val inProgressCount = supportTicketRepository.countByStatus(TicketStatus.IN_PROGRESS)
        val waitingCount = supportTicketRepository.countByStatus(TicketStatus.WAITING_ON_CLIENT)
        val resolvedCount = supportTicketRepository.countByStatus(TicketStatus.RESOLVED)
        val closedCount = supportTicketRepository.countByStatus(TicketStatus.CLOSED)

        // Calculate average response time (in hours)
        val avgResponseTime = calculateAverageResponseTime()

        return SupportTicketStatsResponse(
            openTickets = openCount,
            inProgressTickets = inProgressCount,
            waitingOnClientTickets = waitingCount,
            resolvedTickets = resolvedCount,
            closedTickets = closedCount,
            averageResponseTime = avgResponseTime
        )
    }

    /**
     * Calculate average response time in hours.
     * Measures the time from ticket creation to the first staff (non-client) response.
     * Only considers tickets that have received at least one staff response.
     */
    private fun calculateAverageResponseTime(): Double {
        // Get all tickets (we'll process in batches for large datasets)
        val tickets = supportTicketRepository.findAll(Pageable.ofSize(1000))

        if (tickets.isEmpty) return 0.0

        val responseTimes = mutableListOf<Long>()

        for (ticket in tickets.content) {
            // Get all messages for this ticket ordered by creation time
            val messages = ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.id)

            // Find the first staff response (not from client and not internal note)
            val firstStaffResponse = messages.firstOrNull { !it.isFromClient && !it.isInternal }

            if (firstStaffResponse != null) {
                // Calculate time difference in hours
                val ticketCreatedAt = ticket.createdAt
                val responseAt = firstStaffResponse.createdAt

                if (ticketCreatedAt != null && responseAt != null) {
                    val durationMinutes = Duration.between(ticketCreatedAt, responseAt).toMinutes()
                    if (durationMinutes >= 0) {
                        responseTimes.add(durationMinutes)
                    }
                }
            }
        }

        if (responseTimes.isEmpty()) return 0.0

        // Calculate average and convert to hours (rounded to 1 decimal place)
        val averageMinutes = responseTimes.average()
        return Math.round(averageMinutes / 60.0 * 10) / 10.0
    }
}

/**
 * Response DTO for support ticket statistics.
 */
data class SupportTicketStatsResponse(
    val openTickets: Long,
    val inProgressTickets: Long,
    val waitingOnClientTickets: Long,
    val resolvedTickets: Long,
    val closedTickets: Long,
    val averageResponseTime: Double // in hours
)
