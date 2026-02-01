package com.liyaqa.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.*

/**
 * Request Logging Filter with MDC Context
 *
 * This filter adds contextual information to every log entry for the duration of a request:
 * - requestId: Unique identifier for each request (for tracing)
 * - userId: ID of the authenticated user
 * - username: Username of the authenticated user
 * - tenantId: Tenant ID from X-Tenant-Id header
 * - traceId/spanId: For distributed tracing (if enabled)
 *
 * Also logs request/response details including:
 * - HTTP method and path
 * - Response status code
 * - Request duration
 * - User agent and IP address
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestLoggingFilter : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(RequestLoggingFilter::class.java)

    companion object {
        // MDC keys
        const val REQUEST_ID = "requestId"
        const val USER_ID = "userId"
        const val USERNAME = "username"
        const val TENANT_ID = "tenantId"
        const val TRACE_ID = "traceId"
        const val SPAN_ID = "spanId"

        // Request attribute to store start time
        private const val START_TIME_ATTR = "requestStartTime"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // Skip logging for health check and actuator endpoints (too noisy)
        if (shouldNotFilter(request)) {
            filterChain.doFilter(request, response)
            return
        }

        val startTime = System.currentTimeMillis()
        request.setAttribute(START_TIME_ATTR, startTime)

        try {
            // Set up MDC context
            setupMDC(request)

            // Log incoming request
            logRequest(request)

            // Continue filter chain
            filterChain.doFilter(request, response)

        } finally {
            try {
                // Log response
                val duration = System.currentTimeMillis() - startTime
                logResponse(request, response, duration)
            } finally {
                // Always clear MDC to prevent memory leaks
                MDC.clear()
            }
        }
    }

    /**
     * Set up MDC context with request information
     */
    private fun setupMDC(request: HttpServletRequest) {
        // Generate or extract request ID
        val requestId = request.getHeader("X-Request-ID")
            ?: UUID.randomUUID().toString()
        MDC.put(REQUEST_ID, requestId)

        // Extract tenant ID from header
        request.getHeader("X-Tenant-ID")?.let { tenantId ->
            MDC.put(TENANT_ID, tenantId)
        }

        // Extract user information from security context
        try {
            val authentication = SecurityContextHolder.getContext().authentication
            if (authentication != null && authentication.isAuthenticated && authentication.principal != "anonymousUser") {
                MDC.put(USERNAME, authentication.name)

                // Try to get user ID from principal details
                // Adjust this based on your UserDetails implementation
                when (val principal = authentication.principal) {
                    is org.springframework.security.core.userdetails.UserDetails -> {
                        MDC.put(USER_ID, principal.username) // Or extract ID from custom UserDetails
                    }
                    else -> {
                        MDC.put(USER_ID, authentication.name)
                    }
                }
            }
        } catch (e: Exception) {
            // Ignore - this happens during authentication
            logger.trace("Could not extract user from security context", e)
        }

        // Support for distributed tracing
        // If you're using Spring Cloud Sleuth or OpenTelemetry, trace IDs will be auto-populated
        request.getHeader("X-B3-TraceId")?.let { traceId ->
            MDC.put(TRACE_ID, traceId)
        }
        request.getHeader("X-B3-SpanId")?.let { spanId ->
            MDC.put(SPAN_ID, spanId)
        }
    }

    /**
     * Log incoming request details
     */
    private fun logRequest(request: HttpServletRequest) {
        val method = request.method
        val uri = request.requestURI
        val queryString = request.queryString?.let { "?$it" } ?: ""
        val remoteAddr = getClientIpAddress(request)
        val userAgent = request.getHeader("User-Agent") ?: "Unknown"

        logger.info(
            "Incoming request: {} {} from {} - User-Agent: {}",
            method,
            uri + queryString,
            remoteAddr,
            userAgent
        )
    }

    /**
     * Log response details
     */
    private fun logResponse(
        request: HttpServletRequest,
        response: HttpServletResponse,
        duration: Long
    ) {
        val method = request.method
        val uri = request.requestURI
        val status = response.status

        // Log at different levels based on status code
        when {
            status < 400 -> logger.info(
                "Request completed: {} {} - Status: {} - Duration: {}ms",
                method, uri, status, duration
            )
            status < 500 -> logger.warn(
                "Request completed with client error: {} {} - Status: {} - Duration: {}ms",
                method, uri, status, duration
            )
            else -> logger.error(
                "Request completed with server error: {} {} - Status: {} - Duration: {}ms",
                method, uri, status, duration
            )
        }

        // Log slow requests (>2 seconds)
        if (duration > 2000) {
            logger.warn(
                "Slow request detected: {} {} took {}ms",
                method, uri, duration
            )
        }
    }

    /**
     * Get client IP address, handling proxies and load balancers
     */
    private fun getClientIpAddress(request: HttpServletRequest): String {
        // Check for common proxy headers
        val headers = listOf(
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        )

        for (header in headers) {
            val ip = request.getHeader(header)
            if (!ip.isNullOrBlank() && ip != "unknown") {
                // X-Forwarded-For can contain multiple IPs, take the first one
                return ip.split(",").first().trim()
            }
        }

        return request.remoteAddr ?: "Unknown"
    }

    /**
     * Skip logging for health checks and actuator endpoints
     */
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI

        return path.startsWith("/actuator/health") ||
                path.startsWith("/actuator/prometheus") ||
                path.startsWith("/health") ||
                path.endsWith(".ico") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs")
    }
}
