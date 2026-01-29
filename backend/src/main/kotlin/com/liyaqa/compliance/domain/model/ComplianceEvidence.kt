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
import java.time.LocalDate
import java.util.UUID

/**
 * Evidence document for a control implementation.
 */
@Entity
@Table(name = "compliance_evidence")
class ComplianceEvidence(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "control_implementation_id", nullable = false)
    val controlImplementation: ControlImplementation,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false)
    var evidenceType: EvidenceType,

    @Column(name = "file_path")
    var filePath: String? = null,

    @Column(name = "file_name")
    var fileName: String? = null,

    @Column(name = "file_size")
    var fileSize: Long? = null,

    @Column(name = "mime_type")
    var mimeType: String? = null,

    @Column(name = "uploaded_by", nullable = false)
    val uploadedBy: UUID,

    @Column(name = "valid_from")
    var validFrom: LocalDate? = null,

    @Column(name = "valid_until")
    var validUntil: LocalDate? = null,

    @Column(name = "is_current")
    var isCurrent: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
) {
    /**
     * Mark evidence as no longer current (superseded by newer evidence).
     */
    fun markSuperseded() {
        isCurrent = false
        updatedAt = Instant.now()
    }

    /**
     * Check if evidence is expired.
     */
    fun isExpired(): Boolean {
        return validUntil?.isBefore(LocalDate.now()) == true
    }

    /**
     * Check if evidence is within validity period.
     */
    fun isValid(): Boolean {
        val now = LocalDate.now()
        val afterStart = validFrom?.let { now.isAfter(it) || now.isEqual(it) } != false
        val beforeEnd = validUntil?.let { now.isBefore(it) || now.isEqual(it) } != false
        return isCurrent && afterStart && beforeEnd
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ComplianceEvidence) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
