package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

/**
 * Security event log entry for audit and compliance purposes.
 * Captures authentication failures, intrusion attempts, PII access, etc.
 */
@Entity
@Table(name = "security_events")
class SecurityEvent(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    var tenantId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    var eventType: SecurityEventType,

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    var severity: SecuritySeverity,

    @Column(name = "source_ip")
    var sourceIp: String? = null,

    @Column(name = "user_id")
    var userId: UUID? = null,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    var userAgent: String? = null,

    @Column(name = "resource_type")
    var resourceType: String? = null,

    @Column(name = "resource_id")
    var resourceId: String? = null,

    @Column(name = "action")
    var action: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome")
    var outcome: SecurityOutcome? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details")
    var details: Map<String, Any>? = null,

    @Column(name = "risk_score")
    var riskScore: Int = 0,

    @Column(name = "investigated")
    var investigated: Boolean = false,

    @Column(name = "investigated_by")
    var investigatedBy: UUID? = null,

    @Column(name = "investigated_at")
    var investigatedAt: Instant? = null,

    @Column(name = "investigation_notes", columnDefinition = "TEXT")
    var investigationNotes: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    /**
     * Mark this event as investigated.
     */
    fun markInvestigated(investigatorId: UUID, notes: String? = null) {
        investigated = true
        investigatedBy = investigatorId
        investigatedAt = Instant.now()
        investigationNotes = notes
    }

    /**
     * Calculate risk score based on event type and severity.
     */
    fun calculateRiskScore(): Int {
        val severityScore = when (severity) {
            SecuritySeverity.LOW -> 1
            SecuritySeverity.MEDIUM -> 2
            SecuritySeverity.HIGH -> 3
            SecuritySeverity.CRITICAL -> 5
        }

        val typeMultiplier = when (eventType) {
            SecurityEventType.INTRUSION_ATTEMPT -> 3
            SecurityEventType.AUTH_FAILURE -> 1
            SecurityEventType.PII_ACCESS -> 2
            SecurityEventType.SUSPICIOUS_ACTIVITY -> 2
            SecurityEventType.DATA_EXPORT -> 2
            SecurityEventType.CONFIG_CHANGE -> 2
            SecurityEventType.ROLE_CHANGE -> 2
            SecurityEventType.PERMISSION_DENIED -> 1
            else -> 1
        }

        riskScore = severityScore * typeMultiplier
        return riskScore
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SecurityEvent) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
