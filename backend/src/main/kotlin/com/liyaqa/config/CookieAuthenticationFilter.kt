package com.liyaqa.config

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.platform.domain.model.PlatformRolePermissions
import com.liyaqa.platform.domain.model.PlatformUserRole
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class CookieAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(CookieAuthenticationFilter::class.java)

    companion object {
        private const val ACCESS_TOKEN_COOKIE_NAME = "access_token"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val token = extractTokenFromCookie(request)

            if (token != null && SecurityContextHolder.getContext().authentication == null) {
                try {
                    if (jwtTokenProvider.validateAccessToken(token)) {
                        val userId = jwtTokenProvider.extractUserId(token)
                        val email = jwtTokenProvider.extractEmail(token)
                        val tenantId = jwtTokenProvider.extractTenantId(token)
                        val permissions = jwtTokenProvider.extractPermissions(token)
                        val scope = jwtTokenProvider.extractScope(token)
                        val roleString = jwtTokenProvider.extractRoleString(token)

                        val authorities = mutableListOf<SimpleGrantedAuthority>()

                        val role: Role
                        val platformRole: PlatformUserRole?

                        if (scope == "platform") {
                            platformRole = try {
                                PlatformUserRole.valueOf(roleString)
                            } catch (e: IllegalArgumentException) {
                                log.warn("Unknown platform role from cookie: $roleString")
                                PlatformUserRole.SUPPORT_AGENT
                            }
                            role = Role.PLATFORM_ADMIN

                            authorities.add(SimpleGrantedAuthority("ROLE_${platformRole.name}"))
                            if (platformRole != PlatformUserRole.PLATFORM_ADMIN) {
                                authorities.add(SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN"))
                            }

                            PlatformRolePermissions.permissionsFor(platformRole).forEach { perm ->
                                authorities.add(SimpleGrantedAuthority(perm.name))
                            }
                        } else {
                            role = try {
                                Role.valueOf(roleString)
                            } catch (e: IllegalArgumentException) {
                                log.warn("Unknown role from cookie: $roleString")
                                filterChain.doFilter(request, response)
                                return
                            }
                            platformRole = null
                            authorities.add(SimpleGrantedAuthority("ROLE_${role.name}"))
                        }

                        authorities.add(SimpleGrantedAuthority("SCOPE_$scope"))

                        permissions.forEach { permission ->
                            authorities.add(SimpleGrantedAuthority(permission))
                        }

                        val isImpersonation = jwtTokenProvider.extractIsImpersonation(token)
                        val impersonatorId = if (isImpersonation) jwtTokenProvider.extractImpersonatorId(token) else null

                        val principal = JwtUserPrincipal(
                            userId = userId,
                            tenantId = tenantId,
                            email = email,
                            role = role,
                            permissions = permissions,
                            scope = scope,
                            platformRole = platformRole,
                            isImpersonation = isImpersonation,
                            impersonatorId = impersonatorId
                        )

                        val authentication = UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            authorities
                        ).apply {
                            details = WebAuthenticationDetailsSource().buildDetails(request)
                        }

                        SecurityContextHolder.getContext().authentication = authentication
                        log.debug("Authenticated user from cookie: userId={}", userId)
                    }
                } catch (e: ExpiredJwtException) {
                    log.debug("Cookie JWT token expired")
                } catch (e: JwtException) {
                    log.debug("Invalid cookie JWT token: {}", e.message)
                }
            }
        } catch (e: Exception) {
            log.error("Cookie authentication failed", e)
        }

        filterChain.doFilter(request, response)
    }

    private fun extractTokenFromCookie(request: HttpServletRequest): String? {
        val cookies = request.cookies ?: return null
        return cookies.firstOrNull { it.name == ACCESS_TOKEN_COOKIE_NAME }?.value
    }
}
