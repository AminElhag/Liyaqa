package com.liyaqa.config

import io.micrometer.observation.ObservationRegistry
import io.micrometer.observation.aop.ObservedAspect
import io.micrometer.tracing.Tracer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.EnableAspectJAutoProxy

/**
 * Distributed Tracing Configuration
 *
 * Configures OpenTelemetry distributed tracing with Zipkin exporter.
 * Enables automatic span creation for @Observed methods and manual
 * span creation for custom business operations.
 *
 * Features:
 * - Automatic instrumentation of HTTP requests
 * - Custom span creation for business operations
 * - Trace context propagation across services
 * - Zipkin integration for trace visualization
 *
 * Usage:
 * ```kotlin
 * @Observed(name = "member.create", contextualName = "creating-member")
 * fun createMember(request: CreateMemberRequest): Member {
 *     // Automatically traced
 * }
 *
 * // Or manual span creation:
 * val span = tracer.nextSpan().name("custom-operation").start()
 * try {
 *     span.tag("key", "value")
 *     // Do work
 * } finally {
 *     span.end()
 * }
 * ```
 */
@Configuration
@EnableAspectJAutoProxy
class TracingConfiguration {

    /**
     * Enable @Observed aspect for automatic tracing of annotated methods.
     *
     * This allows adding tracing to any method by simply annotating it with:
     * @Observed(name = "operation-name")
     */
    @Bean
    fun observedAspect(observationRegistry: ObservationRegistry): ObservedAspect {
        return ObservedAspect(observationRegistry)
    }

    /**
     * Tracer bean for manual span creation.
     *
     * Use this when you need fine-grained control over span lifecycle,
     * such as for long-running operations or when you need to add
     * custom tags/events.
     */
    @Bean
    fun tracerProvider(tracer: Tracer): TracerProvider {
        return TracerProvider(tracer)
    }
}

/**
 * Wrapper class providing convenient tracing utilities.
 *
 * This class provides helper methods for common tracing operations,
 * making it easier to add distributed tracing to business logic.
 */
class TracerProvider(private val tracer: Tracer) {

    /**
     * Execute a block of code within a new span.
     *
     * Creates a new span, executes the block, and ensures the span
     * is properly ended even if an exception occurs.
     *
     * @param name The name of the span (operation name)
     * @param tags Optional map of tags to add to the span
     * @param block The code to execute within the span
     * @return The result of the block execution
     *
     * @throws T Any exception thrown by the block
     */
    fun <T> trace(
        name: String,
        tags: Map<String, String> = emptyMap(),
        block: (io.micrometer.tracing.Span) -> T
    ): T {
        val span = tracer.nextSpan().name(name)

        // Add tags
        tags.forEach { (key, value) ->
            span.tag(key, value)
        }

        return span.start().use { runningSpan ->
            try {
                block(runningSpan)
            } catch (e: Exception) {
                runningSpan.error(e)
                throw e
            }
        }
    }

    /**
     * Get the current trace ID.
     *
     * Useful for logging or correlating operations across services.
     *
     * @return The current trace ID, or null if no trace is active
     */
    fun currentTraceId(): String? {
        return tracer.currentSpan()?.context()?.traceId()
    }

    /**
     * Get the current span ID.
     *
     * Useful for logging or debugging.
     *
     * @return The current span ID, or null if no span is active
     */
    fun currentSpanId(): String? {
        return tracer.currentSpan()?.context()?.spanId()
    }

    /**
     * Add a custom event to the current span.
     *
     * Events can be used to mark important milestones or state changes
     * within an operation.
     *
     * @param name The event name
     */
    fun addEvent(name: String) {
        tracer.currentSpan()?.event(name)
    }

    /**
     * Add a tag to the current span.
     *
     * Tags are key-value metadata that can be used for filtering
     * and analysis in the tracing UI.
     *
     * @param key The tag key
     * @param value The tag value
     */
    fun addTag(key: String, value: String) {
        tracer.currentSpan()?.tag(key, value)
    }
}

/**
 * Extension function to use Span as a resource.
 *
 * This allows using Kotlin's use{} syntax for automatic span cleanup.
 */
private inline fun <T> io.micrometer.tracing.Span.use(block: (io.micrometer.tracing.Span) -> T): T {
    try {
        return block(this)
    } finally {
        this.end()
    }
}
