package com.liyaqa.config

import com.liyaqa.auth.infrastructure.security.JwtAuthenticationFilter
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val cookieAuthenticationFilter: CookieAuthenticationFilter,
    private val csrfValidationFilter: CsrfValidationFilter,
    @param:Value("\${liyaqa.security.hsts-enabled:false}")
    private val hstsEnabled: Boolean,
    @param:Value("\${liyaqa.security.hsts-max-age-seconds:31536000}")
    private val hstsMaxAgeSeconds: Long,
    @param:Value("\${liyaqa.security.content-security-policy:default-src 'self'}")
    private val contentSecurityPolicy: String,
    @param:Value("\${liyaqa.cors.allowed-origins:http://localhost:3000}")
    private val allowedOrigins: String,
    @param:Value("\${liyaqa.cors.allowed-origin-patterns:}")
    private val allowedOriginPatterns: String
) {

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val origins = allowedOrigins.split(",").map { it.trim() }.filter { it.isNotBlank() }
        val patterns = allowedOriginPatterns.split(",").map { it.trim() }.filter { it.isNotBlank() }

        val configuration = CorsConfiguration()

        // SECURITY: When allowCredentials=true, we MUST use specific origins, not patterns
        // Patterns with credentials create a security vulnerability (credential exposure to wildcards)
        if (origins.isNotEmpty()) {
            // Production-safe: Use explicit allowed origins with credentials
            configuration.allowedOrigins = origins
            configuration.allowCredentials = true
        } else if (patterns.isNotEmpty()) {
            // Development mode: Use patterns WITHOUT credentials
            // This is safe for development but should not be used in production
            configuration.allowedOriginPatterns = patterns
            configuration.allowCredentials = false
        } else {
            // Fallback: No CORS (same-origin only)
            configuration.allowedOrigins = listOf()
            configuration.allowCredentials = false
        }

        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        configuration.allowedHeaders = listOf(
            "Content-Type",
            "Authorization",
            "X-Tenant-ID",
            "X-Organization-ID",
            "X-Super-Tenant",
            "X-CSRF-Token",
            "X-Auth-Mode",
            "Accept",
            "Accept-Language",
            "Cache-Control"
        )
        configuration.exposedHeaders = listOf(
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "Set-Cookie"
        )
        configuration.maxAge = 3600L

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/api/**", configuration)
        return source
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    // Allow all OPTIONS requests (CORS preflight)
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                    // Public endpoints - no authentication required
                    .requestMatchers("/api/public/**").permitAll()
                    .requestMatchers("/api/health/**").permitAll()
                    .requestMatchers("/actuator/**").permitAll()
                    .requestMatchers("/h2-console/**").permitAll()

                    // Swagger/OpenAPI documentation
                    .requestMatchers("/swagger-ui/**").permitAll()
                    .requestMatchers("/swagger-ui.html").permitAll()
                    .requestMatchers("/api-docs/**").permitAll()
                    .requestMatchers("/v3/api-docs/**").permitAll()

                    // Auth endpoints - login, register, and password reset are public
                    .requestMatchers("/api/auth/login").permitAll()
                    .requestMatchers("/api/auth/register").permitAll()
                    .requestMatchers("/api/auth/refresh").permitAll()
                    .requestMatchers("/api/auth/forgot-password").permitAll()
                    .requestMatchers("/api/auth/reset-password").permitAll()
                    .requestMatchers("/api/auth/tenant-info").permitAll()
                    .requestMatchers("/api/auth/csrf").permitAll()
                    .requestMatchers("/api/auth/mfa/verify-login").permitAll()

                    // OAuth endpoints - public for SSO flow
                    .requestMatchers("/api/auth/oauth/providers").permitAll()
                    .requestMatchers("/api/auth/oauth/authorize/**").permitAll()
                    .requestMatchers("/api/auth/oauth/callback/**").permitAll()

                    // Platform auth endpoints - internal team login
                    .requestMatchers("/api/platform/auth/login").permitAll()
                    .requestMatchers("/api/platform/auth/refresh").permitAll()

                    // Platform API endpoints - require authentication with platform roles
                    // Role-based access is enforced via @PreAuthorize at method level
                    .requestMatchers("/api/platform/**").authenticated()

                    // Payment endpoints - callback is webhook, return is redirect from PayTabs
                    .requestMatchers("/api/payments/callback").permitAll()
                    .requestMatchers("/api/payments/return").permitAll()

                    // Organization endpoints - GET allowed for browsing, write ops protected by @PreAuthorize
                    // Method-level security handles SUPER_ADMIN/CLUB_ADMIN role checks
                    .requestMatchers("/api/organizations/**").permitAll()
                    .requestMatchers("/api/clubs/**").permitAll()
                    .requestMatchers("/api/locations/**").permitAll()

                    // All other requests require authentication
                    .anyRequest().authenticated()
            }
            // Add authentication filters
            // 1. Cookie auth filter (reads JWT from cookie)
            // 2. CSRF validation filter (validates CSRF token for cookie auth)
            // 3. JWT auth filter (reads JWT from Authorization header)
            .addFilterBefore(cookieAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            .addFilterAfter(csrfValidationFilter, CookieAuthenticationFilter::class.java)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            // Security headers
            .headers { headers ->
                // X-Frame-Options: SAMEORIGIN (prevents clickjacking)
                headers.frameOptions { it.sameOrigin() }

                // X-Content-Type-Options: nosniff (prevents MIME type sniffing)
                headers.contentTypeOptions { }

                // X-XSS-Protection (legacy, but still useful for older browsers)
                headers.xssProtection { xss ->
                    xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)
                }

                // Referrer-Policy: strict-origin-when-cross-origin
                headers.referrerPolicy { referrer ->
                    referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                }

                // Content-Security-Policy
                headers.contentSecurityPolicy { csp ->
                    csp.policyDirectives(contentSecurityPolicy)
                }

                // Permissions-Policy (formerly Feature-Policy)
                headers.permissionsPolicy { permissions ->
                    permissions.policy("geolocation=(), microphone=(), camera=()")
                }

                // HTTP Strict Transport Security (HSTS) - only in production with HTTPS
                if (hstsEnabled) {
                    headers.httpStrictTransportSecurity { hsts ->
                        hsts
                            .maxAgeInSeconds(hstsMaxAgeSeconds)
                            .includeSubDomains(true)
                            .preload(true)
                    }
                }
            }

        return http.build()
    }
}