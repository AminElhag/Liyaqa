package com.liyaqa.platform.monitoring.service

import com.liyaqa.platform.monitoring.dto.ComponentHealthResponse
import com.liyaqa.platform.monitoring.dto.DatabaseHealthResponse
import com.liyaqa.platform.monitoring.dto.ErrorSummaryResponse
import com.liyaqa.platform.monitoring.dto.JvmHealthResponse
import com.liyaqa.platform.monitoring.dto.ScheduledJobResponse
import com.liyaqa.platform.monitoring.dto.SystemHealthResponse
import com.zaxxer.hikari.HikariDataSource
import io.micrometer.core.instrument.MeterRegistry
import jakarta.persistence.EntityManager
import org.springframework.boot.actuate.health.CompositeHealth
import org.springframework.boot.actuate.health.HealthEndpoint
import org.springframework.boot.actuate.health.Status
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import java.time.Instant
import javax.sql.DataSource

@Service
class SystemMonitoringService(
    private val healthEndpoint: HealthEndpoint,
    private val meterRegistry: MeterRegistry,
    private val dataSource: DataSource,
    private val entityManager: EntityManager,
    private val errorTrackingService: ErrorTrackingService,
    private val environment: Environment
) {

    companion object {
        private val JOB_REGISTRY: Map<String, Pair<String, String>> = mapOf(
            "expireSubscriptions" to ("Expire subscriptions past end date" to "Daily 1:00 AM"),
            "expireMembershipPlans" to ("Expire membership plans past end date" to "Daily 1:30 AM"),
            "markOverdueInvoices" to ("Mark invoices past due date as overdue" to "Daily 2:00 AM"),
            "autoCheckoutMembers" to ("Auto checkout members at end of day" to "Daily midnight"),
            "cleanupExpiredTokens" to ("Clean up expired authentication tokens" to "Hourly"),
            "generateMonthlyClientInvoices" to ("Generate monthly client invoices" to "1st of month 6:00 AM"),
            "markOverdueClientInvoices" to ("Mark client invoices past due as overdue" to "Daily 3:00 AM"),
            "checkExpiringTrials" to ("Check and expire trial subscriptions" to "Daily 4:00 AM"),
            "checkOverdueInvoices" to ("Check for overdue subscription invoices" to "Daily 4:30 AM"),
            "generateUpcomingInvoices" to ("Generate upcoming subscription invoices" to "Daily 5:00 AM"),
            "paymentRetryJob" to ("Retry failed payment transactions" to "Daily 10:00 AM"),
            "subscriptionBillingJob" to ("Process subscription billing cycles" to "Daily 2:00 AM")
        )
    }

    fun getSystemHealth(): SystemHealthResponse {
        val health = healthEndpoint.health()
        val overallStatus = if (health.status == Status.UP) "UP" else "DOWN"

        val compositeHealth = health as? CompositeHealth
        val dbComponent = compositeHealth?.components?.get("db")
        val redisComponent = compositeHealth?.components?.get("redis")

        val uptimeGauge = meterRegistry.find("process.uptime").gauge()
        val uptimeSeconds = uptimeGauge?.value()?.toLong() ?: 0L

        val memUsedGauge = meterRegistry.find("jvm.memory.used").gauge()
        val memMaxGauge = meterRegistry.find("jvm.memory.max").gauge()
        val memUsedBytes = memUsedGauge?.value()?.toLong() ?: Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()
        val memMaxBytes = memMaxGauge?.value()?.toLong() ?: Runtime.getRuntime().maxMemory()
        val memUsedMb = memUsedBytes / (1024 * 1024)
        val memMaxMb = memMaxBytes / (1024 * 1024)
        val memPercent = if (memMaxMb > 0) (memUsedMb.toDouble() / memMaxMb * 100) else 0.0

        val dbHealth = buildDatabaseHealth(dbComponent?.status)
        val redisStatus = redisComponent?.status?.code ?: "UNKNOWN"

        val activeProfiles = environment.activeProfiles
        val env = when {
            activeProfiles.contains("prod") -> "production"
            activeProfiles.contains("staging") -> "staging"
            activeProfiles.contains("dev") -> "development"
            activeProfiles.contains("local") -> "local"
            else -> activeProfiles.firstOrNull() ?: "default"
        }

        val version = environment.getProperty("liyaqa.version", "1.0.0")

        return SystemHealthResponse(
            status = overallStatus,
            uptimeSeconds = uptimeSeconds,
            uptimeFormatted = formatUptime(uptimeSeconds),
            jvm = JvmHealthResponse(
                memoryUsedMb = memUsedMb,
                memoryMaxMb = memMaxMb,
                memoryUsagePercent = memPercent,
                availableProcessors = Runtime.getRuntime().availableProcessors()
            ),
            database = dbHealth,
            redis = ComponentHealthResponse(status = redisStatus),
            version = version,
            environment = env
        )
    }

    fun getScheduledJobs(): List<ScheduledJobResponse> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(
            "SELECT name, lock_until, locked_at, locked_by FROM shedlock"
        ).resultList as List<Array<Any?>>

        val shedLockData = results.associate { row ->
            val name = row[0] as String
            val lockUntil = (row[1] as? java.sql.Timestamp)?.toInstant()
            val lockedAt = (row[2] as? java.sql.Timestamp)?.toInstant()
            val lockedBy = row[3] as? String
            name to Triple(lockUntil, lockedAt, lockedBy)
        }

        return JOB_REGISTRY.map { (name, info) ->
            val (description, schedule) = info
            val lockData = shedLockData[name]
            val lockUntil = lockData?.first
            val lockedAt = lockData?.second
            val lockedBy = lockData?.third
            val isRunning = lockUntil != null && lockUntil.isAfter(Instant.now())

            ScheduledJobResponse(
                name = name,
                description = description,
                schedule = schedule,
                lastRunAt = lockedAt,
                isRunning = isRunning,
                lockedBy = if (isRunning) lockedBy else null
            )
        }
    }

    fun getErrorSummary(): ErrorSummaryResponse {
        return errorTrackingService.getErrorSummary()
    }

    private fun buildDatabaseHealth(dbStatus: Status?): DatabaseHealthResponse {
        var activeConnections = 0
        var idleConnections = 0
        var maxConnections = 0

        if (dataSource is HikariDataSource) {
            val pool = dataSource.hikariPoolMXBean
            if (pool != null) {
                activeConnections = pool.activeConnections
                idleConnections = pool.idleConnections
                maxConnections = dataSource.maximumPoolSize
            }
        }

        val utilization = if (maxConnections > 0) {
            activeConnections.toDouble() / maxConnections * 100
        } else 0.0

        return DatabaseHealthResponse(
            status = dbStatus?.code ?: "UNKNOWN",
            activeConnections = activeConnections,
            idleConnections = idleConnections,
            maxConnections = maxConnections,
            utilizationPercent = utilization
        )
    }

    private fun formatUptime(seconds: Long): String {
        val days = seconds / 86400
        val hours = (seconds % 86400) / 3600
        val minutes = (seconds % 3600) / 60

        return buildString {
            if (days > 0) append("${days}d ")
            if (hours > 0 || days > 0) append("${hours}h ")
            append("${minutes}m")
        }.trim()
    }
}
