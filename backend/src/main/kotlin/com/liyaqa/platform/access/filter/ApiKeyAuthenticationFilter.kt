package com.liyaqa.platform.access.filter

import com.liyaqa.platform.access.service.ApiKeyService
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

data class ApiKeyPrincipal(
    val keyId: UUID,
    val tenantId: UUID,
    val keyName: String,
    val permissions: List<String>,
    val scope: String = "facility"
)

@Component
class ApiKeyAuthenticationFilter(
    private val apiKeyService: ApiKeyService
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(ApiKeyAuthenticationFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val apiKey = request.getHeader("X-API-Key")

        if (apiKey.isNullOrBlank()) {
            filterChain.doFilter(request, response)
            return
        }

        if (SecurityContextHolder.getContext().authentication?.isAuthenticated == true) {
            filterChain.doFilter(request, response)
            return
        }

        val validatedKey = apiKeyService.validateKey(apiKey)
        if (validatedKey == null) {
            log.warn("Invalid API key presented from {}", request.remoteAddr)
            response.status = HttpServletResponse.SC_UNAUTHORIZED
            response.contentType = "application/json"
            response.writer.write("""{"error": "Invalid or expired API key"}""")
            return
        }

        val principal = ApiKeyPrincipal(
            keyId = validatedKey.id,
            tenantId = validatedKey.tenantId,
            keyName = validatedKey.name,
            permissions = validatedKey.getPermissions(),
            scope = "facility"
        )

        val authorities = validatedKey.getPermissions().map { SimpleGrantedAuthority(it) }
        val authentication = UsernamePasswordAuthenticationToken(principal, null, authorities)
        SecurityContextHolder.getContext().authentication = authentication

        TenantContext.setCurrentTenant(TenantId(validatedKey.tenantId))

        log.debug("API key authenticated: key={} tenant={}", validatedKey.id, validatedKey.tenantId)

        filterChain.doFilter(request, response)
    }
}
