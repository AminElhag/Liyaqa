package com.liyaqa.auth.infrastructure.security

import com.liyaqa.shared.domain.OrganizationId
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(JwtAuthenticationFilter::class.java)

    companion object {
        private const val AUTHORIZATION_HEADER = "Authorization"
        private const val BEARER_PREFIX = "Bearer "
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val token = extractToken(request)

            if (token != null && jwtTokenProvider.validateAccessToken(token)) {
                val userId = jwtTokenProvider.extractUserId(token)
                val tenantId = jwtTokenProvider.extractTenantId(token)
                val role = jwtTokenProvider.extractRole(token)
                val email = jwtTokenProvider.extractEmail(token)
                val permissions = jwtTokenProvider.extractPermissions(token)

                // Set tenant context from JWT
                TenantContext.setCurrentTenant(TenantId(tenantId))

                // Create authorities from role and permissions
                val authorities = mutableListOf<SimpleGrantedAuthority>()
                // Add role authority (for hasRole checks)
                authorities.add(SimpleGrantedAuthority("ROLE_${role.name}"))
                // Add permission authorities (for hasAuthority checks)
                permissions.forEach { permission ->
                    authorities.add(SimpleGrantedAuthority(permission))
                }

                val authentication = UsernamePasswordAuthenticationToken(
                    JwtUserPrincipal(
                        userId = userId,
                        tenantId = tenantId,
                        email = email,
                        role = role,
                        permissions = permissions
                    ),
                    null,
                    authorities
                )

                SecurityContextHolder.getContext().authentication = authentication
                log.debug("Authenticated user: $email with role: $role and ${permissions.size} permissions for tenant: $tenantId")
            }
        } catch (e: Exception) {
            log.debug("Could not authenticate user: ${e.message}")
            // Clear any partial state
            SecurityContextHolder.clearContext()
        }

        filterChain.doFilter(request, response)
    }

    private fun extractToken(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader(AUTHORIZATION_HEADER)
        return if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            bearerToken.substring(BEARER_PREFIX.length)
        } else {
            null
        }
    }
}

/**
 * Principal object containing user information extracted from JWT.
 */
data class JwtUserPrincipal(
    val userId: java.util.UUID,
    val tenantId: java.util.UUID,
    val email: String,
    val role: com.liyaqa.auth.domain.model.Role,
    val permissions: List<String> = emptyList()
)