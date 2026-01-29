package com.liyaqa.compliance.infrastructure.security

import jakarta.servlet.Filter
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletRequest
import jakarta.servlet.ServletResponse
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

/**
 * Security headers filter for compliance with security standards.
 * Adds headers required by ISO 27001, SOC 2, and PCI DSS.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class SecurityHeadersFilter(
    @Value("\${liyaqa.security.headers.csp:default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';}")
    private val contentSecurityPolicy: String,

    @Value("\${liyaqa.security.headers.frame-options:DENY}")
    private val frameOptions: String,

    @Value("\${liyaqa.security.headers.referrer-policy:strict-origin-when-cross-origin}")
    private val referrerPolicy: String,

    @Value("\${liyaqa.security.headers.permissions-policy:accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()}")
    private val permissionsPolicy: String,

    @Value("\${liyaqa.security.headers.enabled:true}")
    private val enabled: Boolean
) : Filter {

    override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
        if (enabled && response is HttpServletResponse) {
            addSecurityHeaders(response)
        }
        chain.doFilter(request, response)
    }

    private fun addSecurityHeaders(response: HttpServletResponse) {
        // Prevent MIME type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff")

        // Prevent clickjacking
        response.setHeader("X-Frame-Options", frameOptions)

        // XSS Protection (legacy, but still useful for older browsers)
        response.setHeader("X-XSS-Protection", "1; mode=block")

        // Control referrer information
        response.setHeader("Referrer-Policy", referrerPolicy)

        // Content Security Policy
        response.setHeader("Content-Security-Policy", contentSecurityPolicy)

        // Permissions Policy (formerly Feature Policy)
        response.setHeader("Permissions-Policy", permissionsPolicy)

        // Cross-Origin security headers
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin")
        response.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
        response.setHeader("Cross-Origin-Resource-Policy", "same-origin")

        // Strict Transport Security (HSTS) - only for HTTPS
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

        // Prevent caching of sensitive data
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
        response.setHeader("Pragma", "no-cache")
        response.setHeader("Expires", "0")
    }
}
