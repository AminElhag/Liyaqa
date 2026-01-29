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
import java.time.LocalDate
import java.util.UUID

/**
 * Data processing activity for PDPL Article 7 register.
 */
@Entity
@Table(name = "data_processing_activities")
class DataProcessingActivity(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @Column(name = "tenant_id", nullable = false)
    var tenantId: UUID,

    @Column(name = "activity_name", nullable = false)
    var activityName: String,

    @Column(name = "activity_name_ar")
    var activityNameAr: String? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    var descriptionAr: String? = null,

    @Column(name = "purpose", nullable = false, length = 500)
    var purpose: String,

    @Column(name = "purpose_ar", length = 500)
    var purposeAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "legal_basis", nullable = false)
    var legalBasis: LegalBasis,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_categories", nullable = false)
    var dataCategories: List<String>,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_subjects", nullable = false)
    var dataSubjects: List<String>,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recipients")
    var recipients: List<String>? = null,

    @Column(name = "retention_period_days")
    var retentionPeriodDays: Int? = null,

    @Column(name = "retention_justification", columnDefinition = "TEXT")
    var retentionJustification: String? = null,

    @Column(name = "cross_border_transfer")
    var crossBorderTransfer: Boolean = false,

    @Column(name = "transfer_country")
    var transferCountry: String? = null,

    @Column(name = "transfer_safeguards", columnDefinition = "TEXT")
    var transferSafeguards: String? = null,

    @Column(name = "security_measures", columnDefinition = "TEXT")
    var securityMeasures: String? = null,

    @Column(name = "automated_decision_making")
    var automatedDecisionMaking: Boolean = false,

    @Column(name = "profiling")
    var profiling: Boolean = false,

    @Column(name = "privacy_impact_required")
    var privacyImpactRequired: Boolean = false,

    @Column(name = "privacy_impact_completed")
    var privacyImpactCompleted: Boolean = false,

    @Column(name = "owner_id")
    var ownerId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: ProcessingActivityStatus = ProcessingActivityStatus.DRAFT,

    @Column(name = "last_reviewed_at")
    var lastReviewedAt: Instant? = null,

    @Column(name = "next_review_date")
    var nextReviewDate: LocalDate? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    /**
     * Activate the processing activity.
     */
    fun activate() {
        status = ProcessingActivityStatus.ACTIVE
        updatedAt = Instant.now()
    }

    /**
     * Mark for review.
     */
    fun markForReview() {
        status = ProcessingActivityStatus.UNDER_REVIEW
        updatedAt = Instant.now()
    }

    /**
     * Complete review.
     */
    fun completeReview(nextReview: LocalDate) {
        status = ProcessingActivityStatus.ACTIVE
        lastReviewedAt = Instant.now()
        nextReviewDate = nextReview
        updatedAt = Instant.now()
    }

    /**
     * Archive the activity.
     */
    fun archive() {
        status = ProcessingActivityStatus.ARCHIVED
        updatedAt = Instant.now()
    }

    /**
     * Check if high-risk processing (requires privacy impact assessment).
     */
    fun isHighRiskProcessing(): Boolean {
        return automatedDecisionMaking ||
                profiling ||
                crossBorderTransfer ||
                dataCategories.any { it in listOf("health", "biometric", "financial", "children") }
    }

    /**
     * Check if review is due.
     */
    fun isReviewDue(): Boolean {
        return nextReviewDate?.isBefore(LocalDate.now()) == true
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DataProcessingActivity) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
