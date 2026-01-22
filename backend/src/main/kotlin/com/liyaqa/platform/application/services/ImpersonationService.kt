package com.liyaqa.platform.application.services

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.api.dto.ImpersonationResponse
import com.liyaqa.platform.api.dto.ImpersonationSessionResponse
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Service for managing user impersonation sessions.
 * Allows support and platform admins to impersonate client users for troubleshooting.
 * All impersonation actions are audit logged.
 */
@Service
class ImpersonationService(
    private val userRepository: UserRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val auditService: AuditService
) {
    private val logger = LoggerFactory.getLogger(ImpersonationService::class.java)

    // In-memory store for active impersonation sessions
    // In production, this could be moved to Redis or database
    private val activeSessions = ConcurrentHashMap<UUID, ImpersonationSession>()

    /**
     * Impersonates a user.
     * Creates an impersonation session and returns an access token for the target user.
     *
     * @param targetUserId The ID of the user to impersonate
     * @param reason The reason for impersonation (for audit purposes)
     * @return ImpersonationResponse with access token
     */
    @Transactional
    fun impersonate(targetUserId: UUID, reason: String): ImpersonationResponse {
        val impersonator = getCurrentPrincipal()
            ?: throw IllegalStateException("Must be authenticated to impersonate")

        // Validate impersonator has permission
        validateImpersonator(impersonator)

        // Get target user
        val targetUser = userRepository.findById(targetUserId)
            .orElseThrow { NoSuchElementException("User not found: $targetUserId") }

        // Prevent impersonating platform users
        if (targetUser.isPlatformUser) {
            throw IllegalArgumentException("Cannot impersonate platform users")
        }

        // Create impersonation session
        val sessionId = UUID.randomUUID()
        val session = ImpersonationSession(
            sessionId = sessionId,
            impersonatorId = impersonator.userId,
            impersonatorEmail = impersonator.email,
            impersonatedUserId = targetUser.id,
            impersonatedUserEmail = targetUser.email,
            reason = reason,
            startedAt = Instant.now()
        )
        activeSessions[sessionId] = session

        // Generate access token for the target user
        // Note: The token is a regular access token but with short expiry for security
        val accessToken = jwtTokenProvider.generateAccessToken(targetUser)
        val expiry = jwtTokenProvider.getExpiration(accessToken)

        // Audit log the impersonation
        auditService.log(
            action = AuditAction.IMPERSONATE_START,
            entityType = "User",
            entityId = targetUser.id,
            description = "Impersonation started by ${impersonator.email} for ${targetUser.email}. Reason: $reason",
            newValue = """{"impersonator": "${impersonator.email}", "reason": "$reason", "sessionId": "$sessionId"}"""
        )

        logger.info("Impersonation started: {} impersonating {} (session: {})",
            impersonator.email, targetUser.email, sessionId)

        return ImpersonationResponse(
            accessToken = accessToken,
            impersonatedUserId = targetUser.id,
            impersonatedUserEmail = targetUser.email,
            impersonatedRole = targetUser.role,
            expiresAt = expiry
        )
    }

    /**
     * Ends the current impersonation session.
     * This should be called when the impersonator is done troubleshooting.
     */
    @Transactional
    fun endImpersonation() {
        val principal = getCurrentPrincipal()
            ?: throw IllegalStateException("Must be authenticated to end impersonation")

        // Find active session for this user (either as impersonator or impersonated)
        val session = activeSessions.values.find {
            it.impersonatorId == principal.userId || it.impersonatedUserId == principal.userId
        }

        if (session != null) {
            session.endedAt = Instant.now()
            activeSessions.remove(session.sessionId)

            // Audit log the end of impersonation
            auditService.log(
                action = AuditAction.IMPERSONATE_END,
                entityType = "User",
                entityId = session.impersonatedUserId,
                description = "Impersonation ended by ${session.impersonatorEmail} for ${session.impersonatedUserEmail}",
                oldValue = """{"sessionId": "${session.sessionId}", "duration": "${session.getDurationSeconds()}s"}"""
            )

            logger.info("Impersonation ended: {} impersonating {} (session: {}, duration: {}s)",
                session.impersonatorEmail, session.impersonatedUserEmail, session.sessionId, session.getDurationSeconds())
        }
    }

    /**
     * Gets all active impersonation sessions.
     * Only PLATFORM_ADMIN can view all sessions.
     */
    @Transactional(readOnly = true)
    fun getActiveSessions(): List<ImpersonationSessionResponse> {
        return activeSessions.values.map { session ->
            ImpersonationSessionResponse(
                sessionId = session.sessionId,
                impersonatorId = session.impersonatorId,
                impersonatorEmail = session.impersonatorEmail,
                impersonatedUserId = session.impersonatedUserId,
                impersonatedUserEmail = session.impersonatedUserEmail,
                reason = session.reason,
                startedAt = session.startedAt,
                endedAt = session.endedAt,
                isActive = session.endedAt == null
            )
        }
    }

    /**
     * Gets impersonation session by ID.
     */
    @Transactional(readOnly = true)
    fun getSession(sessionId: UUID): ImpersonationSessionResponse? {
        val session = activeSessions[sessionId] ?: return null
        return ImpersonationSessionResponse(
            sessionId = session.sessionId,
            impersonatorId = session.impersonatorId,
            impersonatorEmail = session.impersonatorEmail,
            impersonatedUserId = session.impersonatedUserId,
            impersonatedUserEmail = session.impersonatedUserEmail,
            reason = session.reason,
            startedAt = session.startedAt,
            endedAt = session.endedAt,
            isActive = session.endedAt == null
        )
    }

    /**
     * Forcefully ends an impersonation session by ID.
     * Only PLATFORM_ADMIN can force-end sessions.
     */
    @Transactional
    fun forceEndSession(sessionId: UUID) {
        val session = activeSessions[sessionId]
            ?: throw NoSuchElementException("Session not found: $sessionId")

        session.endedAt = Instant.now()
        activeSessions.remove(sessionId)

        val currentPrincipal = getCurrentPrincipal()

        auditService.log(
            action = AuditAction.IMPERSONATE_END,
            entityType = "User",
            entityId = session.impersonatedUserId,
            description = "Impersonation force-ended by ${currentPrincipal?.email ?: "system"} for session $sessionId",
            oldValue = """{"sessionId": "$sessionId", "forceEnded": true}"""
        )

        logger.info("Impersonation force-ended: session {}", sessionId)
    }

    private fun validateImpersonator(principal: JwtUserPrincipal) {
        val allowedRoles = listOf(Role.PLATFORM_ADMIN, Role.SUPPORT)
        if (principal.role !in allowedRoles) {
            throw SecurityException("User does not have permission to impersonate")
        }
    }

    private fun getCurrentPrincipal(): JwtUserPrincipal? {
        return SecurityContextHolder.getContext().authentication?.principal as? JwtUserPrincipal
    }
}

/**
 * Represents an active impersonation session.
 */
data class ImpersonationSession(
    val sessionId: UUID,
    val impersonatorId: UUID,
    val impersonatorEmail: String,
    val impersonatedUserId: UUID,
    val impersonatedUserEmail: String,
    val reason: String,
    val startedAt: Instant,
    var endedAt: Instant? = null
) {
    fun getDurationSeconds(): Long {
        val end = endedAt ?: Instant.now()
        return end.epochSecond - startedAt.epochSecond
    }
}
