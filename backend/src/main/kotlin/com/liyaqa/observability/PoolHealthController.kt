package com.liyaqa.observability

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * REST API for monitoring connection pool and thread pool health
 *
 * Endpoints:
 * - GET /api/admin/pool/health - Overall pool health status
 * - GET /api/admin/pool/connection - Connection pool statistics
 * - GET /api/admin/pool/threads - Thread pool statistics
 *
 * Should be secured and only accessible to platform administrators
 */
@RestController
@RequestMapping("/api/admin/pool")
class PoolHealthController(
    private val poolMonitoringService: PoolMonitoringService
) {

    /**
     * Get overall pool health status
     */
    @GetMapping("/health")
    fun getPoolHealth(): ResponseEntity<PoolHealthResponse> {
        val connectionStats = poolMonitoringService.getConnectionPoolStats()
        val threadStats = poolMonitoringService.getThreadPoolStats()

        // Determine overall health status
        val issues = mutableListOf<String>()

        // Check connection pool health
        connectionStats?.let { stats ->
            if (stats.utilizationPercent > 80) {
                issues.add("Connection pool utilization high: ${stats.utilizationPercent}%")
            }
            if (stats.threadsAwaitingConnection > 0) {
                issues.add("${stats.threadsAwaitingConnection} threads waiting for connections")
            }
        }

        // Check thread pool health
        threadStats.forEach { (poolName, stats) ->
            if (stats.poolUtilizationPercent > 80) {
                issues.add("$poolName thread pool utilization high: ${stats.poolUtilizationPercent}%")
            }
            if (stats.queueUtilizationPercent > 80) {
                issues.add("$poolName queue filling up: ${stats.queueUtilizationPercent}%")
            }
        }

        val status = when {
            issues.isEmpty() -> HealthStatus.HEALTHY
            issues.size <= 2 -> HealthStatus.WARNING
            else -> HealthStatus.CRITICAL
        }

        return ResponseEntity.ok(
            PoolHealthResponse(
                status = status,
                connectionPool = connectionStats,
                threadPools = threadStats,
                issues = issues
            )
        )
    }

    /**
     * Get connection pool statistics
     */
    @GetMapping("/connection")
    fun getConnectionPoolStats(): ResponseEntity<ConnectionPoolStatsResponse> {
        val stats = poolMonitoringService.getConnectionPoolStats()
            ?: return ResponseEntity.ok(
                ConnectionPoolStatsResponse(
                    available = false,
                    message = "Connection pool statistics not available"
                )
            )

        return ResponseEntity.ok(
            ConnectionPoolStatsResponse(
                available = true,
                stats = stats,
                recommendations = generateConnectionPoolRecommendations(stats)
            )
        )
    }

    /**
     * Get thread pool statistics
     */
    @GetMapping("/threads")
    fun getThreadPoolStats(): ResponseEntity<ThreadPoolStatsResponse> {
        val stats = poolMonitoringService.getThreadPoolStats()

        return ResponseEntity.ok(
            ThreadPoolStatsResponse(
                pools = stats,
                recommendations = generateThreadPoolRecommendations(stats)
            )
        )
    }

    /**
     * Generate recommendations for connection pool configuration
     */
    private fun generateConnectionPoolRecommendations(stats: ConnectionPoolStats): List<String> {
        val recommendations = mutableListOf<String>()

        // High utilization
        if (stats.utilizationPercent > 80) {
            recommendations.add(
                "Consider increasing maximum pool size (current: ${stats.maxPoolSize}). " +
                "Recommended: ${stats.maxPoolSize + 10}"
            )
        }

        // Threads waiting
        if (stats.threadsAwaitingConnection > 0) {
            recommendations.add(
                "Threads are waiting for connections. Increase pool size or investigate slow queries."
            )
        }

        // Low utilization
        if (stats.utilizationPercent < 20 && stats.maxPoolSize > 10) {
            recommendations.add(
                "Pool utilization is low (${stats.utilizationPercent}%). " +
                "Consider reducing maximum pool size to conserve resources."
            )
        }

        // Idle connections
        val idlePercent = if (stats.totalConnections > 0) {
            (stats.idleConnections * 100 / stats.totalConnections)
        } else 0

        if (idlePercent > 50 && stats.totalConnections > stats.minIdle + 5) {
            recommendations.add(
                "${idlePercent}% of connections are idle. " +
                "Pool may be oversized or consider reducing idle-timeout."
            )
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Connection pool configuration looks healthy ✓")
        }

        return recommendations
    }

    /**
     * Generate recommendations for thread pool configuration
     */
    private fun generateThreadPoolRecommendations(allStats: Map<String, ThreadPoolStats>): List<String> {
        val recommendations = mutableListOf<String>()

        allStats.forEach { (poolName, stats) ->
            // High pool utilization
            if (stats.poolUtilizationPercent > 80) {
                recommendations.add(
                    "[$poolName] Thread pool utilization high (${stats.poolUtilizationPercent}%). " +
                    "Consider increasing max pool size from ${stats.maxPoolSize} to ${stats.maxPoolSize + 20}"
                )
            }

            // High queue utilization
            if (stats.queueUtilizationPercent > 80) {
                recommendations.add(
                    "[$poolName] Queue filling up (${stats.queueUtilizationPercent}%). " +
                    "Tasks may be delayed. Consider increasing queue capacity or pool size."
                )
            }

            // Low utilization
            if (stats.poolUtilizationPercent < 10 && stats.maxPoolSize > 20) {
                recommendations.add(
                    "[$poolName] Pool utilization is low (${stats.poolUtilizationPercent}%). " +
                    "Consider reducing max pool size to conserve resources."
                )
            }

            // Empty queue but high pool usage (good sign)
            if (stats.queueSize == 0 && stats.poolUtilizationPercent > 50 && stats.poolUtilizationPercent < 80) {
                recommendations.add(
                    "[$poolName] Pool is efficiently handling load with no queue buildup ✓"
                )
            }
        }

        if (recommendations.isEmpty()) {
            recommendations.add("All thread pools are operating efficiently ✓")
        }

        return recommendations
    }
}

/**
 * Overall pool health response
 */
data class PoolHealthResponse(
    val status: HealthStatus,
    val connectionPool: ConnectionPoolStats?,
    val threadPools: Map<String, ThreadPoolStats>,
    val issues: List<String>
)

/**
 * Connection pool statistics response
 */
data class ConnectionPoolStatsResponse(
    val available: Boolean,
    val stats: ConnectionPoolStats? = null,
    val recommendations: List<String> = emptyList(),
    val message: String? = null
)

/**
 * Thread pool statistics response
 */
data class ThreadPoolStatsResponse(
    val pools: Map<String, ThreadPoolStats>,
    val recommendations: List<String>
)

/**
 * Health status enum
 */
enum class HealthStatus {
    HEALTHY,    // All pools operating normally
    WARNING,    // Some pools approaching capacity
    CRITICAL    // Multiple pools saturated or threads waiting
}
