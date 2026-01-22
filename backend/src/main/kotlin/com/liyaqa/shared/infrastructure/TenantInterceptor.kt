package com.liyaqa.shared.infrastructure

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.shared.domain.OrganizationId
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor
import org.springframework.web.servlet.ModelAndView

/**
 * HTTP interceptor that extracts tenant and organization information from requests
 * and sets up the context for the current thread.
 *
 * Supports:
 * - Tenant context (X-Tenant-ID header) - for club-level data isolation
 * - Organization context (X-Organization-ID header) - for organization-level access
 * - Super-tenant mode (X-Super-Tenant header) - for cross-club queries
 * - Subdomain-based tenant resolution (e.g., gymname.liyaqa.com)
 *
 * Security:
 * - Validates that authenticated user's tenant matches the requested tenant
 * - Only SUPER_ADMIN can access different tenants
 * - Prevents cross-tenant data leaks
 *
 * Tenant can be identified via:
 * 1. X-Tenant-ID header (highest priority)
 * 2. Subdomain slug (e.g., gymname.liyaqa.com)
 * 3. JWT token claim (for validation)
 */
@Component
class TenantInterceptor(
    private val clubRepository: ClubRepository,
    @Value("\${liyaqa.domain.base:liyaqa.com}")
    private val baseDomain: String,
    @Value("\${liyaqa.domain.dev-hosts:localhost,127.0.0.1}")
    private val devHosts: String
) : HandlerInterceptor {

    private val logger = LoggerFactory.getLogger(TenantInterceptor::class.java)

    companion object {
        const val TENANT_HEADER = "X-Tenant-ID"
        const val ORGANIZATION_HEADER = "X-Organization-ID"
        const val SUPER_TENANT_HEADER = "X-Super-Tenant"

        /**
         * Request attribute key for storing subdomain-resolved tenant ID.
         * Used by AuthController to access the resolved tenant without re-querying.
         */
        const val SUBDOMAIN_TENANT_ATTRIBUTE = "subdomainTenantId"

        /**
         * Request attribute key for storing subdomain-resolved club info.
         */
        const val SUBDOMAIN_CLUB_ATTRIBUTE = "subdomainClub"

        // Paths that don't require tenant validation
        private val EXCLUDED_PATHS = listOf(
            "/api/auth/",
            "/api/health",
            "/swagger-ui",
            "/api-docs",
            "/h2-console",
            "/actuator"
        )
    }

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        val requestPath = request.requestURI

        // Always try to resolve subdomain for ALL paths (including auth paths)
        // This allows tenant-info endpoint to access the resolved club
        val host = request.serverName
        val subdomain = extractSubdomain(host)
        if (subdomain != null) {
            resolveTenantFromSubdomain(subdomain, request)
        }

        // Skip tenant validation for excluded paths (but subdomain resolution already done above)
        if (isExcludedPath(requestPath)) {
            return true
        }

        val headerTenantId = extractTenantId(request)
        var organizationId = extractOrganizationId(request)
        val isSuperTenant = request.getHeader(SUPER_TENANT_HEADER)?.toBoolean() ?: false

        // Validate tenant access
        if (headerTenantId != null) {
            if (!validateTenantAccess(headerTenantId, isSuperTenant)) {
                logger.warn("Cross-tenant access denied for path: $requestPath")
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access to this tenant is not permitted")
                return false
            }
            TenantContext.setCurrentTenant(headerTenantId)

            // Auto-resolve organization ID from tenant (club) if not explicitly provided
            if (organizationId == null) {
                organizationId = resolveOrganizationFromTenant(headerTenantId)
            }
        }

        if (organizationId != null) {
            TenantContext.setCurrentOrganization(organizationId)
        }

        if (isSuperTenant && organizationId != null) {
            // Only SUPER_ADMIN can enable super-tenant mode
            val principal = getAuthenticatedPrincipal()
            if (principal?.role == Role.SUPER_ADMIN) {
                TenantContext.enableSuperTenantMode()
            } else {
                logger.warn("Non-admin attempted super-tenant mode: userId=${principal?.userId}")
            }
        }

        return true
    }

    /**
     * Validates that the authenticated user is allowed to access the requested tenant.
     *
     * @param requestedTenant The tenant ID from the request header
     * @param isSuperTenant Whether super-tenant mode is requested
     * @return true if access is allowed, false otherwise
     */
    private fun validateTenantAccess(requestedTenant: TenantId, isSuperTenant: Boolean): Boolean {
        val principal = getAuthenticatedPrincipal()

        // If not authenticated, allow (let Spring Security handle it)
        if (principal == null) {
            return true
        }

        // SUPER_ADMIN can access any tenant
        if (principal.role == Role.SUPER_ADMIN) {
            return true
        }

        // For other roles, verify tenant matches
        val userTenantId = principal.tenantId
        if (userTenantId != requestedTenant.value) {
            logger.warn(
                "Tenant mismatch: user tenant=$userTenantId, requested tenant=${requestedTenant.value}, " +
                        "user=${principal.email}, role=${principal.role}"
            )
            return false
        }

        return true
    }

    /**
     * Gets the authenticated user principal from the security context.
     */
    private fun getAuthenticatedPrincipal(): JwtUserPrincipal? {
        val authentication = SecurityContextHolder.getContext().authentication
        return authentication?.principal as? JwtUserPrincipal
    }

    /**
     * Checks if the request path is excluded from tenant validation.
     */
    private fun isExcludedPath(path: String): Boolean {
        return EXCLUDED_PATHS.any { path.startsWith(it) }
    }

    override fun postHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        modelAndView: ModelAndView?
    ) {
        // No action needed
    }

    override fun afterCompletion(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: Exception?
    ) {
        // Always clear the tenant context after request completion
        TenantContext.clear()
    }

    private fun extractTenantId(request: HttpServletRequest): TenantId? {
        // Priority 1: Check for X-Tenant-ID header
        val headerTenantId = request.getHeader(TENANT_HEADER)
        if (!headerTenantId.isNullOrBlank()) {
            return try {
                TenantId.fromString(headerTenantId)
            } catch (e: IllegalArgumentException) {
                logger.warn("Invalid tenant ID in header: $headerTenantId")
                null
            }
        }

        // Priority 2: Extract from subdomain
        val host = request.serverName
        val subdomain = extractSubdomain(host)
        if (subdomain != null) {
            return resolveTenantFromSubdomain(subdomain, request)
        }

        return null
    }

    /**
     * Resolves tenant ID from a subdomain slug by looking up the club.
     * Stores the resolved club in request attributes for later use.
     */
    private fun resolveTenantFromSubdomain(subdomain: String, request: HttpServletRequest): TenantId? {
        return try {
            val clubOptional = clubRepository.findBySlug(subdomain.lowercase())
            if (clubOptional.isPresent) {
                val club = clubOptional.get()
                val tenantId = TenantId(club.id)
                // Store in request attributes for auth endpoints to use
                request.setAttribute(SUBDOMAIN_TENANT_ATTRIBUTE, tenantId)
                request.setAttribute(SUBDOMAIN_CLUB_ATTRIBUTE, club)
                logger.debug("Resolved tenant from subdomain '$subdomain': ${club.id}")
                tenantId
            } else {
                logger.debug("No club found for subdomain: $subdomain")
                null
            }
        } catch (e: Exception) {
            logger.error("Error resolving tenant from subdomain '$subdomain': ${e.message}")
            null
        }
    }

    private fun extractOrganizationId(request: HttpServletRequest): OrganizationId? {
        val headerOrgId = request.getHeader(ORGANIZATION_HEADER)
        if (!headerOrgId.isNullOrBlank()) {
            return try {
                OrganizationId.fromString(headerOrgId)
            } catch (e: IllegalArgumentException) {
                null
            }
        }
        return null
    }

    /**
     * Resolves organization ID from tenant (club) ID by looking up the club.
     * This allows requests with only X-Tenant-ID to automatically get organization context.
     */
    private fun resolveOrganizationFromTenant(tenantId: TenantId): OrganizationId? {
        return try {
            clubRepository.findById(tenantId.value)
                .map { OrganizationId(it.organizationId) }
                .orElse(null)
        } catch (e: Exception) {
            logger.warn("Failed to resolve organization from tenant ${tenantId.value}: ${e.message}")
            null
        }
    }

    /**
     * Extracts subdomain from the host.
     * Handles development environments (localhost) and production domains.
     *
     * @param host The server name from the request
     * @return The subdomain if present and valid, null otherwise
     */
    private fun extractSubdomain(host: String): String? {
        val hostLower = host.lowercase()

        // Handle development environment (localhost, 127.0.0.1)
        val devHostList = devHosts.split(",").map { it.trim().lowercase() }.filter { it.isNotEmpty() }
        if (devHostList.any { hostLower.startsWith(it) || hostLower == it }) {
            // In dev, subdomain detection is skipped
            // Use X-Tenant-ID header or ?subdomain= query param for testing
            return null
        }

        // Production: Extract subdomain from host
        // Expected format: subdomain.liyaqa.com or subdomain.staging.liyaqa.com
        val baseParts = baseDomain.lowercase().split(".")
        val hostParts = hostLower.split(".")

        // If host has more parts than base domain, the extra parts are subdomain
        if (hostParts.size > baseParts.size) {
            // Verify the base domain matches
            val hostBaseParts = hostParts.takeLast(baseParts.size)
            if (hostBaseParts == baseParts) {
                val subdomain = hostParts.dropLast(baseParts.size).joinToString(".")
                // Ignore www and empty subdomains
                if (subdomain.isNotBlank() && subdomain != "www") {
                    return subdomain
                }
            }
        }

        return null
    }
}
