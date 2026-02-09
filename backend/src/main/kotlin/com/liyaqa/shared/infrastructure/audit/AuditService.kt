package com.liyaqa.shared.infrastructure.audit

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.AuditLog
import com.liyaqa.shared.domain.TenantContext
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.scheduling.annotation.Async
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.time.Instant
import java.util.UUID

/**
 * Service for creating and querying audit logs.
 * Provides async logging to minimize performance impact.
 */
@Service
class AuditService(
    private val auditLogRepository: AuditLogRepository
) {
    private val logger = LoggerFactory.getLogger(AuditService::class.java)

    /**
     * Logs an audit event asynchronously.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun logAsync(
        action: AuditAction,
        entityType: String,
        entityId: UUID,
        description: String? = null,
        oldValue: String? = null,
        newValue: String? = null
    ) {
        try {
            val auditLog = buildAuditLog(action, entityType, entityId, description, oldValue, newValue)
            auditLogRepository.save(auditLog)
            logger.debug("Audit log created: {} {} {}", action, entityType, entityId)
        } catch (e: Exception) {
            logger.error("Failed to create audit log: ${e.message}", e)
        }
    }

    /**
     * Logs an audit event synchronously (use sparingly).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun log(
        action: AuditAction,
        entityType: String,
        entityId: UUID,
        description: String? = null,
        oldValue: String? = null,
        newValue: String? = null
    ): AuditLog {
        val auditLog = buildAuditLog(action, entityType, entityId, description, oldValue, newValue)
        return auditLogRepository.save(auditLog)
    }

    /**
     * Gets audit history for an entity.
     */
    @Transactional(readOnly = true)
    fun getEntityHistory(entityType: String, entityId: UUID): List<AuditLog> {
        return auditLogRepository.getEntityHistory(entityType, entityId)
    }

    /**
     * Gets audit logs by entity with pagination.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByEntity(entityType: String, entityId: UUID, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable)
    }

    /**
     * Gets audit logs by user.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByUser(userId: UUID, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByUserId(userId, pageable)
    }

    /**
     * Gets audit logs by action type.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByAction(action: AuditAction, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByAction(action, pageable)
    }

    /**
     * Gets audit logs within a date range.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByDateRange(start: Instant, end: Instant, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByCreatedAtBetween(start, end, pageable)
    }

    /**
     * Gets all audit logs with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllAuditLogs(pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findAll(pageable)
    }

    /**
     * Gets audit logs by entity type with pagination.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByEntityType(entityType: String, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByEntityType(entityType, pageable)
    }

    /**
     * Gets audit logs by organization ID.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByOrganization(organizationId: UUID, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Gets audit logs by organization ID and action type.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByOrganizationAndAction(organizationId: UUID, action: AuditAction, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByOrganizationIdAndAction(organizationId, action, pageable)
    }

    /**
     * Gets audit logs by organization ID within a date range.
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByOrganizationAndDateRange(organizationId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AuditLog> {
        return auditLogRepository.findByOrganizationIdAndCreatedAtBetween(organizationId, start, end, pageable)
    }

    private fun buildAuditLog(
        action: AuditAction,
        entityType: String,
        entityId: UUID,
        description: String?,
        oldValue: String?,
        newValue: String?
    ): AuditLog {
        val principal = getCurrentPrincipal()
        val request = getCurrentRequest()

        return AuditLog.create(
            action = action,
            entityType = entityType,
            entityId = entityId,
            userId = principal?.userId,
            userEmail = principal?.email,
            description = description,
            oldValue = oldValue,
            newValue = newValue,
            tenantId = TenantContext.getCurrentTenantOrNull()?.value,
            organizationId = TenantContext.getCurrentOrganizationOrNull()?.value,
            ipAddress = request?.let { getClientIp(it) },
            userAgent = request?.getHeader("User-Agent")
        )
    }

    private fun getCurrentPrincipal(): JwtUserPrincipal? {
        return try {
            SecurityContextHolder.getContext().authentication?.principal as? JwtUserPrincipal
        } catch (e: Exception) {
            null
        }
    }

    private fun getCurrentRequest(): HttpServletRequest? {
        return try {
            (RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes)?.request
        } catch (e: Exception) {
            null
        }
    }

    private fun getClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            return xForwardedFor.split(",").first().trim()
        }
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp.trim()
        }
        return request.remoteAddr ?: "unknown"
    }
}
