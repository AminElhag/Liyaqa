package com.liyaqa.config

import org.slf4j.LoggerFactory
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.AsyncConfigurer
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import java.util.concurrent.Executor
import java.util.concurrent.ThreadPoolExecutor

/**
 * Optimized configuration for asynchronous task execution
 *
 * Thread Pool Strategy:
 * - Default executor: General-purpose async operations (audit logging, etc.)
 * - Notification executor: Email and SMS sending (isolated from other tasks)
 * - Background executor: Long-running background jobs (reports, cleanup)
 * - Quick executor: Fast operations that need immediate execution (webhooks)
 *
 * Pool Sizing Formula:
 * - Core size: Number of CPU cores (for I/O-bound tasks: cores * 2)
 * - Max size: Core size * 2-4 (depending on workload)
 * - Queue capacity: Max size * 10-50 (higher for bursty workloads)
 *
 * Rejection Policy:
 * - CallerRunsPolicy: Caller thread executes task when pool is full
 *   (prevents OutOfMemory errors, provides backpressure)
 */
@Configuration
@EnableAsync
class AsyncConfig : AsyncConfigurer {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Default executor for general async operations
     * Used when no specific executor is specified
     */
    override fun getAsyncExecutor(): Executor {
        return defaultExecutor()
    }

    /**
     * Default async executor
     *
     * Core: 10 threads (2x typical server cores)
     * Max: 40 threads (4x core)
     * Queue: 500 tasks
     *
     * Use for: General async operations, audit logging, cache updates
     */
    @Bean(name = ["taskExecutor", "defaultExecutor"])
    fun defaultExecutor(): ThreadPoolTaskExecutor {
        logger.info("Configuring default async executor")

        val executor = ThreadPoolTaskExecutor()

        // Pool sizing
        executor.corePoolSize = 10
        executor.maxPoolSize = 40
        executor.queueCapacity = 500

        // Thread configuration
        executor.setThreadNamePrefix("async-default-")
        executor.setAwaitTerminationSeconds(60)
        executor.setWaitForTasksToCompleteOnShutdown(true)

        // Rejection policy: Caller runs task if pool is full (backpressure)
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())

        executor.initialize()

        logger.info(
            "Default executor initialized: core={}, max={}, queue={}",
            executor.corePoolSize,
            executor.maxPoolSize,
            executor.queueCapacity
        )

        return executor
    }

    /**
     * Notification executor for email and SMS sending
     *
     * Core: 5 threads (moderate concurrency)
     * Max: 20 threads
     * Queue: 1000 tasks (high capacity for email bursts)
     *
     * Use for: Email sending, SMS sending, push notifications
     *
     * Isolated from other tasks to prevent email delays when system is busy
     */
    @Bean(name = ["notificationExecutor"])
    fun notificationExecutor(): ThreadPoolTaskExecutor {
        logger.info("Configuring notification async executor")

        val executor = ThreadPoolTaskExecutor()

        // Pool sizing (optimized for I/O-bound email/SMS operations)
        executor.corePoolSize = 5
        executor.maxPoolSize = 20
        executor.queueCapacity = 1000

        // Thread configuration
        executor.setThreadNamePrefix("async-notification-")
        executor.setAwaitTerminationSeconds(120) // Allow 2 minutes for email sends to complete
        executor.setWaitForTasksToCompleteOnShutdown(true)

        // Rejection policy
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())

        executor.initialize()

        logger.info(
            "Notification executor initialized: core={}, max={}, queue={}",
            executor.corePoolSize,
            executor.maxPoolSize,
            executor.queueCapacity
        )

        return executor
    }

    /**
     * Background executor for long-running jobs
     *
     * Core: 3 threads (limited concurrency to avoid resource contention)
     * Max: 10 threads
     * Queue: 200 tasks
     *
     * Use for: Report generation, data cleanup, analytics processing
     *
     * Limited pool size to prevent resource exhaustion from heavy operations
     */
    @Bean(name = ["backgroundExecutor"])
    fun backgroundExecutor(): ThreadPoolTaskExecutor {
        logger.info("Configuring background job executor")

        val executor = ThreadPoolTaskExecutor()

        // Pool sizing (limited for resource-intensive operations)
        executor.corePoolSize = 3
        executor.maxPoolSize = 10
        executor.queueCapacity = 200

        // Thread configuration
        executor.setThreadNamePrefix("async-background-")
        executor.setAwaitTerminationSeconds(300) // Allow 5 minutes for background jobs
        executor.setWaitForTasksToCompleteOnShutdown(true)

        // Rejection policy
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())

        executor.initialize()

        logger.info(
            "Background executor initialized: core={}, max={}, queue={}",
            executor.corePoolSize,
            executor.maxPoolSize,
            executor.queueCapacity
        )

        return executor
    }

    /**
     * Quick executor for fast, time-sensitive operations
     *
     * Core: 15 threads (high concurrency)
     * Max: 50 threads
     * Queue: 200 tasks (smaller queue for fast processing)
     *
     * Use for: Webhook calls, event publishing, cache invalidation
     *
     * High concurrency for operations that must complete quickly
     */
    @Bean(name = ["quickExecutor"])
    fun quickExecutor(): ThreadPoolTaskExecutor {
        logger.info("Configuring quick task executor")

        val executor = ThreadPoolTaskExecutor()

        // Pool sizing (optimized for quick operations)
        executor.corePoolSize = 15
        executor.maxPoolSize = 50
        executor.queueCapacity = 200

        // Thread configuration
        executor.setThreadNamePrefix("async-quick-")
        executor.setAwaitTerminationSeconds(30) // Quick tasks should finish fast
        executor.setWaitForTasksToCompleteOnShutdown(true)

        // Rejection policy
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())

        executor.initialize()

        logger.info(
            "Quick executor initialized: core={}, max={}, queue={}",
            executor.corePoolSize,
            executor.maxPoolSize,
            executor.queueCapacity
        )

        return executor
    }

    /**
     * Exception handler for uncaught async exceptions
     */
    override fun getAsyncUncaughtExceptionHandler(): AsyncUncaughtExceptionHandler {
        return AsyncUncaughtExceptionHandler { throwable, method, params ->
            logger.error(
                "Uncaught async exception in method: {} with params: {}",
                method.name,
                params.contentToString(),
                throwable
            )

            // TODO: Send alert to monitoring system for critical errors
            // alertingService.sendAlert("Async task failed", throwable)
        }
    }
}
