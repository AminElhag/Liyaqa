package com.liyaqa.marketing.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Tracks a member's enrollment in a marketing campaign.
 */
@Entity
@Table(name = "marketing_campaign_enrollments")
class CampaignEnrollment(
    @Column(name = "campaign_id", nullable = false)
    val campaignId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: EnrollmentStatus = EnrollmentStatus.ACTIVE,

    @Column(name = "current_step", nullable = false)
    var currentStep: Int = 0,

    @Column(name = "enrolled_at", nullable = false)
    val enrolledAt: Instant = Instant.now(),

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "next_step_due_at")
    var nextStepDueAt: Instant? = null,

    @Column(name = "trigger_reference_id")
    var triggerReferenceId: UUID? = null,

    @Column(name = "trigger_reference_type", length = 50)
    var triggerReferenceType: String? = null,

    @Column(name = "ab_group")
    var abGroup: Char? = null,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Advance to next step.
     */
    fun advanceToStep(stepNumber: Int, nextDueAt: Instant?) {
        this.currentStep = stepNumber
        this.nextStepDueAt = nextDueAt
    }

    /**
     * Mark enrollment as completed.
     */
    fun complete() {
        this.status = EnrollmentStatus.COMPLETED
        this.completedAt = Instant.now()
        this.nextStepDueAt = null
    }

    /**
     * Cancel the enrollment.
     */
    fun cancel() {
        this.status = EnrollmentStatus.CANCELLED
        this.cancelledAt = Instant.now()
        this.nextStepDueAt = null
    }

    /**
     * Mark as unsubscribed.
     */
    fun unsubscribe() {
        this.status = EnrollmentStatus.UNSUBSCRIBED
        this.cancelledAt = Instant.now()
        this.nextStepDueAt = null
    }

    /**
     * Assign A/B test group.
     */
    fun assignAbGroup(group: Char) {
        require(group in listOf('A', 'B')) { "Group must be 'A' or 'B'" }
        this.abGroup = group
    }

    /**
     * Set trigger reference.
     */
    fun setTriggerReference(referenceId: UUID, referenceType: String) {
        this.triggerReferenceId = referenceId
        this.triggerReferenceType = referenceType
    }

    /**
     * Check if enrollment is active.
     */
    fun isActive(): Boolean = status == EnrollmentStatus.ACTIVE

    /**
     * Check if next step is due.
     */
    fun isNextStepDue(): Boolean {
        return isActive() && nextStepDueAt != null && nextStepDueAt!!.isBefore(Instant.now())
    }

    companion object {
        fun create(
            campaignId: UUID,
            memberId: UUID,
            triggerReferenceId: UUID? = null,
            triggerReferenceType: String? = null
        ): CampaignEnrollment {
            return CampaignEnrollment(
                campaignId = campaignId,
                memberId = memberId,
                triggerReferenceId = triggerReferenceId,
                triggerReferenceType = triggerReferenceType
            )
        }
    }
}
