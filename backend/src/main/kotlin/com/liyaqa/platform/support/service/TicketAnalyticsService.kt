package com.liyaqa.platform.support.service

import com.liyaqa.platform.support.dto.AgentPerformanceResponse
import com.liyaqa.platform.support.dto.TicketOverviewResponse
import com.liyaqa.platform.support.dto.TicketTrendResponse
import com.liyaqa.platform.support.dto.TrendPeriod
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.repository.TicketRepository
import com.liyaqa.platform.support.repository.TicketStatusHistoryRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
@Transactional(readOnly = true)
class TicketAnalyticsService(
    private val ticketRepository: TicketRepository,
    private val ticketStatusHistoryRepository: TicketStatusHistoryRepository
) {

    fun getOverview(): TicketOverviewResponse {
        val openCount = ticketRepository.countByStatus(TicketStatus.OPEN)
        val inProgressCount = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)

        val resolvedTickets = ticketRepository.findByStatus(TicketStatus.RESOLVED) +
                ticketRepository.findByStatus(TicketStatus.CLOSED)

        val avgResolutionTimeHours = if (resolvedTickets.isNotEmpty()) {
            resolvedTickets
                .filter { it.resolvedAt != null }
                .map { Duration.between(it.createdAt, it.resolvedAt).toHours().toDouble() }
                .takeIf { it.isNotEmpty() }
                ?.average() ?: 0.0
        } else 0.0

        val totalTickets = ticketRepository.count()
        val breachedCount = (ticketRepository.findByStatus(TicketStatus.OPEN) +
                ticketRepository.findByStatus(TicketStatus.IN_PROGRESS) +
                ticketRepository.findByStatus(TicketStatus.ESCALATED))
            .count { it.isSlaBreached() }
        val slaCompliancePercent = if (totalTickets > 0) {
            ((totalTickets - breachedCount).toDouble() / totalTickets * 100)
        } else 100.0

        val categoryBreakdown = TicketCategory.entries.associateWith { category ->
            ticketRepository.findByStatus(TicketStatus.OPEN)
                .count { it.category == category }.toLong()
        }.filter { it.value > 0 }

        return TicketOverviewResponse(
            openCount = openCount,
            inProgressCount = inProgressCount,
            avgResolutionTimeHours = avgResolutionTimeHours,
            slaCompliancePercent = slaCompliancePercent,
            categoryBreakdown = categoryBreakdown
        )
    }

    fun getAgentPerformance(): List<AgentPerformanceResponse> {
        val allTickets = ticketRepository.findByStatus(TicketStatus.RESOLVED) +
                ticketRepository.findByStatus(TicketStatus.CLOSED) +
                ticketRepository.findByStatus(TicketStatus.IN_PROGRESS) +
                ticketRepository.findByStatus(TicketStatus.OPEN)

        val agentIds = allTickets.mapNotNull { it.assignedToId }.distinct()

        return agentIds.map { agentId ->
            val agentTickets = allTickets.filter { it.assignedToId == agentId }
            val resolved = agentTickets.filter {
                it.status == TicketStatus.RESOLVED || it.status == TicketStatus.CLOSED
            }
            val avgResolution = resolved
                .filter { it.resolvedAt != null }
                .map { Duration.between(it.createdAt, it.resolvedAt).toHours().toDouble() }
                .takeIf { it.isNotEmpty() }
                ?.average() ?: 0.0
            val avgSatisfaction = resolved
                .mapNotNull { it.satisfactionRating }
                .takeIf { it.isNotEmpty() }
                ?.average() ?: 0.0

            AgentPerformanceResponse(
                agentId = agentId,
                agentName = null,
                ticketsAssigned = agentTickets.size.toLong(),
                ticketsResolved = resolved.size.toLong(),
                avgResolutionTimeHours = avgResolution,
                avgSatisfactionRating = avgSatisfaction
            )
        }
    }

    fun getTrends(period: TrendPeriod): List<TicketTrendResponse> {
        val now = LocalDate.now()
        val periods = when (period) {
            TrendPeriod.DAILY -> (0L until 30).map { now.minusDays(it) to now.minusDays(it - 1) }
            TrendPeriod.WEEKLY -> (0L until 12).map { now.minusWeeks(it) to now.minusWeeks(it - 1) }
            TrendPeriod.MONTHLY -> (0L until 12).map { now.minusMonths(it) to now.minusMonths(it - 1) }
        }

        val allResolved = ticketRepository.findByStatus(TicketStatus.RESOLVED)
        val allClosed = ticketRepository.findByStatus(TicketStatus.CLOSED)
        val allOpen = ticketRepository.findByStatus(TicketStatus.OPEN) +
                ticketRepository.findByStatus(TicketStatus.IN_PROGRESS) +
                allResolved + allClosed

        return periods.map { (start, end) ->
            val startInstant = start.atStartOfDay().toInstant(ZoneOffset.UTC)
            val endInstant = end.atStartOfDay().toInstant(ZoneOffset.UTC)

            val created = allOpen.count {
                it.createdAt >= startInstant && it.createdAt < endInstant
            }.toLong()
            val resolved = allResolved.count {
                it.resolvedAt != null && it.resolvedAt!! >= startInstant && it.resolvedAt!! < endInstant
            }.toLong()
            val closed = allClosed.count {
                it.closedAt != null && it.closedAt!! >= startInstant && it.closedAt!! < endInstant
            }.toLong()

            val formatter = when (period) {
                TrendPeriod.DAILY -> DateTimeFormatter.ofPattern("yyyy-MM-dd")
                TrendPeriod.WEEKLY -> DateTimeFormatter.ofPattern("yyyy-'W'ww")
                TrendPeriod.MONTHLY -> DateTimeFormatter.ofPattern("yyyy-MM")
            }

            TicketTrendResponse(
                period = start.format(formatter),
                ticketsCreated = created,
                ticketsResolved = resolved,
                ticketsClosed = closed
            )
        }.reversed()
    }
}
