package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Control requirement for a compliance framework.
 */
@Entity
@Table(name = "compliance_requirements")
class ComplianceRequirement(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "framework_id", nullable = false)
    val framework: ComplianceFramework,

    @Column(name = "control_number", nullable = false)
    var controlNumber: String,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "title_ar")
    var titleAr: String? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    var descriptionAr: String? = null,

    @Column(name = "category")
    var category: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_requirement_id")
    var parentRequirement: ComplianceRequirement? = null,

    @Column(name = "is_mandatory")
    var isMandatory: Boolean = true,

    @Column(name = "evidence_required")
    var evidenceRequired: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ComplianceRequirement) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
