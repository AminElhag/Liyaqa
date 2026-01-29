package com.liyaqa.compliance.infrastructure.security

import com.liyaqa.compliance.domain.model.SecurityEvent
import com.liyaqa.compliance.domain.model.SecurityEventType
import com.liyaqa.compliance.domain.model.SecurityOutcome
import com.liyaqa.compliance.domain.model.SecuritySeverity
import com.liyaqa.compliance.domain.ports.SecurityEventRepository
import com.liyaqa.shared.domain.TenantContext
import jakarta.servlet.http.HttpServletRequest
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.reflect.MethodSignature
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.util.UUID

/**
 * Annotation to mark methods for enhanced audit logging.
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuditAdminAction(
    val action: String,
    val resourceType: String,
    val severity: SecuritySeverity = SecuritySeverity.MEDIUM,
    val description: String = ""
)

/**
 * Annotation to mark methods that access PII data.
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuditPiiAccess(
    val dataType: String,
    val legalBasis: String = "LEGITIMATE_INTEREST",
    val description: String = ""
)

/**
 * Sensitivity level for audit events.
 */
enum class SensitivityLevel {
    NORMAL,
    SENSITIVE,
    CRITICAL,
    PII
}

/**
 * Enhanced audit logging aspect for compliance requirements.
 * Captures admin actions, PII access, and security-relevant events.
 */
@Aspect
@Component
class EnhancedAuditAspect(
    private val securityEventRepository: SecurityEventRepository
) {
    private val logger = LoggerFactory.getLogger(EnhancedAuditAspect::class.java)

    /**
     * Audit admin actions.
     */
    @Around("@annotation(auditAdminAction)")
    fun auditAdminAction(joinPoint: ProceedingJoinPoint, auditAdminAction: AuditAdminAction): Any? {
        val startTime = System.currentTimeMillis()
        var outcome = SecurityOutcome.SUCCESS
        var errorMessage: String? = null

        return try {
            joinPoint.proceed()
        } catch (e: Exception) {
            outcome = SecurityOutcome.FAILURE
            errorMessage = e.message
            throw e
        } finally {
            try {
                val duration = System.currentTimeMillis() - startTime
                logSecurityEvent(
                    eventType = SecurityEventType.CONFIG_CHANGE,
                    severity = auditAdminAction.severity,
                    action = auditAdminAction.action,
                    resourceType = auditAdminAction.resourceType,
                    resourceId = extractResourceId(joinPoint),
                    outcome = outcome,
                    details = mapOf(
                        "description" to auditAdminAction.description,
                        "method" to getMethodName(joinPoint),
                        "duration_ms" to duration,
                        "error" to errorMessage
                    ).filterValues { it != null }
                )
            } catch (e: Exception) {
                logger.error("Failed to log admin action audit event", e)
            }
        }
    }

    /**
     * Audit PII access.
     */
    @Around("@annotation(auditPiiAccess)")
    fun auditPiiAccess(joinPoint: ProceedingJoinPoint, auditPiiAccess: AuditPiiAccess): Any? {
        val startTime = System.currentTimeMillis()
        var outcome = SecurityOutcome.SUCCESS
        var errorMessage: String? = null

        return try {
            joinPoint.proceed()
        } catch (e: Exception) {
            outcome = SecurityOutcome.FAILURE
            errorMessage = e.message
            throw e
        } finally {
            try {
                val duration = System.currentTimeMillis() - startTime
                logSecurityEvent(
                    eventType = SecurityEventType.PII_ACCESS,
                    severity = SecuritySeverity.MEDIUM,
                    action = "ACCESS",
                    resourceType = auditPiiAccess.dataType,
                    resourceId = extractResourceId(joinPoint),
                    outcome = outcome,
                    details = mapOf(
                        "legal_basis" to auditPiiAccess.legalBasis,
                        "description" to auditPiiAccess.description,
                        "method" to getMethodName(joinPoint),
                        "duration_ms" to duration,
                        "error" to errorMessage
                    ).filterValues { it != null }
                )
            } catch (e: Exception) {
                logger.error("Failed to log PII access audit event", e)
            }
        }
    }

    /**
     * Log authentication failures.
     */
    fun logAuthFailure(username: String?, reason: String, ipAddress: String? = null) {
        try {
            logSecurityEvent(
                eventType = SecurityEventType.AUTH_FAILURE,
                severity = SecuritySeverity.MEDIUM,
                action = "LOGIN_ATTEMPT",
                resourceType = "USER",
                resourceId = username,
                outcome = SecurityOutcome.FAILURE,
                details = mapOf(
                    "reason" to reason,
                    "username" to username
                ).filterValues { it != null },
                overrideIp = ipAddress
            )
        } catch (e: Exception) {
            logger.error("Failed to log auth failure event", e)
        }
    }

    /**
     * Log data export events.
     */
    fun logDataExport(resourceType: String, recordCount: Int, format: String, purpose: String? = null) {
        try {
            logSecurityEvent(
                eventType = SecurityEventType.DATA_EXPORT,
                severity = SecuritySeverity.HIGH,
                action = "EXPORT",
                resourceType = resourceType,
                resourceId = null,
                outcome = SecurityOutcome.SUCCESS,
                details = mapOf(
                    "record_count" to recordCount,
                    "format" to format,
                    "purpose" to purpose
                ).filterValues { it != null }
            )
        } catch (e: Exception) {
            logger.error("Failed to log data export event", e)
        }
    }

    /**
     * Log suspicious activity.
     */
    fun logSuspiciousActivity(description: String, details: Map<String, Any?>, severity: SecuritySeverity = SecuritySeverity.HIGH) {
        try {
            logSecurityEvent(
                eventType = SecurityEventType.SUSPICIOUS_ACTIVITY,
                severity = severity,
                action = "SUSPICIOUS_ACTIVITY",
                resourceType = "SYSTEM",
                resourceId = null,
                outcome = SecurityOutcome.BLOCKED,
                details = details + ("description" to description)
            )
        } catch (e: Exception) {
            logger.error("Failed to log suspicious activity event", e)
        }
    }

    /**
     * Log permission denied events.
     */
    fun logPermissionDenied(action: String, resourceType: String, resourceId: String?) {
        try {
            logSecurityEvent(
                eventType = SecurityEventType.PERMISSION_DENIED,
                severity = SecuritySeverity.MEDIUM,
                action = action,
                resourceType = resourceType,
                resourceId = resourceId,
                outcome = SecurityOutcome.BLOCKED,
                details = emptyMap()
            )
        } catch (e: Exception) {
            logger.error("Failed to log permission denied event", e)
        }
    }

    private fun logSecurityEvent(
        eventType: SecurityEventType,
        severity: SecuritySeverity,
        action: String,
        resourceType: String,
        resourceId: String?,
        outcome: SecurityOutcome,
        details: Map<String, Any?>,
        overrideIp: String? = null
    ) {
        val tenantId = TenantContext.getCurrentTenantOrNull()?.value ?: return
        val userId = getCurrentUserId()
        val request = getCurrentRequest()

        val event = SecurityEvent(
            tenantId = tenantId,
            eventType = eventType,
            severity = severity,
            sourceIp = overrideIp ?: request?.remoteAddr,
            userId = userId,
            userAgent = request?.getHeader("User-Agent"),
            resourceType = resourceType,
            resourceId = resourceId,
            action = action,
            outcome = outcome,
            details = details.filterValues { it != null }.mapValues { it.value!! }
        )
        event.calculateRiskScore()

        securityEventRepository.save(event)
        logger.debug("Security event logged: type=$eventType, action=$action, outcome=$outcome")
    }

    private fun getCurrentUserId(): UUID? {
        return try {
            val auth = SecurityContextHolder.getContext().authentication
            if (auth?.name != null && auth.name != "anonymousUser") {
                UUID.fromString(auth.name)
            } else {
                null
            }
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

    private fun getMethodName(joinPoint: ProceedingJoinPoint): String {
        val signature = joinPoint.signature as MethodSignature
        return "${signature.declaringType.simpleName}.${signature.name}"
    }

    private fun extractResourceId(joinPoint: ProceedingJoinPoint): String? {
        val args = joinPoint.args
        val signature = joinPoint.signature as MethodSignature
        val paramNames = signature.parameterNames

        // Look for common ID parameter names
        val idParamIndex = paramNames.indexOfFirst { it in listOf("id", "entityId", "memberId", "userId") }
        return if (idParamIndex >= 0 && args.size > idParamIndex) {
            args[idParamIndex]?.toString()
        } else {
            null
        }
    }
}
