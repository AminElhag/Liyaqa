package com.liyaqa.auth.infrastructure.security

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.platform.domain.model.PlatformRolePermissions
import com.liyaqa.platform.domain.model.PlatformUserRole
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
import java.util.UUID

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
                val email = jwtTokenProvider.extractEmail(token)
                val permissions = jwtTokenProvider.extractPermissions(token)
                val scope = jwtTokenProvider.extractScope(token)
                val roleString = jwtTokenProvider.extractRoleString(token)

                // Set tenant context from JWT
                TenantContext.setCurrentTenant(TenantId(tenantId))

                // Create authorities from role and permissions
                val authorities = mutableListOf<SimpleGrantedAuthority>()

                // Determine role and platform role based on scope
                val role: Role
                val platformRole: PlatformUserRole?

                if (scope == "platform") {
                    // Platform user: parse as PlatformUserRole
                    platformRole = try {
                        PlatformUserRole.valueOf(roleString)
                    } catch (e: IllegalArgumentException) {
                        log.warn("Unknown platform role: $roleString, defaulting to SUPPORT_AGENT")
                        PlatformUserRole.SUPPORT_AGENT
                    }
                    // Use PLATFORM_ADMIN as the Spring Security role for platform users
                    role = Role.PLATFORM_ADMIN

                    // Add platform-specific role authority
                    authorities.add(SimpleGrantedAuthority("ROLE_${platformRole.name}"))
                    // Also add the generic PLATFORM_ADMIN role for backward compatibility
                    if (platformRole != PlatformUserRole.PLATFORM_ADMIN) {
                        authorities.add(SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN"))
                    }

                    // Add platform permissions as authorities
                    PlatformRolePermissions.permissionsFor(platformRole).forEach { perm ->
                        authorities.add(SimpleGrantedAuthority(perm.name))
                    }
                } else {
                    // Facility or client user: parse as Role
                    role = try {
                        Role.valueOf(roleString)
                    } catch (e: IllegalArgumentException) {
                        log.warn("Unknown role: $roleString")
                        filterChain.doFilter(request, response)
                        return
                    }
                    platformRole = null
                    authorities.add(SimpleGrantedAuthority("ROLE_${role.name}"))
                }

                // Add scope authority
                authorities.add(SimpleGrantedAuthority("SCOPE_$scope"))

                // Add permission authorities from token
                permissions.forEach { permission ->
                    authorities.add(SimpleGrantedAuthority(permission))
                }

                val isImpersonation = jwtTokenProvider.extractIsImpersonation(token)
                val impersonatorId = if (isImpersonation) jwtTokenProvider.extractImpersonatorId(token) else null

                val authentication = UsernamePasswordAuthenticationToken(
                    JwtUserPrincipal(
                        userId = userId,
                        tenantId = tenantId,
                        email = email,
                        role = role,
                        permissions = permissions,
                        scope = scope,
                        platformRole = platformRole,
                        isImpersonation = isImpersonation,
                        impersonatorId = impersonatorId
                    ),
                    null,
                    authorities
                )

                SecurityContextHolder.getContext().authentication = authentication
                log.debug("Authenticated user: $email with scope=$scope role=${platformRole?.name ?: role.name}")
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
    val userId: UUID,
    val tenantId: UUID,
    val email: String,
    val role: Role,
    val permissions: List<String> = emptyList(),
    val scope: String = "facility",
    val platformRole: PlatformUserRole? = null,
    val isImpersonation: Boolean = false,
    val impersonatorId: UUID? = null
)
