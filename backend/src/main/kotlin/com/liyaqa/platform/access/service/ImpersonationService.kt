package com.liyaqa.platform.access.service

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.dto.ImpersonationSessionResponse
import com.liyaqa.platform.access.dto.ImpersonationTokenResponse
import com.liyaqa.platform.access.dto.StartImpersonationRequest
import com.liyaqa.platform.access.exception.ActiveImpersonationSessionExistsException
import com.liyaqa.platform.access.exception.ImpersonationSessionNotFoundException
import com.liyaqa.platform.access.model.ImpersonationSession
import com.liyaqa.platform.access.repository.ImpersonationSessionRepository
import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service("accessImpersonationService")
class ImpersonationService(
    private val sessionRepository: ImpersonationSessionRepository,
    private val userRepository: UserRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val auditService: AuditService,
    private val eventPublisher: ApplicationEventPublisher,
    @Value("\${liyaqa.impersonation.token-expiration-ms:1800000}")
    private val tokenExpirationMs: Long
) {
    private val logger = LoggerFactory.getLogger(ImpersonationService::class.java)

    @Transactional
    fun startImpersonation(
        request: StartImpersonationRequest,
        principal: JwtUserPrincipal,
        ipAddress: String?,
        userAgent: String?
    ): ImpersonationTokenResponse {
        // Check no active session for this platform user
        val activeCount = sessionRepository.countByPlatformUserIdAndIsActiveTrue(principal.userId)
        if (activeCount > 0) {
            throw ActiveImpersonationSessionExistsException(principal.userId)
        }

        // Resolve target user
        val targetUser = if (request.targetUserId != null) {
            userRepository.findById(request.targetUserId)
                .orElseThrow { NoSuchElementException("Target user not found: ${request.targetUserId}") }
        } else {
            // Find primary admin of the tenant
            userRepository.findFirstByTenantIdAndRoleIn(
                request.tenantId,
                listOf(Role.SUPER_ADMIN, Role.CLUB_ADMIN)
            ).orElseThrow { NoSuchElementException("No admin user found for tenant: ${request.tenantId}") }
        }

        // Validate target user belongs to the tenant
        require(targetUser.tenantId == request.tenantId) {
            "Target user does not belong to the specified tenant"
        }

        // Prevent impersonation of platform users
        require(!targetUser.isPlatformUser) {
            "Cannot impersonate platform users"
        }

        // Create session
        val session = ImpersonationSession.create(
            platformUserId = principal.userId,
            targetTenantId = request.tenantId,
            targetUserId = targetUser.id,
            purpose = request.purpose,
            ipAddress = ipAddress,
            userAgent = userAgent
        )
        val savedSession = sessionRepository.save(session)

        // Generate impersonation token
        val token = jwtTokenProvider.generateImpersonationToken(
            targetUser = targetUser,
            impersonatorId = principal.userId,
            expirationMs = tokenExpirationMs
        )
        val expiresAt = jwtTokenProvider.getExpiration(token)

        // Audit log
        auditService.log(
            action = AuditAction.IMPERSONATE_START,
            entityType = "ImpersonationSession",
            entityId = savedSession.id,
            description = "Impersonation started by ${principal.email} for ${targetUser.email}. Purpose: ${request.purpose}",
            newValue = """{"impersonatorId": "${principal.userId}", "targetUserId": "${targetUser.id}", "sessionId": "${savedSession.id}"}"""
        )

        eventPublisher.publishEvent(PlatformEvent.ImpersonationStarted(
            sessionId = savedSession.id,
            platformUserId = principal.userId,
            platformUserEmail = principal.email,
            targetUserId = targetUser.id,
            targetTenantId = request.tenantId,
            purpose = request.purpose
        ))

        logger.info(
            "Impersonation started: {} impersonating {} (session: {})",
            principal.email, targetUser.email, savedSession.id
        )

        return ImpersonationTokenResponse(
            accessToken = token,
            sessionId = savedSession.id,
            impersonatedUserId = targetUser.id,
            impersonatedUserEmail = targetUser.email,
            tenantId = request.tenantId,
            expiresAt = expiresAt
        )
    }

    @Transactional
    fun endImpersonation(platformUserId: UUID): ImpersonationSessionResponse {
        val session = sessionRepository.findByPlatformUserIdAndIsActiveTrue(platformUserId)
            .orElseThrow { ImpersonationSessionNotFoundException(platformUserId) }

        session.endSession()
        val saved = sessionRepository.save(session)

        auditService.log(
            action = AuditAction.IMPERSONATE_END,
            entityType = "ImpersonationSession",
            entityId = saved.id,
            description = "Impersonation ended for session ${saved.id}",
            oldValue = """{"sessionId": "${saved.id}", "actionsCount": ${saved.getActionsList().size}}"""
        )

        eventPublisher.publishEvent(PlatformEvent.ImpersonationEnded(
            sessionId = saved.id,
            platformUserId = platformUserId,
            actionsCount = saved.getActionsList().size
        ))

        logger.info("Impersonation ended: session {}", saved.id)

        return ImpersonationSessionResponse.from(saved)
    }

    @Transactional
    fun forceEndSession(sessionId: UUID): ImpersonationSessionResponse {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { ImpersonationSessionNotFoundException(sessionId) }

        session.endSession()
        val saved = sessionRepository.save(session)

        auditService.log(
            action = AuditAction.IMPERSONATE_END,
            entityType = "ImpersonationSession",
            entityId = saved.id,
            description = "Impersonation force-ended for session ${saved.id}",
            oldValue = """{"sessionId": "${saved.id}", "forceEnded": true}"""
        )

        logger.info("Impersonation force-ended: session {}", saved.id)

        return ImpersonationSessionResponse.from(saved)
    }

    @Transactional(readOnly = true)
    fun getActiveSessions(): List<ImpersonationSessionResponse> {
        return sessionRepository.findByIsActiveTrue().map { ImpersonationSessionResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getHistory(
        platformUserId: UUID?,
        targetTenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        pageable: Pageable
    ): Page<ImpersonationSessionResponse> {
        return sessionRepository.findByFilters(platformUserId, targetTenantId, dateFrom, dateTo, pageable)
            .map { ImpersonationSessionResponse.from(it) }
    }

    @Transactional
    fun logAction(impersonatorId: UUID, action: String) {
        sessionRepository.findByPlatformUserIdAndIsActiveTrue(impersonatorId).ifPresent { session ->
            session.addAction(action)
            sessionRepository.save(session)
        }
    }
}
