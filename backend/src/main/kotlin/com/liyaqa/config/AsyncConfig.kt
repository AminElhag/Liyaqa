package com.liyaqa.config

import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.AsyncConfigurer
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import java.util.concurrent.Executor

/**
 * Configuration for asynchronous task execution.
 * Used for non-blocking operations like audit logging and email sending.
 */
@Configuration
@EnableAsync
class AsyncConfig : AsyncConfigurer {

    /**
     * Configures the thread pool executor for async methods.
     */
    override fun getAsyncExecutor(): Executor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 5
        executor.maxPoolSize = 10
        executor.queueCapacity = 100
        executor.setThreadNamePrefix("async-")
        executor.initialize()
        return executor
    }
}
