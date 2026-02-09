package com.liyaqa.platform.support.model

import java.time.Instant

data class SlaThresholds(val responseHours: Long, val resolutionHours: Long)

object SlaConfig {

    private val thresholds = mapOf(
        TicketPriority.CRITICAL to SlaThresholds(responseHours = 4, resolutionHours = 8),
        TicketPriority.HIGH to SlaThresholds(responseHours = 8, resolutionHours = 24),
        TicketPriority.MEDIUM to SlaThresholds(responseHours = 24, resolutionHours = 72),
        TicketPriority.LOW to SlaThresholds(responseHours = 48, resolutionHours = 168)
    )

    fun getThresholds(priority: TicketPriority): SlaThresholds =
        thresholds[priority] ?: thresholds[TicketPriority.MEDIUM]!!

    fun calculateResponseDeadline(priority: TicketPriority, createdAt: Instant): Instant {
        val sla = getThresholds(priority)
        return createdAt.plusSeconds(sla.responseHours * 3600)
    }

    fun calculateResolutionDeadline(priority: TicketPriority, createdAt: Instant): Instant {
        val sla = getThresholds(priority)
        return createdAt.plusSeconds(sla.resolutionHours * 3600)
    }
}
