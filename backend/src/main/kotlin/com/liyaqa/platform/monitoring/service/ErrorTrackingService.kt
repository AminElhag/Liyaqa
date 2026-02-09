package com.liyaqa.platform.monitoring.service

import com.liyaqa.platform.monitoring.dto.ErrorCounts
import com.liyaqa.platform.monitoring.dto.ErrorSummaryResponse
import com.liyaqa.platform.monitoring.dto.ErrorTypeCount
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.concurrent.ConcurrentLinkedDeque

data class ErrorEvent(
    val timestamp: Instant,
    val statusCode: Int,
    val uri: String,
    val exceptionType: String?
)

@Component
class ErrorTrackingService {

    private val events = ConcurrentLinkedDeque<ErrorEvent>()

    companion object {
        const val MAX_EVENTS = 10_000
        private val RETENTION_PERIOD_DAYS = 30L
    }

    fun recordError(statusCode: Int, uri: String, exceptionType: String?) {
        events.addLast(ErrorEvent(Instant.now(), statusCode, uri, exceptionType))
        pruneOldEvents()
    }

    fun getErrorSummary(): ErrorSummaryResponse {
        val now = Instant.now()
        val cutoff24h = now.minus(24, ChronoUnit.HOURS)
        val cutoff7d = now.minus(7, ChronoUnit.DAYS)
        val cutoff30d = now.minus(30, ChronoUnit.DAYS)

        val allEvents = events.toList()

        val last24h = allEvents.filter { it.timestamp.isAfter(cutoff24h) }
        val last7d = allEvents.filter { it.timestamp.isAfter(cutoff7d) }
        val last30d = allEvents.filter { it.timestamp.isAfter(cutoff30d) }

        val topErrors = last30d
            .groupBy { it.exceptionType ?: "HTTP ${it.statusCode}" }
            .map { (type, typeEvents) ->
                ErrorTypeCount(
                    type = type,
                    count = typeEvents.size.toLong(),
                    lastOccurred = typeEvents.maxOfOrNull { it.timestamp }
                )
            }
            .sortedByDescending { it.count }
            .take(10)

        return ErrorSummaryResponse(
            last24Hours = toCounts(last24h),
            last7Days = toCounts(last7d),
            last30Days = toCounts(last30d),
            topErrors = topErrors
        )
    }

    private fun toCounts(events: List<ErrorEvent>): ErrorCounts {
        return ErrorCounts(
            total = events.size.toLong(),
            serverErrors = events.count { it.statusCode in 500..599 }.toLong(),
            clientErrors = events.count { it.statusCode in 400..499 }.toLong()
        )
    }

    private fun pruneOldEvents() {
        val cutoff = Instant.now().minus(RETENTION_PERIOD_DAYS, ChronoUnit.DAYS)

        while (events.size > MAX_EVENTS || (events.peekFirst()?.timestamp?.isBefore(cutoff) == true)) {
            events.pollFirst() ?: break
        }
    }
}
