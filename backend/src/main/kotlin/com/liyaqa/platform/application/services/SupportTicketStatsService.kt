package com.liyaqa.platform.application.services

import com.liyaqa.platform.domain.model.TicketStatus
import com.liyaqa.platform.domain.ports.SupportTicketRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Service for calculating support ticket statistics.
 * Provides aggregated metrics for the support dashboard.
 */
@Service
@Transactional(readOnly = true)
class SupportTicketStatsService(
    private val supportTicketRepository: SupportTicketRepository
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
        // For now, we'll use a simple calculation based on ticket data
        // In the future, this can be enhanced with actual message timestamps
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
     * Calculate average response time.
     * This is a simplified version that calculates average time to first message.
     * Can be enhanced in the future with actual message-level analytics.
     */
    private fun calculateAverageResponseTime(): Double {
        // For MVP, return a placeholder value
        // TODO: Implement actual calculation using ticket messages
        // This would require joining with ticket_messages table
        // and calculating time difference between ticket creation and first staff response
        return 0.0
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
