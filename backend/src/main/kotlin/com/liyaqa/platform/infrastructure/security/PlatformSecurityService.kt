package com.liyaqa.platform.infrastructure.security

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.domain.model.PlatformRolePermissions
import com.liyaqa.platform.domain.model.PlatformUserRole
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

/**
 * Service bean for use in @PreAuthorize SpEL expressions.
 * Usage: `@PreAuthorize("@platformSecurity.hasRole('PLATFORM_SUPER_ADMIN')")`
 */
@Service("platformSecurity")
class PlatformSecurityService {

    fun isPlatformUser(): Boolean {
        val principal = getCurrentPrincipal() ?: return false
        return principal.scope == "platform"
    }

    fun hasRole(vararg roles: PlatformUserRole): Boolean {
        val principal = getCurrentPrincipal() ?: return false
        if (principal.scope != "platform") return false
        val platformRole = principal.platformRole ?: return false
        return platformRole in roles
    }

    fun hasPermission(vararg permissions: PlatformPermission): Boolean {
        val principal = getCurrentPrincipal() ?: return false
        if (principal.scope != "platform") return false
        val platformRole = principal.platformRole ?: return false
        val rolePermissions = PlatformRolePermissions.permissionsFor(platformRole)
        return permissions.all { it in rolePermissions }
    }

    private fun getCurrentPrincipal(): JwtUserPrincipal? {
        val auth = SecurityContextHolder.getContext().authentication ?: return null
        return auth.principal as? JwtUserPrincipal
    }
}
