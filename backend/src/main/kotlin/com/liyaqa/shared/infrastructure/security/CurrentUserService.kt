package com.liyaqa.shared.infrastructure.security

import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Service for accessing current user information.
 * Provides convenience methods for common operations.
 */
@Service
class CurrentUserService(
    private val securityService: SecurityService
) {
    /**
     * Gets the current member ID, throwing an exception if not authenticated
     * or if the user doesn't have a linked member.
     */
    fun requireCurrentMemberId(): UUID {
        return securityService.getCurrentMemberId()
            ?: throw IllegalStateException("No member linked to current user")
    }

    /**
     * Gets the current user ID, throwing an exception if not authenticated.
     */
    fun requireCurrentUserId(): UUID {
        return securityService.getCurrentUserId()
            ?: throw IllegalStateException("User not authenticated")
    }

    /**
     * Gets the current tenant ID, throwing an exception if not authenticated.
     */
    fun requireCurrentTenantId(): UUID {
        return securityService.getCurrentTenantId()
            ?: throw IllegalStateException("No tenant context for current user")
    }

    /**
     * Gets the current member ID, or null if not available.
     */
    fun getCurrentMemberId(): UUID? = securityService.getCurrentMemberId()

    /**
     * Gets the current user ID, or null if not authenticated.
     */
    fun getCurrentUserId(): UUID? = securityService.getCurrentUserId()

    /**
     * Gets the current tenant ID, or null if not authenticated.
     */
    fun getCurrentTenantId(): UUID? = securityService.getCurrentTenantId()
}
