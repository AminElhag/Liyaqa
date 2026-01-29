package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.time.Instant
import java.util.UUID

/**
 * Data retention rule for an entity type.
 */
@Entity
@Table(name = "data_retention_rules")
class DataRetentionRule(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @Column(name = "entity_type", nullable = false)
    var entityType: String,

    @Column(name = "retention_period_days", nullable = false)
    var retentionPeriodDays: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "action_on_expiry", nullable = false)
    var actionOnExpiry: RetentionAction,

    @Column(name = "legal_basis", columnDefinition = "TEXT")
    var legalBasis: String? = null,

    @Column(name = "applies_to_deleted_only")
    var appliesToDeletedOnly: Boolean = false,

    @Column(name = "is_active")
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Column(name = "last_processed_at")
    var lastProcessedAt: Instant? = null,

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    /**
     * Get the cutoff date for retention.
     * Data older than this date should be processed according to actionOnExpiry.
     */
    fun getRetentionCutoffDate(): Instant {
        return Instant.now().minusSeconds(retentionPeriodDays.toLong() * 24 * 60 * 60)
    }
    /**
     * Deactivate the rule.
     */
    fun deactivate() {
        isActive = false
        updatedAt = Instant.now()
    }

    /**
     * Activate the rule.
     */
    fun activate() {
        isActive = true
        updatedAt = Instant.now()
    }

    /**
     * Update retention period.
     */
    fun updateRetentionPeriod(days: Int, basis: String? = null) {
        retentionPeriodDays = days
        legalBasis = basis ?: legalBasis
        updatedAt = Instant.now()
    }

    /**
     * Check if data should be retained.
     */
    fun shouldRetain(dataAgeInDays: Long): Boolean {
        return dataAgeInDays < retentionPeriodDays
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DataRetentionRule) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
