package com.liyaqa.shared.infrastructure.security

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Security service for authorization checks in @PreAuthorize expressions.
 * Used for member-level access control where a user should only access their own data.
 */
@Service("securityService")
class SecurityService(
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(SecurityService::class.java)

    /**
     * Checks if the currently authenticated user is accessing their own member data.
     * Used in @PreAuthorize expressions like:
     * @PreAuthorize("hasAnyRole('ADMIN') or @securityService.isSelf(#memberId)")
     *
     * @param memberId the member ID being accessed
     * @return true if the authenticated user's member ID matches the requested member ID
     */
    fun isSelf(memberId: UUID?): Boolean {
        if (memberId == null) {
            return false
        }

        val principal = getCurrentPrincipal() ?: return false

        // Look up the user to get their linked member ID
        val user = userRepository.findById(principal.userId).orElse(null)
        if (user == null) {
            logger.warn("User not found for principal: ${principal.userId}")
            return false
        }

        val userMemberId = user.memberId
        if (userMemberId == null) {
            logger.debug("User ${principal.userId} has no linked member")
            return false
        }

        val isSelf = userMemberId == memberId
        logger.debug("isSelf check: user=${principal.userId}, userMemberId=$userMemberId, requestedMemberId=$memberId, result=$isSelf")
        return isSelf
    }

    /**
     * Checks if the current user is accessing their own user account.
     *
     * @param userId the user ID being accessed
     * @return true if the authenticated user's ID matches the requested user ID
     */
    fun isSelfUser(userId: UUID?): Boolean {
        if (userId == null) {
            return false
        }
        val principal = getCurrentPrincipal() ?: return false
        return principal.userId == userId
    }

    /**
     * Checks if the current user owns a subscription (through their member).
     *
     * @param subscriptionMemberId the member ID associated with the subscription
     * @return true if the authenticated user owns this subscription
     */
    fun ownsSubscription(subscriptionMemberId: UUID?): Boolean {
        return isSelf(subscriptionMemberId)
    }

    /**
     * Checks if the current user has any of the specified roles.
     *
     * @param roles the roles to check
     * @return true if the user has at least one of the specified roles
     */
    fun hasAnyRole(vararg roles: Role): Boolean {
        val principal = getCurrentPrincipal() ?: return false
        return roles.contains(principal.role)
    }

    /**
     * Checks if the current user is an admin (SUPER_ADMIN or CLUB_ADMIN).
     *
     * @return true if the user is an admin
     */
    fun isAdmin(): Boolean {
        return hasAnyRole(Role.SUPER_ADMIN, Role.CLUB_ADMIN)
    }

    /**
     * Checks if the current user is staff or higher.
     *
     * @return true if the user is staff or admin
     */
    fun isStaffOrAbove(): Boolean {
        return hasAnyRole(Role.SUPER_ADMIN, Role.CLUB_ADMIN, Role.STAFF)
    }

    /**
     * Gets the current authenticated user's principal.
     *
     * @return the JwtUserPrincipal or null if not authenticated
     */
    fun getCurrentPrincipal(): JwtUserPrincipal? {
        val authentication = SecurityContextHolder.getContext().authentication
        return authentication?.principal as? JwtUserPrincipal
    }

    /**
     * Gets the current authenticated user's ID.
     *
     * @return the user ID or null if not authenticated
     */
    fun getCurrentUserId(): UUID? {
        return getCurrentPrincipal()?.userId
    }

    /**
     * Gets the current authenticated user's member ID.
     *
     * @return the member ID or null if not authenticated or no linked member
     */
    fun getCurrentMemberId(): UUID? {
        val principal = getCurrentPrincipal() ?: return null
        val user = userRepository.findById(principal.userId).orElse(null) ?: return null
        return user.memberId
    }

    /**
     * Gets the current authenticated user's tenant ID.
     *
     * @return the tenant ID or null if not authenticated
     */
    fun getCurrentTenantId(): UUID? {
        return getCurrentPrincipal()?.tenantId
    }
}
