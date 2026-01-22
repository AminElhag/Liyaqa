package com.liyaqa.config

import com.liyaqa.shared.application.services.RateLimitResult
import com.liyaqa.shared.application.services.RateLimitService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Comprehensive rate limiting filter for all API endpoints.
 * Uses database-backed persistence for consistency across restarts
 * and multi-instance deployments.
 *
 * Features:
 * - Tiered rate limits based on endpoint type
 * - User-based limiting for authenticated requests (fairer for shared IPs)
 * - IP-based limiting for anonymous requests
 * - Role-based multipliers (admins get higher limits)
 * - Rate limit headers in responses
 * - Persistent counters (survives restarts)
 *
 * Tiers:
 * - AUTH_LOGIN: 5 req/min (login attempts)
 * - AUTH_REGISTER: 3 req/min (registration)
 * - AUTH_PASSWORD: 3 req/min (password reset)
 * - AUTH_GENERAL: 10 req/min (other auth endpoints)
 * - RESOURCE_INTENSIVE: 10 req/min (PDF generation, exports)
 * - SEARCH: 60 req/min (search/filter endpoints)
 * - WRITE: 30 req/min (POST, PUT, DELETE)
 * - READ: 100 req/min (GET operations)
 */
@Component
class RateLimitingFilter(
    private val rateLimitService: RateLimitService
) : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(RateLimitingFilter::class.java)

    /**
     * Rate limit tiers with requests per minute.
     */
    enum class RateLimitTier(val requestsPerMinute: Int, val description: String) {
        AUTH_LOGIN(5, "Login attempts"),
        AUTH_REGISTER(3, "Registration"),
        AUTH_PASSWORD(3, "Password reset"),
        AUTH_GENERAL(10, "Authentication endpoints"),
        RESOURCE_INTENSIVE(10, "PDF/export generation"),
        SEARCH(60, "Search operations"),
        WRITE(30, "Create/Update/Delete operations"),
        READ(100, "Read operations")
    }

    companion object {
        private const val WINDOW_SIZE_MS = 60_000L // 1 minute window

        // Paths to exclude from rate limiting
        private val EXCLUDED_PATHS = setOf(
            "/swagger-ui",
            "/api-docs",
            "/actuator",
            "/health",
            "/favicon.ico"
        )
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val path = request.requestURI
        val method = request.method

        // Skip excluded paths
        if (shouldSkip(path)) {
            filterChain.doFilter(request, response)
            return
        }

        // Only rate limit API paths
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response)
            return
        }

        // Determine rate limit tier
        val tier = determineRateLimitTier(path, method)

        // Get client key (user ID for authenticated, IP for anonymous)
        val clientKey = getClientKey(request)

        // Get role-based multiplier
        val multiplier = getRoleMultiplier(request)
        val effectiveLimit = (tier.requestsPerMinute * multiplier).toInt()

        // Check rate limit using database-backed service
        val result = try {
            rateLimitService.checkAndIncrement(clientKey, tier.name, effectiveLimit)
        } catch (e: Exception) {
            // If database fails, allow the request but log the error
            logger.error("Rate limit check failed, allowing request: ${e.message}")
            filterChain.doFilter(request, response)
            return
        }

        if (!result.allowed) {
            // Rate limit exceeded
            logger.warn("Rate limit exceeded for ${tier.name} (limit: $effectiveLimit/min) - client: $clientKey, path: $path")
            sendRateLimitResponse(response, tier, effectiveLimit, path)
            return
        }

        // Add rate limit headers
        addRateLimitHeaders(response, result)

        filterChain.doFilter(request, response)
    }

    /**
     * Determines the rate limit tier based on the request path and method.
     */
    private fun determineRateLimitTier(path: String, method: String): RateLimitTier {
        // Auth endpoints (strictest limits)
        if (path.startsWith("/api/auth/")) {
            return when {
                path.endsWith("/login") && method == "POST" -> RateLimitTier.AUTH_LOGIN
                path.endsWith("/register") && method == "POST" -> RateLimitTier.AUTH_REGISTER
                path.contains("/password") && method == "POST" -> RateLimitTier.AUTH_PASSWORD
                else -> RateLimitTier.AUTH_GENERAL
            }
        }

        // Resource-intensive endpoints (PDF generation, exports)
        if (path.contains("/pdf") || path.contains("/export") || path.contains("/generate")) {
            return RateLimitTier.RESOURCE_INTENSIVE
        }

        // Dashboard endpoints (resource intensive - aggregation queries)
        if (path.startsWith("/api/dashboard/")) {
            return RateLimitTier.SEARCH
        }

        // Search endpoints (moderate limits)
        if (path.contains("/search") || path.contains("/expiring") || path.contains("/pending")) {
            return RateLimitTier.SEARCH
        }

        // Write vs Read operations
        return when (method) {
            "GET", "HEAD", "OPTIONS" -> RateLimitTier.READ
            "POST", "PUT", "PATCH", "DELETE" -> RateLimitTier.WRITE
            else -> RateLimitTier.READ
        }
    }

    /**
     * Gets the rate limit key based on authentication status.
     * - Authenticated users: Rate limit by user ID (fairer for shared IPs like offices)
     * - Anonymous users: Rate limit by IP address
     */
    private fun getClientKey(request: HttpServletRequest): String {
        val authentication = SecurityContextHolder.getContext().authentication

        return if (authentication != null &&
                   authentication.isAuthenticated &&
                   authentication.principal is UserDetails) {
            // Use user ID for authenticated users
            "user:${(authentication.principal as UserDetails).username}"
        } else {
            // Use IP for anonymous users
            "ip:${getClientIp(request)}"
        }
    }

    /**
     * Gets a role-based multiplier for rate limits.
     * Admins get higher limits to perform bulk operations.
     */
    private fun getRoleMultiplier(request: HttpServletRequest): Double {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication == null || !authentication.isAuthenticated) {
            return 1.0
        }

        val authorities = authentication.authorities.map { it.authority }
        return when {
            "ROLE_SUPER_ADMIN" in authorities -> 3.0  // 3x limit for super admin
            "ROLE_CLUB_ADMIN" in authorities -> 2.0   // 2x limit for club admin
            "ROLE_STAFF" in authorities -> 1.5        // 1.5x limit for staff
            else -> 1.0
        }
    }

    /**
     * Sends a 429 Too Many Requests response with bilingual error message.
     */
    private fun sendRateLimitResponse(
        response: HttpServletResponse,
        tier: RateLimitTier,
        limit: Int,
        path: String
    ) {
        response.status = 429
        response.contentType = "application/json"
        response.characterEncoding = "UTF-8"

        val retryAfterSeconds = WINDOW_SIZE_MS / 1000

        // Add Retry-After header (standard HTTP header)
        response.setHeader("Retry-After", retryAfterSeconds.toString())
        response.setHeader("X-RateLimit-Limit", limit.toString())
        response.setHeader("X-RateLimit-Remaining", "0")
        response.setHeader("X-RateLimit-Reset", ((System.currentTimeMillis() + WINDOW_SIZE_MS) / 1000).toString())

        response.writer.write("""
            {
                "status": 429,
                "error": "Too Many Requests",
                "errorAr": "طلبات كثيرة جداً",
                "message": "Rate limit exceeded for ${tier.description.lowercase()}. Maximum $limit requests per minute. Please try again later.",
                "messageAr": "تم تجاوز حد الطلبات لـ${getArabicDescription(tier)}. الحد الأقصى $limit طلب في الدقيقة. يرجى المحاولة مرة أخرى لاحقاً.",
                "path": "$path",
                "limit": $limit,
                "retryAfter": $retryAfterSeconds
            }
        """.trimIndent())
    }

    /**
     * Gets Arabic description for rate limit tier.
     */
    private fun getArabicDescription(tier: RateLimitTier): String {
        return when (tier) {
            RateLimitTier.AUTH_LOGIN -> "محاولات تسجيل الدخول"
            RateLimitTier.AUTH_REGISTER -> "التسجيل"
            RateLimitTier.AUTH_PASSWORD -> "إعادة تعيين كلمة المرور"
            RateLimitTier.AUTH_GENERAL -> "عمليات المصادقة"
            RateLimitTier.RESOURCE_INTENSIVE -> "إنشاء الملفات"
            RateLimitTier.SEARCH -> "عمليات البحث"
            RateLimitTier.WRITE -> "عمليات الكتابة"
            RateLimitTier.READ -> "عمليات القراءة"
        }
    }

    /**
     * Adds standard rate limit headers to the response.
     */
    private fun addRateLimitHeaders(response: HttpServletResponse, result: RateLimitResult) {
        response.setHeader("X-RateLimit-Limit", result.limit.toString())
        response.setHeader("X-RateLimit-Remaining", result.remaining.toString())
        response.setHeader("X-RateLimit-Reset", result.resetTime.toString())
    }

    /**
     * Checks if the path should be excluded from rate limiting.
     */
    private fun shouldSkip(path: String): Boolean {
        return EXCLUDED_PATHS.any { path.startsWith(it) }
    }

    /**
     * Extracts the client IP address, considering proxy headers.
     */
    private fun getClientIp(request: HttpServletRequest): String {
        // Check for proxy headers
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",").first().trim()
        }

        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp.trim()
        }

        return request.remoteAddr ?: "unknown"
    }
}
