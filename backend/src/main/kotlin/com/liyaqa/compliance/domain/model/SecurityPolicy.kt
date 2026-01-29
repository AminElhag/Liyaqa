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
 * Security policy document with versioning.
 */
@Entity
@Table(name = "security_policies")
class SecurityPolicy(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "policy_type", nullable = false)
    var policyType: PolicyType,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "title_ar")
    var titleAr: String? = null,

    @Column(name = "content", columnDefinition = "TEXT")
    var content: String? = null,

    @Column(name = "content_ar", columnDefinition = "TEXT")
    var contentAr: String? = null,

    @Column(name = "version", nullable = false)
    var policyVersion: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: PolicyStatus = PolicyStatus.DRAFT,

    @Column(name = "effective_date")
    var effectiveDate: LocalDate? = null,

    @Column(name = "review_date")
    var reviewDate: LocalDate? = null,

    @Column(name = "next_review_date")
    var nextReviewDate: LocalDate? = null,

    @Column(name = "owner_id")
    var ownerId: UUID? = null,

    @Column(name = "approved_by")
    var approvedBy: UUID? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @Column(name = "acknowledgement_required")
    var acknowledgementRequired: Boolean = false,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "related_framework_ids")
    var relatedFrameworkIds: List<UUID>? = null,

    @Column(name = "document_path")
    var documentPath: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version_num")
    var versionNum: Long = 0
) {
    /**
     * Submit for review.
     */
    fun submitForReview() {
        require(status == PolicyStatus.DRAFT) { "Can only submit DRAFT policies for review" }
        status = PolicyStatus.UNDER_REVIEW
        updatedAt = Instant.now()
    }

    /**
     * Approve the policy.
     */
    fun approve(approverId: UUID) {
        require(status == PolicyStatus.UNDER_REVIEW) { "Can only approve policies UNDER_REVIEW" }
        status = PolicyStatus.APPROVED
        approvedBy = approverId
        approvedAt = Instant.now()
        updatedAt = Instant.now()
    }

    /**
     * Publish the policy.
     */
    fun publish(effectiveFrom: LocalDate = LocalDate.now()) {
        require(status == PolicyStatus.APPROVED) { "Can only publish APPROVED policies" }
        status = PolicyStatus.PUBLISHED
        effectiveDate = effectiveFrom
        updatedAt = Instant.now()
    }

    /**
     * Archive the policy.
     */
    fun archive() {
        status = PolicyStatus.ARCHIVED
        updatedAt = Instant.now()
    }

    /**
     * Send back to draft.
     */
    fun returnToDraft() {
        require(status == PolicyStatus.UNDER_REVIEW) { "Can only return to draft from UNDER_REVIEW" }
        status = PolicyStatus.DRAFT
        updatedAt = Instant.now()
    }

    /**
     * Schedule review.
     */
    fun scheduleReview(reviewDate: LocalDate) {
        this.nextReviewDate = reviewDate
        updatedAt = Instant.now()
    }

    /**
     * Complete review.
     */
    fun completeReview(nextReview: LocalDate) {
        reviewDate = LocalDate.now()
        nextReviewDate = nextReview
        updatedAt = Instant.now()
    }

    /**
     * Check if review is due.
     */
    fun isReviewDue(): Boolean {
        return nextReviewDate?.isBefore(LocalDate.now()) == true
    }

    /**
     * Check if policy is active (published and effective).
     */
    fun isActive(): Boolean {
        return status == PolicyStatus.PUBLISHED &&
                (effectiveDate == null || !effectiveDate!!.isAfter(LocalDate.now()))
    }

    /**
     * Increment version number.
     */
    fun incrementVersion(): String {
        val parts = policyVersion.split(".")
        return if (parts.size >= 2) {
            "${parts[0]}.${parts[1].toInt() + 1}"
        } else {
            "${policyVersion.toDoubleOrNull()?.plus(0.1) ?: 1.1}"
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SecurityPolicy) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
