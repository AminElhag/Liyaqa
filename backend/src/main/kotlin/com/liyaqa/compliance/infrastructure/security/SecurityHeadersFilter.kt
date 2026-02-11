package com.liyaqa.compliance.infrastructure.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Security headers filter for compliance with security standards.
 * Adds headers required by ISO 27001, SOC 2, and PCI DSS.
 *
 * Note: Headers that are also configured in SecurityConfig (X-Frame-Options,
 * X-Content-Type-Options, XSS-Protection, Referrer-Policy, CSP, Permissions-Policy)
 * are intentionally NOT set here to avoid duplication. SecurityConfig's header writers
 * run after this filter and would overwrite them anyway.
 *
 * This filter adds ONLY the headers not covered by Spring Security's header writers:
 * - Cross-Origin-Resource-Policy
 * - Strict-Transport-Security (supplementary, for non-HTTPS fallback)
 * - Cache-Control / Pragma / Expires
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class SecurityHeadersFilter(
    @Value("\${liyaqa.security.headers.enabled:true}")
    private val enabled: Boolean
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // Skip CORS preflight requests — let the CORS filter handle them cleanly
        if (enabled && request.method != "OPTIONS") {
            addSecurityHeaders(response)
        }
        filterChain.doFilter(request, response)
    }

    private fun addSecurityHeaders(response: HttpServletResponse) {
        // Cross-Origin-Resource-Policy: allow cross-origin API access from frontend
        response.setHeader("Cross-Origin-Resource-Policy", "cross-origin")

        // Prevent caching of sensitive API data
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
        response.setHeader("Pragma", "no-cache")
        response.setHeader("Expires", "0")
    }
}
