package com.liyaqa.shared.infrastructure

import com.liyaqa.shared.domain.OrganizationId
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
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
 *
 * Tenant can be identified via:
 * 1. X-Tenant-ID header
 * 2. Subdomain (e.g., gymname.liyaqa.com)
 * 3. JWT token claim (when authentication is implemented)
 */
@Component
class TenantInterceptor : HandlerInterceptor {

    companion object {
        const val TENANT_HEADER = "X-Tenant-ID"
        const val ORGANIZATION_HEADER = "X-Organization-ID"
        const val SUPER_TENANT_HEADER = "X-Super-Tenant"
    }

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        val tenantId = extractTenantId(request)
        val organizationId = extractOrganizationId(request)
        val isSuperTenant = request.getHeader(SUPER_TENANT_HEADER)?.toBoolean() ?: false

        if (tenantId != null) {
            TenantContext.setCurrentTenant(tenantId)
        }

        if (organizationId != null) {
            TenantContext.setCurrentOrganization(organizationId)
        }

        if (isSuperTenant && organizationId != null) {
            TenantContext.enableSuperTenantMode()
        }

        return true
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
                null
            }
        }

        // Priority 2: Extract from subdomain
        val host = request.serverName
        val subdomain = extractSubdomain(host)
        if (subdomain != null) {
            // In a real implementation, you would look up the tenant ID by subdomain
            // For now, we just return null for subdomain-based resolution
            return null
        }

        return null
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

    private fun extractSubdomain(host: String): String? {
        val parts = host.split(".")
        return if (parts.size >= 3 && parts[0] != "www") {
            parts[0]
        } else {
            null
        }
    }
}
