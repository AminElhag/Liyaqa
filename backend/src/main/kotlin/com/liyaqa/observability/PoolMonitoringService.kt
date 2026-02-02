package com.liyaqa.observability

import com.zaxxer.hikari.HikariDataSource
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.binder.MeterBinder
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import org.springframework.stereotype.Service
import javax.sql.DataSource

/**
 * Service for monitoring connection pool and thread pool metrics
 *
 * Exposes metrics to Prometheus/Grafana for:
 * - Database connection pool utilization
 * - Thread pool queue sizes and active threads
 * - Pool saturation warnings
 *
 * Metrics naming convention:
 * - liyaqa.pool.connection.* for database connection pool
 * - liyaqa.pool.thread.* for async thread pools
 */
@Service
class PoolMonitoringService(
    private val dataSource: DataSource,
    private val meterRegistry: MeterRegistry,
    private val taskExecutor: ThreadPoolTaskExecutor,
    private val notificationExecutor: ThreadPoolTaskExecutor,
    private val backgroundExecutor: ThreadPoolTaskExecutor,
    private val quickExecutor: ThreadPoolTaskExecutor
) : MeterBinder {

    private val logger = LoggerFactory.getLogger(javaClass)

    init {
        bindTo(meterRegistry)
    }

    /**
     * Register custom metrics with Micrometer
     */
    override fun bindTo(registry: MeterRegistry) {
        // Connection pool metrics (HikariCP)
        if (dataSource is HikariDataSource) {
            val hikariDataSource = dataSource as HikariDataSource
            val poolName = hikariDataSource.poolName

            registry.gauge("liyaqa.pool.connection.active", hikariDataSource) { ds ->
                ds.hikariPoolMXBean?.activeConnections?.toDouble() ?: 0.0
            }

            registry.gauge("liyaqa.pool.connection.idle", hikariDataSource) { ds ->
                ds.hikariPoolMXBean?.idleConnections?.toDouble() ?: 0.0
            }

            registry.gauge("liyaqa.pool.connection.total", hikariDataSource) { ds ->
                ds.hikariPoolMXBean?.totalConnections?.toDouble() ?: 0.0
            }

            registry.gauge("liyaqa.pool.connection.waiting", hikariDataSource) { ds ->
                ds.hikariPoolMXBean?.threadsAwaitingConnection?.toDouble() ?: 0.0
            }

            logger.info("Registered connection pool metrics for: {}", poolName)
        }

        // Thread pool metrics
        registerThreadPoolMetrics(registry, "default", taskExecutor)
        registerThreadPoolMetrics(registry, "notification", notificationExecutor)
        registerThreadPoolMetrics(registry, "background", backgroundExecutor)
        registerThreadPoolMetrics(registry, "quick", quickExecutor)

        logger.info("Registered thread pool metrics for 4 executors")
    }

    /**
     * Register metrics for a specific thread pool executor
     */
    private fun registerThreadPoolMetrics(
        registry: MeterRegistry,
        poolName: String,
        executor: ThreadPoolTaskExecutor
    ) {
        // Active threads
        io.micrometer.core.instrument.Gauge.builder("liyaqa.pool.thread.active", executor) { exec ->
            exec.threadPoolExecutor?.activeCount?.toDouble() ?: 0.0
        }
            .tag("pool", poolName)
            .register(registry)

        // Pool size
        io.micrometer.core.instrument.Gauge.builder("liyaqa.pool.thread.size", executor) { exec ->
            exec.threadPoolExecutor?.poolSize?.toDouble() ?: 0.0
        }
            .tag("pool", poolName)
            .register(registry)

        // Queue size
        io.micrometer.core.instrument.Gauge.builder("liyaqa.pool.thread.queue", executor) { exec ->
            exec.threadPoolExecutor?.queue?.size?.toDouble() ?: 0.0
        }
            .tag("pool", poolName)
            .register(registry)

        // Completed tasks
        io.micrometer.core.instrument.Gauge.builder("liyaqa.pool.thread.completed", executor) { exec ->
            exec.threadPoolExecutor?.completedTaskCount?.toDouble() ?: 0.0
        }
            .tag("pool", poolName)
            .register(registry)

        // Queue capacity
        io.micrometer.core.instrument.Gauge.builder("liyaqa.pool.thread.queue.capacity", executor) { exec ->
            exec.queueCapacity.toDouble()
        }
            .tag("pool", poolName)
            .register(registry)

        // Max pool size
        io.micrometer.core.instrument.Gauge.builder("liyaqa.pool.thread.max", executor) { exec ->
            exec.maxPoolSize.toDouble()
        }
            .tag("pool", poolName)
            .register(registry)
    }

    /**
     * Log pool health status every 5 minutes
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    fun logPoolHealth() {
        logConnectionPoolHealth()
        logThreadPoolHealth()
    }

    /**
     * Log connection pool health
     */
    private fun logConnectionPoolHealth() {
        if (dataSource is HikariDataSource) {
            val hikariDataSource = dataSource as HikariDataSource
            val pool = hikariDataSource.hikariPoolMXBean

            if (pool != null) {
                val activeConnections = pool.activeConnections
                val totalConnections = pool.totalConnections
                val idleConnections = pool.idleConnections
                val threadsAwaiting = pool.threadsAwaitingConnection
                val maxPoolSize = hikariDataSource.maximumPoolSize

                val utilizationPercent = if (maxPoolSize > 0) {
                    (activeConnections.toDouble() / maxPoolSize * 100).toInt()
                } else 0

                logger.info(
                    "Connection Pool Health - Active: {}/{} ({}%), Idle: {}, Waiting: {}",
                    activeConnections,
                    maxPoolSize,
                    utilizationPercent,
                    idleConnections,
                    threadsAwaiting
                )

                // Warn if pool is saturated
                if (utilizationPercent > 80) {
                    logger.warn(
                        "⚠️ Connection pool utilization high: {}% - Consider increasing pool size or investigating slow queries",
                        utilizationPercent
                    )
                }

                if (threadsAwaiting > 0) {
                    logger.warn(
                        "⚠️ {} threads waiting for database connections - Pool may be saturated",
                        threadsAwaiting
                    )
                }
            }
        }
    }

    /**
     * Log thread pool health for all executors
     */
    private fun logThreadPoolHealth() {
        logExecutorHealth("Default", taskExecutor)
        logExecutorHealth("Notification", notificationExecutor)
        logExecutorHealth("Background", backgroundExecutor)
        logExecutorHealth("Quick", quickExecutor)
    }

    /**
     * Log health for a specific executor
     */
    private fun logExecutorHealth(name: String, executor: ThreadPoolTaskExecutor) {
        val threadPool = executor.threadPoolExecutor ?: return

        val activeThreads = threadPool.activeCount
        val poolSize = threadPool.poolSize
        val maxPoolSize = executor.maxPoolSize
        val queueSize = threadPool.queue.size
        val queueCapacity = executor.queueCapacity
        val completedTasks = threadPool.completedTaskCount

        val poolUtilization = if (maxPoolSize > 0) {
            (poolSize.toDouble() / maxPoolSize * 100).toInt()
        } else 0

        val queueUtilization = if (queueCapacity > 0) {
            (queueSize.toDouble() / queueCapacity * 100).toInt()
        } else 0

        logger.info(
            "Thread Pool Health [{}] - Active: {}/{} ({}%), Queue: {}/{} ({}%), Completed: {}",
            name,
            activeThreads,
            maxPoolSize,
            poolUtilization,
            queueSize,
            queueCapacity,
            queueUtilization,
            completedTasks
        )

        // Warn if pool is saturated
        if (poolUtilization > 80) {
            logger.warn(
                "⚠️ {} thread pool utilization high: {}% - May need larger pool",
                name,
                poolUtilization
            )
        }

        if (queueUtilization > 80) {
            logger.warn(
                "⚠️ {} thread pool queue filling up: {}% - Tasks may be delayed",
                name,
                queueUtilization
            )
        }
    }

    /**
     * Get current connection pool statistics
     */
    fun getConnectionPoolStats(): ConnectionPoolStats? {
        if (dataSource is HikariDataSource) {
            val hikariDataSource = dataSource as HikariDataSource
            val pool = hikariDataSource.hikariPoolMXBean ?: return null

            return ConnectionPoolStats(
                poolName = hikariDataSource.poolName,
                activeConnections = pool.activeConnections,
                idleConnections = pool.idleConnections,
                totalConnections = pool.totalConnections,
                threadsAwaitingConnection = pool.threadsAwaitingConnection,
                maxPoolSize = hikariDataSource.maximumPoolSize,
                minIdle = hikariDataSource.minimumIdle
            )
        }
        return null
    }

    /**
     * Get thread pool statistics for all executors
     */
    fun getThreadPoolStats(): Map<String, ThreadPoolStats> {
        return mapOf(
            "default" to getExecutorStats(taskExecutor),
            "notification" to getExecutorStats(notificationExecutor),
            "background" to getExecutorStats(backgroundExecutor),
            "quick" to getExecutorStats(quickExecutor)
        )
    }

    /**
     * Get statistics for a specific executor
     */
    private fun getExecutorStats(executor: ThreadPoolTaskExecutor): ThreadPoolStats {
        val threadPool = executor.threadPoolExecutor

        return ThreadPoolStats(
            activeThreads = threadPool?.activeCount ?: 0,
            poolSize = threadPool?.poolSize ?: 0,
            maxPoolSize = executor.maxPoolSize,
            corePoolSize = executor.corePoolSize,
            queueSize = threadPool?.queue?.size ?: 0,
            queueCapacity = executor.queueCapacity,
            completedTaskCount = threadPool?.completedTaskCount ?: 0L
        )
    }
}

/**
 * Connection pool statistics snapshot
 */
data class ConnectionPoolStats(
    val poolName: String,
    val activeConnections: Int,
    val idleConnections: Int,
    val totalConnections: Int,
    val threadsAwaitingConnection: Int,
    val maxPoolSize: Int,
    val minIdle: Int
) {
    val utilizationPercent: Int
        get() = if (maxPoolSize > 0) (activeConnections * 100 / maxPoolSize) else 0

    val availableConnections: Int
        get() = maxPoolSize - activeConnections
}

/**
 * Thread pool statistics snapshot
 */
data class ThreadPoolStats(
    val activeThreads: Int,
    val poolSize: Int,
    val maxPoolSize: Int,
    val corePoolSize: Int,
    val queueSize: Int,
    val queueCapacity: Int,
    val completedTaskCount: Long
) {
    val poolUtilizationPercent: Int
        get() = if (maxPoolSize > 0) (poolSize * 100 / maxPoolSize) else 0

    val queueUtilizationPercent: Int
        get() = if (queueCapacity > 0) (queueSize * 100 / queueCapacity) else 0

    val availableThreads: Int
        get() = maxPoolSize - activeThreads
}
