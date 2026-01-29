package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.SecurityEvent
import com.liyaqa.compliance.domain.model.SecurityEventType
import com.liyaqa.compliance.domain.model.SecurityOutcome
import com.liyaqa.compliance.domain.model.SecuritySeverity
import com.liyaqa.compliance.domain.ports.SecurityEventRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
@Transactional
class SecurityEventService(
    private val securityEventRepository: SecurityEventRepository
) {
    private val logger = LoggerFactory.getLogger(SecurityEventService::class.java)

    /**
     * Log a security event.
     */
    fun logEvent(
        eventType: SecurityEventType,
        severity: SecuritySeverity,
        action: String? = null,
        resourceType: String? = null,
        resourceId: String? = null,
        outcome: SecurityOutcome? = null,
        details: Map<String, Any>? = null,
        userId: UUID? = null,
        sourceIp: String? = null,
        userAgent: String? = null
    ): SecurityEvent {
        val tenantId = TenantContext.getCurrentTenantOrNull()?.value
            ?: throw IllegalStateException("No tenant context available")

        val event = SecurityEvent(
            tenantId = tenantId,
            eventType = eventType,
            severity = severity,
            action = action,
            resourceType = resourceType,
            resourceId = resourceId,
            outcome = outcome,
            details = details,
            userId = userId,
            sourceIp = sourceIp,
            userAgent = userAgent
        )
        event.calculateRiskScore()

        val saved = securityEventRepository.save(event)
        logger.debug("Logged security event: type={}, severity={}, action={}", eventType, severity, action)
        return saved
    }

    /**
     * Get security events for the current tenant.
     */
    @Transactional(readOnly = true)
    fun getEvents(pageable: Pageable): Page<SecurityEvent> {
        val tenantId = TenantContext.getCurrentTenant().value
        return securityEventRepository.findByTenantId(tenantId, pageable)
    }

    /**
     * Get security events by type.
     */
    @Transactional(readOnly = true)
    fun getEventsByType(eventType: SecurityEventType, pageable: Pageable): Page<SecurityEvent> {
        val tenantId = TenantContext.getCurrentTenant().value
        return securityEventRepository.findByTenantIdAndEventType(tenantId, eventType, pageable)
    }

    /**
     * Get security events by severity.
     */
    @Transactional(readOnly = true)
    fun getEventsBySeverity(severity: SecuritySeverity, pageable: Pageable): Page<SecurityEvent> {
        val tenantId = TenantContext.getCurrentTenant().value
        return securityEventRepository.findByTenantIdAndSeverity(tenantId, severity, pageable)
    }

    /**
     * Get uninvestigated security events.
     */
    @Transactional(readOnly = true)
    fun getUninvestigatedEvents(pageable: Pageable): Page<SecurityEvent> {
        val tenantId = TenantContext.getCurrentTenant().value
        return securityEventRepository.findByTenantIdAndInvestigated(tenantId, false, pageable)
    }

    /**
     * Get security events for a specific user.
     */
    @Transactional(readOnly = true)
    fun getEventsByUser(userId: UUID, pageable: Pageable): Page<SecurityEvent> {
        val tenantId = TenantContext.getCurrentTenant().value
        return securityEventRepository.findByTenantIdAndUserId(tenantId, userId, pageable)
    }

    /**
     * Get security events within a date range.
     */
    @Transactional(readOnly = true)
    fun getEventsByDateRange(startDate: Instant, endDate: Instant, pageable: Pageable): Page<SecurityEvent> {
        val tenantId = TenantContext.getCurrentTenant().value
        return securityEventRepository.findByTenantIdAndDateRange(tenantId, startDate, endDate, pageable)
    }

    /**
     * Mark an event as investigated.
     */
    fun investigateEvent(eventId: UUID, investigatorId: UUID, notes: String?): SecurityEvent {
        val event = securityEventRepository.findById(eventId)
            .orElseThrow { NoSuchElementException("Security event not found: $eventId") }

        event.markInvestigated(investigatorId, notes)
        logger.info("Security event {} marked as investigated by {}", eventId, investigatorId)
        return securityEventRepository.save(event)
    }

    /**
     * Get security statistics for dashboard.
     */
    @Transactional(readOnly = true)
    fun getSecurityStats(): SecurityStats {
        val tenantId = TenantContext.getCurrentTenant().value

        return SecurityStats(
            totalEvents = securityEventRepository.findByTenantId(tenantId, Pageable.unpaged()).totalElements,
            criticalEvents = securityEventRepository.countByTenantIdAndSeverity(tenantId, SecuritySeverity.CRITICAL),
            highEvents = securityEventRepository.countByTenantIdAndSeverity(tenantId, SecuritySeverity.HIGH),
            mediumEvents = securityEventRepository.countByTenantIdAndSeverity(tenantId, SecuritySeverity.MEDIUM),
            lowEvents = securityEventRepository.countByTenantIdAndSeverity(tenantId, SecuritySeverity.LOW),
            uninvestigatedCount = securityEventRepository.countByTenantIdAndInvestigated(tenantId, false)
        )
    }

    /**
     * Get recent high-severity events (last 24 hours).
     */
    @Transactional(readOnly = true)
    fun getRecentHighSeverityEvents(pageable: Pageable): Page<SecurityEvent> {
        val tenantId = TenantContext.getCurrentTenant().value
        val yesterday = Instant.now().minus(24, ChronoUnit.HOURS)
        return securityEventRepository.findByTenantIdAndDateRange(tenantId, yesterday, Instant.now(), pageable)
    }
}

data class SecurityStats(
    val totalEvents: Long,
    val criticalEvents: Long,
    val highEvents: Long,
    val mediumEvents: Long,
    val lowEvents: Long,
    val uninvestigatedCount: Long
)
