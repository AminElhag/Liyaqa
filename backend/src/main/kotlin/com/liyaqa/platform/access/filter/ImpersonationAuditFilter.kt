package com.liyaqa.platform.access.filter

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.repository.ImpersonationSessionRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class ImpersonationAuditFilter(
    private val sessionRepository: ImpersonationSessionRepository
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(ImpersonationAuditFilter::class.java)

    companion object {
        private val WRITE_METHODS = setOf("POST", "PUT", "DELETE", "PATCH")
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val authentication = SecurityContextHolder.getContext().authentication
        val principal = authentication?.principal as? JwtUserPrincipal

        // Pass through if not an impersonation session
        if (principal == null || !principal.isImpersonation) {
            filterChain.doFilter(request, response)
            return
        }

        // Block write operations
        if (request.method.uppercase() in WRITE_METHODS) {
            log.warn(
                "Blocked write operation during impersonation: {} {} (impersonator: {})",
                request.method, request.requestURI, principal.impersonatorId
            )
            response.status = HttpServletResponse.SC_FORBIDDEN
            response.contentType = "application/json"
            response.writer.write("""{"error": "Write operations are not allowed during impersonation"}""")
            return
        }

        // Log the action to the session
        val impersonatorId = principal.impersonatorId
        if (impersonatorId != null) {
            try {
                sessionRepository.findByPlatformUserIdAndIsActiveTrue(impersonatorId).ifPresent { session ->
                    session.addAction("${request.method} ${request.requestURI}")
                    sessionRepository.save(session)
                }
            } catch (e: Exception) {
                log.debug("Failed to log impersonation action: {}", e.message)
            }
        }

        filterChain.doFilter(request, response)
    }
}
