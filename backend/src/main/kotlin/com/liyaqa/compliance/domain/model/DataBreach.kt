package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

/**
 * Data breach record with SDAIA notification tracking (PDPL Article 29).
 */
@Entity
@Table(name = "data_breaches")
class DataBreach(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @Column(name = "tenant_id", nullable = false)
    var tenantId: UUID,

    @Column(name = "breach_number", nullable = false)
    val breachNumber: String,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "discovered_at", nullable = false)
    var discoveredAt: Instant,

    @Column(name = "discovered_by")
    var discoveredBy: UUID? = null,

    @Column(name = "occurred_at")
    var occurredAt: Instant? = null,

    @Column(name = "contained_at")
    var containedAt: Instant? = null,

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "breach_type", nullable = false)
    var breachType: BreachType,

    @Enumerated(EnumType.STRING)
    @Column(name = "breach_source")
    var breachSource: BreachSource? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "affected_data_types")
    var affectedDataTypes: List<String>? = null,

    @Column(name = "affected_records_count")
    var affectedRecordsCount: Int? = null,

    @Column(name = "affected_members_count")
    var affectedMembersCount: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    var severity: SecuritySeverity,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: BreachStatus = BreachStatus.DETECTED,

    @Column(name = "lead_investigator_id")
    var leadInvestigatorId: UUID? = null,

    @Column(name = "root_cause", columnDefinition = "TEXT")
    var rootCause: String? = null,

    @Column(name = "impact_assessment", columnDefinition = "TEXT")
    var impactAssessment: String? = null,

    @Column(name = "remediation_actions", columnDefinition = "TEXT")
    var remediationActions: String? = null,

    @Column(name = "lessons_learned", columnDefinition = "TEXT")
    var lessonsLearned: String? = null,

    // SDAIA Notification (PDPL Article 29: within 72 hours)
    @Column(name = "sdaia_notification_required")
    var sdaiaNotificationRequired: Boolean = false,

    @Column(name = "sdaia_notified_at")
    var sdaiaNotifiedAt: Instant? = null,

    @Column(name = "sdaia_notification_reference")
    var sdaiaNotificationReference: String? = null,

    @Column(name = "sdaia_notification_deadline")
    var sdaiaNotificationDeadline: Instant? = null,

    // Affected individuals notification
    @Column(name = "individuals_notification_required")
    var individualsNotificationRequired: Boolean = false,

    @Column(name = "individuals_notified_at")
    var individualsNotifiedAt: Instant? = null,

    @Column(name = "individuals_notification_method")
    var individualsNotificationMethod: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    companion object {
        /**
         * Generate a breach number.
         */
        fun generateBreachNumber(): String {
            val timestamp = System.currentTimeMillis()
            return "BRH-${timestamp}-${(1000..9999).random()}"
        }
    }

    /**
     * Calculate SDAIA notification deadline (72 hours from discovery).
     */
    fun calculateSdaiaDeadline(): Instant {
        return discoveredAt.plusSeconds(72 * 60 * 60) // 72 hours
    }

    /**
     * Start investigation.
     */
    fun startInvestigation(investigatorId: UUID) {
        status = BreachStatus.INVESTIGATING
        leadInvestigatorId = investigatorId
        updatedAt = Instant.now()
    }

    /**
     * Mark as contained.
     */
    fun contain() {
        status = BreachStatus.CONTAINED
        containedAt = Instant.now()
        updatedAt = Instant.now()
    }

    /**
     * Mark as resolved.
     */
    fun resolve(rootCauseAnalysis: String, remediation: String) {
        status = BreachStatus.RESOLVED
        resolvedAt = Instant.now()
        rootCause = rootCauseAnalysis
        remediationActions = remediation
        updatedAt = Instant.now()
    }

    /**
     * Close the breach.
     */
    fun close(lessons: String? = null) {
        status = BreachStatus.CLOSED
        lessonsLearned = lessons
        updatedAt = Instant.now()
    }

    /**
     * Record SDAIA notification.
     */
    fun recordSdaiaNotification(reference: String) {
        sdaiaNotifiedAt = Instant.now()
        sdaiaNotificationReference = reference
        updatedAt = Instant.now()
    }

    /**
     * Record notification to affected individuals.
     */
    fun recordIndividualsNotification(method: String) {
        individualsNotifiedAt = Instant.now()
        individualsNotificationMethod = method
        updatedAt = Instant.now()
    }

    /**
     * Check if SDAIA notification is overdue.
     */
    fun isSdaiaNotificationOverdue(): Boolean {
        return sdaiaNotificationRequired &&
                sdaiaNotifiedAt == null &&
                sdaiaNotificationDeadline?.isBefore(Instant.now()) == true
    }

    /**
     * Determine if breach requires SDAIA notification based on severity and scope.
     */
    fun assessNotificationRequirements() {
        // High/Critical severity or large number of affected individuals triggers notification
        sdaiaNotificationRequired = severity in listOf(SecuritySeverity.HIGH, SecuritySeverity.CRITICAL) ||
                (affectedMembersCount ?: 0) > 100 ||
                affectedDataTypes?.any { it in listOf("health", "financial", "biometric") } == true

        if (sdaiaNotificationRequired) {
            sdaiaNotificationDeadline = calculateSdaiaDeadline()
        }

        // Individuals notification required for high-risk breaches
        individualsNotificationRequired = sdaiaNotificationRequired &&
                (severity == SecuritySeverity.CRITICAL ||
                        affectedDataTypes?.any { it in listOf("health", "financial", "biometric") } == true)

        updatedAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DataBreach) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
