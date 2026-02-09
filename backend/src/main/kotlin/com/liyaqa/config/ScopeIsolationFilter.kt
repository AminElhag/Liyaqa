package com.liyaqa.config

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.filter.ApiKeyPrincipal
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Enforces scope isolation between platform users and facility/client users.
 *
 * - Platform users (scope=platform) can only access /api/platform/ and /api/v1/platform/
 * - Facility/client users cannot access /api/platform/ or /api/v1/platform/
 * - Auth endpoints and public endpoints are excluded from scope checks
 */
@Component
class ScopeIsolationFilter : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(ScopeIsolationFilter::class.java)

    companion object {
        private val EXCLUDED_PREFIXES = listOf(
            "/api/platform/auth/",
            "/api/v1/platform/auth/",
            "/api/auth/",
            "/api/public/",
            "/api/health/",
            "/actuator/",
            "/swagger-ui",
            "/api-docs",
            "/v3/api-docs"
        )

        private val PLATFORM_PREFIXES = listOf(
            "/api/platform/",
            "/api/v1/platform/"
        )
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val path = request.requestURI

        // Skip excluded paths
        if (EXCLUDED_PREFIXES.any { path.startsWith(it) }) {
            filterChain.doFilter(request, response)
            return
        }

        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication == null || !authentication.isAuthenticated) {
            // Let Spring Security handle unauthenticated requests
            filterChain.doFilter(request, response)
            return
        }

        val scope = when (val p = authentication.principal) {
            is JwtUserPrincipal -> p.scope
            is ApiKeyPrincipal -> p.scope
            else -> { filterChain.doFilter(request, response); return }
        }

        val isPlatformPath = PLATFORM_PREFIXES.any { path.startsWith(it) }

        when {
            // Platform user trying to access non-platform endpoint
            scope == "platform" && !isPlatformPath -> {
                log.warn("Platform-scoped principal blocked from facility path: {}", path)
                response.status = HttpServletResponse.SC_FORBIDDEN
                response.contentType = "application/json"
                response.writer.write("{\"error\": \"Platform users cannot access facility endpoints\"}")
                return
            }
            // Non-platform user trying to access platform endpoint
            scope != "platform" && isPlatformPath -> {
                log.warn("Non-platform principal (scope={}) blocked from platform path: {}", scope, path)
                response.status = HttpServletResponse.SC_FORBIDDEN
                response.contentType = "application/json"
                response.writer.write("{\"error\": \"Facility users cannot access platform endpoints\"}")
                return
            }
        }

        filterChain.doFilter(request, response)
    }
}
