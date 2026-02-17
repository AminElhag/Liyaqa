package com.liyaqa.config

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.resilience4j.ratelimiter.RateLimiter
import io.github.resilience4j.ratelimiter.RequestNotPermitted
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Instant

/**
 * Servlet filter that applies rate limiting to authentication endpoints.
 * Uses Resilience4j RateLimiter to prevent brute force attacks.
 *
 * Protected endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 */
@Component
class RateLimitFilter(
    private val authRateLimiter: RateLimiter,
    private val passwordResetRateLimiter: RateLimiter,
    private val objectMapper: ObjectMapper
) : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(RateLimitFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val path = request.requestURI
        val method = request.method

        // Only apply rate limiting to POST requests on auth endpoints
        if (method == "POST" && shouldRateLimit(path)) {
            try {
                // Get client identifier (IP address or user ID)
                val clientId = getClientIdentifier(request)

                // Apply appropriate rate limiter
                val rateLimiter = when {
                    path.endsWith("/forgot-password") || path.endsWith("/reset-password") ->
                        passwordResetRateLimiter
                    else -> authRateLimiter
                }

                // Check rate limit
                rateLimiter.executeRunnable {
                    logger.debug("Rate limit check passed for $clientId on $path")
                }

                // Continue with filter chain if rate limit not exceeded
                filterChain.doFilter(request, response)

            } catch (e: RequestNotPermitted) {
                // Rate limit exceeded
                handleRateLimitExceeded(request, response, path)
            }
        } else {
            // No rate limiting needed, continue
            filterChain.doFilter(request, response)
        }
    }

    /**
     * Determines if the request path should be rate limited.
     */
    private fun shouldRateLimit(path: String): Boolean {
        return path.contains("/api/auth/login") ||
               path.contains("/api/auth/register") ||
               path.contains("/api/auth/forgot-password") ||
               path.contains("/api/auth/reset-password") ||
               path.contains("/api/platform/auth/login")
    }

    /**
     * Gets a unique identifier for the client (IP address or session).
     * In production, this could be enhanced with:
     * - User ID (if authenticated)
     * - Device fingerprint
     * - Combination of IP + User-Agent
     */
    private fun getClientIdentifier(request: HttpServletRequest): String {
        // Try to get real IP behind proxy
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return when {
            !xForwardedFor.isNullOrBlank() -> xForwardedFor.split(",")[0].trim()
            else -> request.remoteAddr ?: "unknown"
        }
    }

    /**
     * Handles rate limit exceeded by returning 429 Too Many Requests.
     */
    private fun handleRateLimitExceeded(
        request: HttpServletRequest,
        response: HttpServletResponse,
        path: String
    ) {
        val clientId = getClientIdentifier(request)
        logger.warn("Rate limit exceeded for client $clientId on $path")

        response.status = HttpStatus.TOO_MANY_REQUESTS.value()
        response.contentType = "application/json"
        response.characterEncoding = "UTF-8"

        val errorResponse = mapOf(
            "status" to 429,
            "error" to "Too Many Requests",
            "errorAr" to "عدد كبير جداً من الطلبات",
            "message" to "Too many authentication attempts. Please try again later.",
            "messageAr" to "عدد كبير جداً من محاولات المصادقة. يرجى المحاولة لاحقاً.",
            "timestamp" to Instant.now().toString(),
            "path" to path
        )

        response.writer.write(objectMapper.writeValueAsString(errorResponse))
        response.writer.flush()
    }
}
