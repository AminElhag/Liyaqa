package com.liyaqa.platform.monitoring.service

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class ErrorTrackingServiceTest {

    private lateinit var service: ErrorTrackingService

    @BeforeEach
    fun setUp() {
        service = ErrorTrackingService()
    }

    @Test
    fun `recordError stores events`() {
        service.recordError(404, "/api/test", null)
        service.recordError(500, "/api/error", "NullPointerException")

        val summary = service.getErrorSummary()

        assertEquals(2, summary.last24Hours.total)
        assertEquals(1, summary.last24Hours.serverErrors)
        assertEquals(1, summary.last24Hours.clientErrors)
    }

    @Test
    fun `getErrorSummary aggregates by 24h window correctly`() {
        service.recordError(400, "/api/bad", null)
        service.recordError(401, "/api/auth", null)
        service.recordError(500, "/api/crash", "RuntimeException")
        service.recordError(502, "/api/gateway", null)

        val summary = service.getErrorSummary()

        assertEquals(4, summary.last24Hours.total)
        assertEquals(2, summary.last24Hours.serverErrors)
        assertEquals(2, summary.last24Hours.clientErrors)
    }

    @Test
    fun `getErrorSummary aggregates by 7d and 30d windows`() {
        service.recordError(404, "/api/missing", null)
        service.recordError(500, "/api/error", "IOException")

        val summary = service.getErrorSummary()

        assertEquals(2, summary.last7Days.total)
        assertEquals(2, summary.last30Days.total)
        assertTrue(summary.last7Days.total >= summary.last24Hours.total)
        assertTrue(summary.last30Days.total >= summary.last7Days.total)
    }

    @Test
    fun `getErrorSummary returns top errors grouped by type`() {
        service.recordError(404, "/api/a", null)
        service.recordError(404, "/api/b", null)
        service.recordError(404, "/api/c", null)
        service.recordError(500, "/api/crash", "NullPointerException")
        service.recordError(500, "/api/crash2", "NullPointerException")

        val summary = service.getErrorSummary()

        assertEquals(2, summary.topErrors.size)
        val topError = summary.topErrors[0]
        assertEquals(3, topError.count)
        assertEquals("HTTP 404", topError.type)
    }
}
