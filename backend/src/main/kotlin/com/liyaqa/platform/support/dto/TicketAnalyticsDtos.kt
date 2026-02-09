package com.liyaqa.platform.support.dto

import com.liyaqa.platform.support.model.TicketCategory
import java.util.UUID

data class TicketOverviewResponse(
    val openCount: Long,
    val inProgressCount: Long,
    val avgResolutionTimeHours: Double,
    val slaCompliancePercent: Double,
    val categoryBreakdown: Map<TicketCategory, Long>
)

data class AgentPerformanceResponse(
    val agentId: UUID,
    val agentName: String?,
    val ticketsAssigned: Long,
    val ticketsResolved: Long,
    val avgResolutionTimeHours: Double,
    val avgSatisfactionRating: Double
)

data class TicketTrendResponse(
    val period: String,
    val ticketsCreated: Long,
    val ticketsResolved: Long,
    val ticketsClosed: Long
)

enum class TrendPeriod {
    DAILY, WEEKLY, MONTHLY
}
