package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Audit log for data deletions.
 */
@Entity
@Table(name = "data_deletion_log")
class DataDeletionLog(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "entity_type", nullable = false)
    val entityType: String,

    @Column(name = "entity_id", nullable = false)
    val entityId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "deletion_type", nullable = false)
    val deletionType: DeletionType,

    @Column(name = "deleted_by")
    val deletedBy: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "deletion_reason")
    val deletionReason: DeletionReason? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retention_rule_id")
    val retentionRule: DataRetentionRule? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dsr_request_id")
    val dsrRequest: DataSubjectRequest? = null,

    @Column(name = "original_data_hash")
    val originalDataHash: String? = null,

    @Column(name = "deleted_at", nullable = false)
    val deletedAt: Instant = Instant.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DataDeletionLog) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
