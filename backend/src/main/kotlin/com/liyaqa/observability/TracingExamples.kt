package com.liyaqa.observability

import com.liyaqa.config.TracerProvider
import io.micrometer.observation.annotation.Observed
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

/**
 * Examples of Distributed Tracing in Liyaqa Backend
 *
 * This file demonstrates various patterns for adding distributed tracing
 * to business operations. Use these patterns as reference when adding
 * tracing to your services.
 *
 * Tracing Levels:
 * 1. Automatic - Spring Boot auto-instruments HTTP requests
 * 2. Declarative - Use @Observed annotation on methods
 * 3. Manual - Use TracerProvider for fine-grained control
 */

/**
 * Example 1: Declarative Tracing with @Observed
 *
 * The @Observed annotation automatically creates spans for method execution.
 * This is the easiest way to add tracing and should be used for most cases.
 *
 * Key attributes:
 * - name: The metric/span name (required)
 * - contextualName: Human-readable operation name
 * - lowCardinalityKeyValues: Tags with low cardinality (e.g., operation type)
 *
 * Best for:
 * - Service method entry points
 * - Controller methods
 * - Repository methods
 * - External API calls
 */
@Service
class TracedMemberService(
    private val tracerProvider: TracerProvider
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Example: Automatic span creation with @Observed
     *
     * This will create a span named "member.create" whenever
     * the method is called. The span will include:
     * - Method execution time
     * - Success/failure status
     * - Any exceptions thrown
     */
    @Observed(
        name = "member.create",
        contextualName = "creating-member",
        lowCardinalityKeyValues = ["operation", "member-creation"]
    )
    fun createMember(email: String, name: String): String {
        logger.info("Creating member: $name")

        // Simulate some work
        Thread.sleep(50)

        // Add custom tag to current span
        tracerProvider.addTag("member.email", email)

        return "member-id-123"
    }

    /**
     * Example: Nested spans for sub-operations
     *
     * The main operation is automatically traced by @Observed.
     * Sub-operations are traced manually using TracerProvider.
     */
    @Observed(
        name = "member.onboarding",
        contextualName = "member-onboarding-flow"
    )
    fun onboardMember(memberId: String) {
        logger.info("Starting onboarding for member: $memberId")

        // Trace sub-operation: Send welcome email
        tracerProvider.trace(
            name = "send-welcome-email",
            tags = mapOf("memberId" to memberId, "emailType" to "welcome")
        ) {
            sendWelcomeEmail(memberId)
        }

        // Trace sub-operation: Create initial subscription
        tracerProvider.trace(
            name = "create-initial-subscription",
            tags = mapOf("memberId" to memberId)
        ) { span ->
            span.tag("plan", "free-trial")
            createSubscription(memberId)
        }

        // Add event to main span
        tracerProvider.addEvent("onboarding-complete")
    }

    private fun sendWelcomeEmail(memberId: String) {
        logger.info("Sending welcome email to: $memberId")
        Thread.sleep(100)
    }

    private fun createSubscription(memberId: String) {
        logger.info("Creating subscription for: $memberId")
        Thread.sleep(75)
    }
}

/**
 * Example 2: Manual Tracing for Complex Operations
 *
 * When you need fine-grained control over span lifecycle,
 * use TracerProvider directly instead of @Observed.
 *
 * Best for:
 * - Long-running operations with multiple phases
 * - Operations that need custom events/tags
 * - Conditional tracing logic
 */
@Service
class TracedBookingService(
    private val tracerProvider: TracerProvider
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Example: Manual span creation with events
     *
     * This demonstrates tracking a multi-phase operation
     * with events marking each phase transition.
     */
    fun processBooking(bookingId: String) {
        tracerProvider.trace(
            name = "booking.process",
            tags = mapOf(
                "bookingId" to bookingId,
                "operation" to "process-booking"
            )
        ) { span ->
            // Phase 1: Validate
            span.event("validation-started")
            validateBooking(bookingId)
            span.event("validation-completed")

            // Phase 2: Reserve spot
            span.event("reservation-started")
            val spotReserved = reserveSpot(bookingId)
            span.tag("spot.reserved", spotReserved.toString())
            span.event("reservation-completed")

            // Phase 3: Send confirmation
            if (spotReserved) {
                span.event("notification-started")
                sendConfirmation(bookingId)
                span.event("notification-completed")
            }

            logger.info("Booking processed: $bookingId (traceId: ${tracerProvider.currentTraceId()})")
        }
    }

    private fun validateBooking(bookingId: String) {
        Thread.sleep(30)
    }

    private fun reserveSpot(bookingId: String): Boolean {
        Thread.sleep(50)
        return true
    }

    private fun sendConfirmation(bookingId: String) {
        Thread.sleep(40)
    }
}

/**
 * Example 3: Tracing External Service Calls
 *
 * When calling external services (payment gateways, SMS APIs, etc.),
 * wrap the calls in spans to track latency and failures.
 *
 * Best for:
 * - HTTP client calls
 * - Database queries (if not auto-instrumented)
 * - Message queue operations
 * - File I/O operations
 */
@Service
class TracedPaymentService(
    private val tracerProvider: TracerProvider
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Observed(
        name = "payment.process",
        contextualName = "processing-payment"
    )
    fun processPayment(amount: Double, currency: String): String {
        logger.info("Processing payment: $amount $currency")

        // Trace external API call
        val transactionId = tracerProvider.trace(
            name = "payment-gateway.charge",
            tags = mapOf(
                "gateway" to "paytabs",
                "amount" to amount.toString(),
                "currency" to currency
            )
        ) { span ->
            try {
                // Simulate API call
                val txId = callPaymentGateway(amount, currency)

                span.tag("transaction.id", txId)
                span.tag("transaction.status", "success")

                txId
            } catch (e: Exception) {
                span.tag("transaction.status", "failed")
                span.error(e)
                throw e
            }
        }

        // Trace database save
        tracerProvider.trace(
            name = "payment.save-transaction",
            tags = mapOf("transactionId" to transactionId)
        ) {
            saveTransaction(transactionId, amount, currency)
        }

        return transactionId
    }

    private fun callPaymentGateway(amount: Double, currency: String): String {
        Thread.sleep(150) // Simulate network latency
        return "txn-${System.currentTimeMillis()}"
    }

    private fun saveTransaction(transactionId: String, amount: Double, currency: String) {
        Thread.sleep(20) // Simulate DB write
    }
}

/**
 * Example 4: Conditional Tracing
 *
 * Sometimes you only want to trace certain operations based on
 * conditions (e.g., expensive operations, error scenarios).
 */
@Service
class TracedReportService(
    private val tracerProvider: TracerProvider
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun generateReport(reportType: String, dateRange: String) {
        // Only trace expensive reports
        if (reportType in listOf("ANNUAL", "COMPREHENSIVE", "AUDIT")) {
            tracerProvider.trace(
                name = "report.generate-expensive",
                tags = mapOf(
                    "reportType" to reportType,
                    "dateRange" to dateRange,
                    "expensive" to "true"
                )
            ) {
                doGenerateReport(reportType, dateRange)
            }
        } else {
            // Simple reports don't need tracing overhead
            doGenerateReport(reportType, dateRange)
        }
    }

    private fun doGenerateReport(reportType: String, dateRange: String) {
        Thread.sleep(200)
        logger.info("Generated $reportType report for $dateRange")
    }
}

/**
 * Example 5: Error Tracking in Traces
 *
 * Properly recording errors in spans helps with debugging
 * and alerting in production.
 */
@Service
class TracedNotificationService(
    private val tracerProvider: TracerProvider
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Observed(name = "notification.send")
    fun sendNotification(userId: String, message: String, channel: String) {
        tracerProvider.trace(
            name = "notification.deliver",
            tags = mapOf(
                "channel" to channel,
                "userId" to userId
            )
        ) { span ->
            try {
                when (channel) {
                    "EMAIL" -> sendEmail(userId, message)
                    "SMS" -> sendSMS(userId, message)
                    "PUSH" -> sendPush(userId, message)
                    else -> throw IllegalArgumentException("Unknown channel: $channel")
                }

                span.tag("delivery.status", "success")
                tracerProvider.addEvent("notification-delivered")

            } catch (e: Exception) {
                span.tag("delivery.status", "failed")
                span.tag("error.type", e.javaClass.simpleName)
                span.error(e)

                logger.error("Failed to send notification via $channel to $userId", e)
                throw e
            }
        }
    }

    private fun sendEmail(userId: String, message: String) {
        Thread.sleep(50)
    }

    private fun sendSMS(userId: String, message: String) {
        Thread.sleep(80)
    }

    private fun sendPush(userId: String, message: String) {
        Thread.sleep(30)
    }
}

/**
 * Best Practices for Distributed Tracing:
 *
 * 1. **Span Naming:**
 *    - Use dot notation: "resource.operation" (e.g., "member.create", "payment.process")
 *    - Be consistent across services
 *    - Use lowercase with hyphens for operations
 *
 * 2. **Tags:**
 *    - Add important business context (userId, tenantId, etc.)
 *    - Keep tag values low cardinality (don't use UUIDs as tag values)
 *    - Use consistent tag names across services
 *
 * 3. **Events:**
 *    - Mark important milestones in long operations
 *    - Use for phase transitions
 *    - Keep event names descriptive
 *
 * 4. **Error Handling:**
 *    - Always call span.error(exception) when catching exceptions
 *    - Add error.type tag for categorization
 *    - Let exceptions propagate after recording
 *
 * 5. **Performance:**
 *    - Use sampling in production (10-20% of requests)
 *    - Don't create too many spans (< 100 per request)
 *    - Avoid tracing hot paths unless necessary
 *
 * 6. **Correlation:**
 *    - Include traceId in log messages
 *    - Propagate trace context to async operations
 *    - Use baggage for cross-service metadata
 */
