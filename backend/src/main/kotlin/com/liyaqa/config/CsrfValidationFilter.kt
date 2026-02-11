package com.liyaqa.config

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class CsrfValidationFilter(
    private val csrfTokenProvider: CsrfTokenProvider
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(CsrfValidationFilter::class.java)

    companion object {
        private const val CSRF_HEADER_NAME = "X-CSRF-Token"
        private val STATE_CHANGING_METHODS = setOf("POST", "PUT", "DELETE", "PATCH")
        private val CSRF_EXEMPT_PATHS = setOf(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/mfa/verify-login",
            "/api/auth/csrf",
            "/api/platform/auth/login",
            "/api/platform/auth/refresh"
        )
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        if (requiresCsrfValidation(request)) {
            val csrfToken = request.getHeader(CSRF_HEADER_NAME)
            val authentication = SecurityContextHolder.getContext().authentication
            val principal = authentication?.principal as? JwtUserPrincipal

            if (principal == null) {
                log.warn("CSRF validation required but no authenticated user found")
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "CSRF token required")
                return
            }

            val sessionId = principal.userId.toString()

            if (csrfToken == null || !csrfTokenProvider.validateToken(sessionId, csrfToken)) {
                log.warn("Invalid CSRF token for user: userId={}", principal.userId)
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid CSRF token")
                return
            }

            log.debug("CSRF token validated successfully for userId={}", principal.userId)
        }

        filterChain.doFilter(request, response)
    }

    private fun requiresCsrfValidation(request: HttpServletRequest): Boolean {
        if (!STATE_CHANGING_METHODS.contains(request.method)) {
            return false
        }

        // Bearer tokens are inherently CSRF-safe (browsers cannot auto-attach
        // custom headers), so skip CSRF when the client explicitly sends one —
        // even if the access_token cookie is also present as a side-effect.
        if (hasBearerToken(request)) {
            return false
        }

        if (isCookieAuthRequest(request) && !isExemptPath(request)) {
            return true
        }

        return false
    }

    private fun hasBearerToken(request: HttpServletRequest): Boolean {
        val authHeader = request.getHeader("Authorization") ?: return false
        return authHeader.startsWith("Bearer ", ignoreCase = true)
    }

    private fun isCookieAuthRequest(request: HttpServletRequest): Boolean {
        val cookies = request.cookies ?: return false
        return cookies.any { it.name == "access_token" }
    }

    private fun isExemptPath(request: HttpServletRequest): Boolean {
        val requestURI = request.requestURI
        return CSRF_EXEMPT_PATHS.any { requestURI.startsWith(it) }
    }
}
