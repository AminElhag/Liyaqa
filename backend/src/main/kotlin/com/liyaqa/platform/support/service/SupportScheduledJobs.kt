package com.liyaqa.platform.support.service

import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.model.TicketStatusHistory
import com.liyaqa.platform.support.repository.TicketMessageRepository
import com.liyaqa.platform.support.repository.TicketRepository
import com.liyaqa.platform.support.repository.TicketStatusHistoryRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Component
class SupportScheduledJobs(
    private val ticketRepository: TicketRepository,
    private val ticketMessageRepository: TicketMessageRepository,
    private val ticketStatusHistoryRepository: TicketStatusHistoryRepository
) {

    private val log = LoggerFactory.getLogger(SupportScheduledJobs::class.java)

    companion object {
        private val SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000")
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    fun autoCloseResolvedTickets() {
        val sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS)
        val resolvedTickets = ticketRepository.findByStatusAndResolvedAtBefore(
            TicketStatus.RESOLVED, sevenDaysAgo
        )

        var closedCount = 0
        for (ticket in resolvedTickets) {
            val resolvedAt = ticket.resolvedAt ?: continue
            val recentMessages = ticketMessageRepository.countByTicketIdAndCreatedAtAfter(
                ticket.id, resolvedAt
            )

            if (recentMessages == 0L) {
                val previousStatus = ticket.close()
                ticketRepository.save(ticket)

                ticketStatusHistoryRepository.save(
                    TicketStatusHistory.create(
                        ticketId = ticket.id,
                        fromStatus = previousStatus,
                        toStatus = TicketStatus.CLOSED,
                        changedBy = SYSTEM_USER_ID,
                        reason = "Auto-closed after 7 days of no activity"
                    )
                )
                closedCount++
            }
        }

        if (closedCount > 0) {
            log.info("Auto-closed {} resolved tickets", closedCount)
        }
    }
}
