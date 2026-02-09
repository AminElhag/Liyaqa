package com.liyaqa.platform.monitoring.dto

import java.time.Instant

data class SystemHealthResponse(
    val status: String,
    val uptimeSeconds: Long,
    val uptimeFormatted: String,
    val jvm: JvmHealthResponse,
    val database: DatabaseHealthResponse,
    val redis: ComponentHealthResponse,
    val version: String,
    val environment: String
)

data class JvmHealthResponse(
    val memoryUsedMb: Long,
    val memoryMaxMb: Long,
    val memoryUsagePercent: Double,
    val availableProcessors: Int
)

data class DatabaseHealthResponse(
    val status: String,
    val activeConnections: Int,
    val idleConnections: Int,
    val maxConnections: Int,
    val utilizationPercent: Double
)

data class ComponentHealthResponse(val status: String)

data class ScheduledJobResponse(
    val name: String,
    val description: String,
    val schedule: String,
    val lastRunAt: Instant?,
    val isRunning: Boolean,
    val lockedBy: String?
)

data class ErrorSummaryResponse(
    val last24Hours: ErrorCounts,
    val last7Days: ErrorCounts,
    val last30Days: ErrorCounts,
    val topErrors: List<ErrorTypeCount>
)

data class ErrorCounts(val total: Long, val serverErrors: Long, val clientErrors: Long)

data class ErrorTypeCount(val type: String, val count: Long, val lastOccurred: Instant?)
