package com.liyaqa.config

import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import jakarta.servlet.FilterChain
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Filter for cookie-based JWT authentication.
 * Extracts JWT tokens from HTTPOnly cookies instead of Authorization header.
 * Also validates CSRF tokens for state-changing requests.
 */
@Component
class CookieAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider,
    private val csrfTokenProvider: CsrfTokenProvider
) : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(CookieAuthenticationFilter::class.java)

    companion object {
        private const val ACCESS_TOKEN_COOKIE_NAME = "access_token"
        private const val CSRF_TOKEN_HEADER = "X-CSRF-Token"
        private val STATE_CHANGING_METHODS = setOf("POST", "PUT", "DELETE", "PATCH")
        private val CSRF_EXEMPT_PATHS = setOf(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/csrf"
        )
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            // Skip if not using cookie authentication mode
            if (!isCookieAuthMode(request)) {
                filterChain.doFilter(request, response)
                return
            }

            // Extract JWT from cookie
            val jwt = extractJwtFromCookie(request)

            if (jwt != null && jwtTokenProvider.validateAccessToken(jwt)) {
                // Validate CSRF token for state-changing requests
                if (isStateChangingRequest(request) && !isCsrfExemptPath(request)) {
                    if (!validateCsrfToken(request)) {
                        logger.warn("CSRF token validation failed for ${request.method} ${request.requestURI}")
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "CSRF token validation failed")
                        return
                    }
                }

                // Extract user information from JWT
                val userId = jwtTokenProvider.extractUserId(jwt)
                val tenantId = jwtTokenProvider.extractTenantId(jwt)
                val email = jwtTokenProvider.extractEmail(jwt)
                val role = jwtTokenProvider.extractRole(jwt)
                val permissions = jwtTokenProvider.extractPermissions(jwt)

                // Create authentication
                val principal = JwtUserPrincipal(userId, tenantId, email, role, permissions)
                val authorities = permissions.map { SimpleGrantedAuthority(it) }

                val authentication = UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    authorities
                )
                authentication.details = WebAuthenticationDetailsSource().buildDetails(request)

                SecurityContextHolder.getContext().authentication = authentication

                logger.debug("Cookie-based authentication successful for user: $userId")
            }
        } catch (ex: Exception) {
            logger.error("Cookie authentication failed: ${ex.message}", ex)
            // Don't block the request, just don't set authentication
            // The request will be treated as unauthenticated
        }

        filterChain.doFilter(request, response)
    }

    /**
     * Checks if the request is using cookie authentication mode.
     * Determined by presence of access_token cookie OR X-Auth-Mode header.
     */
    private fun isCookieAuthMode(request: HttpServletRequest): Boolean {
        // Check for explicit auth mode header
        val authMode = request.getHeader("X-Auth-Mode")
        if (authMode != null) {
            return authMode.equals("cookie", ignoreCase = true)
        }

        // Check if access_token cookie exists
        val cookies = request.cookies
        if (cookies != null) {
            return cookies.any { it.name == ACCESS_TOKEN_COOKIE_NAME }
        }

        return false
    }

    /**
     * Extracts JWT token from HTTPOnly cookie.
     */
    private fun extractJwtFromCookie(request: HttpServletRequest): String? {
        val cookies = request.cookies ?: return null

        return cookies
            .firstOrNull { it.name == ACCESS_TOKEN_COOKIE_NAME }
            ?.value
    }

    /**
     * Checks if the request is a state-changing operation.
     */
    private fun isStateChangingRequest(request: HttpServletRequest): Boolean {
        return STATE_CHANGING_METHODS.contains(request.method)
    }

    /**
     * Checks if the path is exempt from CSRF validation.
     */
    private fun isCsrfExemptPath(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        return CSRF_EXEMPT_PATHS.any { path.startsWith(it) }
    }

    /**
     * Validates CSRF token from request header.
     */
    private fun validateCsrfToken(request: HttpServletRequest): Boolean {
        val csrfToken = request.getHeader(CSRF_TOKEN_HEADER)
        val sessionId = extractSessionId(request)

        if (sessionId == null) {
            logger.warn("No session ID found for CSRF validation")
            return false
        }

        return csrfTokenProvider.validateToken(sessionId, csrfToken)
    }

    /**
     * Extracts session ID from JWT token in cookie.
     * Uses user ID as session identifier for simplicity.
     */
    private fun extractSessionId(request: HttpServletRequest): String? {
        val jwt = extractJwtFromCookie(request) ?: return null

        return try {
            jwtTokenProvider.extractUserId(jwt).toString()
        } catch (ex: Exception) {
            null
        }
    }
}
