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
import jakarta.persistence.Version
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Tracks implementation status of a control requirement for an organization.
 */
@Entity
@Table(name = "control_implementations")
class ControlImplementation(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    val requirement: ComplianceRequirement,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ControlStatus = ControlStatus.NOT_IMPLEMENTED,

    @Column(name = "implementation_date")
    var implementationDate: LocalDate? = null,

    @Column(name = "implementation_notes", columnDefinition = "TEXT")
    var implementationNotes: String? = null,

    @Column(name = "responsible_user_id")
    var responsibleUserId: UUID? = null,

    @Column(name = "review_date")
    var reviewDate: LocalDate? = null,

    @Column(name = "next_review_date")
    var nextReviewDate: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "effectiveness")
    var effectiveness: ControlEffectiveness? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    /**
     * Mark control as implemented.
     */
    fun implement(notes: String? = null) {
        status = ControlStatus.IMPLEMENTED
        implementationDate = LocalDate.now()
        implementationNotes = notes
        updatedAt = Instant.now()
    }

    /**
     * Mark control as in progress.
     */
    fun startImplementation(notes: String? = null) {
        status = ControlStatus.IN_PROGRESS
        implementationNotes = notes
        updatedAt = Instant.now()
    }

    /**
     * Mark control as not applicable.
     */
    fun markNotApplicable(reason: String) {
        status = ControlStatus.NOT_APPLICABLE
        implementationNotes = reason
        updatedAt = Instant.now()
    }

    /**
     * Record effectiveness review.
     */
    fun recordReview(effectivenessResult: ControlEffectiveness, nextReview: LocalDate? = null) {
        effectiveness = effectivenessResult
        reviewDate = LocalDate.now()
        nextReviewDate = nextReview
        updatedAt = Instant.now()
    }

    /**
     * Assign responsible user.
     */
    fun assignResponsible(userId: UUID) {
        responsibleUserId = userId
        updatedAt = Instant.now()
    }

    /**
     * Check if review is overdue.
     */
    fun isReviewOverdue(): Boolean {
        return nextReviewDate?.isBefore(LocalDate.now()) == true
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ControlImplementation) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
