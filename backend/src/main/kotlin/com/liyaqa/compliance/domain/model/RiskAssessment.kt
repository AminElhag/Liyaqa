package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Risk assessment record.
 */
@Entity
@Table(name = "risk_assessments")
class RiskAssessment(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @Column(name = "tenant_id", nullable = false)
    var tenantId: UUID,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "assessment_date", nullable = false)
    var assessmentDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: RiskAssessmentStatus = RiskAssessmentStatus.DRAFT,

    @Column(name = "scope", columnDefinition = "TEXT")
    var scope: String? = null,

    @Column(name = "methodology")
    var methodology: String? = null,

    @Column(name = "assessor_id")
    var assessorId: UUID? = null,

    @Column(name = "reviewer_id")
    var reviewerId: UUID? = null,

    @Column(name = "approved_by")
    var approvedBy: UUID? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @Column(name = "total_risks")
    var totalRisks: Int = 0,

    @Column(name = "high_risks")
    var highRisks: Int = 0,

    @Column(name = "medium_risks")
    var mediumRisks: Int = 0,

    @Column(name = "low_risks")
    var lowRisks: Int = 0,

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
     * Start the assessment.
     */
    fun start() {
        require(status == RiskAssessmentStatus.DRAFT) { "Can only start from DRAFT status" }
        status = RiskAssessmentStatus.IN_PROGRESS
        updatedAt = Instant.now()
    }

    /**
     * Complete the assessment.
     */
    fun complete() {
        require(status == RiskAssessmentStatus.IN_PROGRESS) { "Can only complete from IN_PROGRESS status" }
        status = RiskAssessmentStatus.COMPLETED
        updatedAt = Instant.now()
    }

    /**
     * Approve the assessment.
     */
    fun approve(approverId: UUID) {
        require(status == RiskAssessmentStatus.COMPLETED) { "Can only approve a COMPLETED assessment" }
        status = RiskAssessmentStatus.APPROVED
        approvedBy = approverId
        approvedAt = Instant.now()
        updatedAt = Instant.now()
    }

    /**
     * Archive the assessment.
     */
    fun archive() {
        status = RiskAssessmentStatus.ARCHIVED
        updatedAt = Instant.now()
    }

    /**
     * Update risk counts.
     */
    fun updateRiskCounts(total: Int, high: Int, medium: Int, low: Int) {
        totalRisks = total
        highRisks = high
        mediumRisks = medium
        lowRisks = low
        updatedAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RiskAssessment) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
