package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Tracks a cancellation request through the process, including notice period,
 * early termination fees, and retention offers.
 */
@Entity
@Table(name = "cancellation_requests")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class CancellationRequest(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "subscription_id", nullable = false)
    val subscriptionId: UUID,

    @Column(name = "contract_id")
    val contractId: UUID? = null,

    // ==========================================
    // REQUEST DETAILS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_category", nullable = false)
    val reasonCategory: CancellationReasonCategory,

    @Column(name = "reason_detail", columnDefinition = "TEXT")
    val reasonDetail: String? = null,

    // ==========================================
    // NOTICE PERIOD
    // ==========================================

    @Column(name = "requested_at", nullable = false)
    val requestedAt: Instant = Instant.now(),

    @Column(name = "notice_period_days", nullable = false)
    val noticePeriodDays: Int,

    @Column(name = "notice_period_end_date", nullable = false)
    val noticePeriodEndDate: LocalDate,

    @Column(name = "effective_date", nullable = false)
    val effectiveDate: LocalDate,

    // ==========================================
    // EARLY TERMINATION
    // ==========================================

    @Column(name = "is_within_commitment", nullable = false)
    val isWithinCommitment: Boolean = false,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "early_termination_fee")),
        AttributeOverride(name = "currency", column = Column(name = "early_termination_fee_currency"))
    )
    var earlyTerminationFee: Money? = null,

    @Column(name = "fee_waived", nullable = false)
    var feeWaived: Boolean = false,

    @Column(name = "fee_waived_by")
    var feeWaivedBy: UUID? = null,

    @Column(name = "fee_waived_reason", columnDefinition = "TEXT")
    var feeWaivedReason: String? = null,

    // ==========================================
    // COOLING-OFF
    // ==========================================

    @Column(name = "is_within_cooling_off", nullable = false)
    val isWithinCoolingOff: Boolean = false,

    // ==========================================
    // STATUS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: CancellationRequestStatus = CancellationRequestStatus.PENDING_NOTICE,

    // ==========================================
    // RETENTION
    // ==========================================

    @Column(name = "retention_offer_accepted_id")
    var retentionOfferAcceptedId: UUID? = null,

    @Column(name = "exit_survey_id")
    var exitSurveyId: UUID? = null,

    // ==========================================
    // PROCESSING
    // ==========================================

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "saved_at")
    var savedAt: Instant? = null,

    @Column(name = "withdrawn_at")
    var withdrawnAt: Instant? = null,

    @Column(name = "withdrawn_reason", columnDefinition = "TEXT")
    var withdrawnReason: String? = null,

    // ==========================================
    // STAFF HANDLING
    // ==========================================

    @Column(name = "assigned_to_user_id")
    var assignedToUserId: UUID? = null,

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    var staffNotes: String? = null

) : BaseEntity(id) {

    /**
     * Check if request is pending.
     */
    fun isPending(): Boolean = status == CancellationRequestStatus.PENDING_NOTICE

    /**
     * Check if in notice period.
     */
    fun isInNoticePeriod(): Boolean = status == CancellationRequestStatus.IN_NOTICE

    /**
     * Check if member was saved.
     */
    fun isSaved(): Boolean = status == CancellationRequestStatus.SAVED

    /**
     * Check if cancellation completed.
     */
    fun isCompleted(): Boolean = status == CancellationRequestStatus.COMPLETED

    /**
     * Check if request was withdrawn.
     */
    fun isWithdrawn(): Boolean = status == CancellationRequestStatus.WITHDRAWN

    /**
     * Calculate days remaining in notice period.
     */
    fun daysRemainingInNoticePeriod(): Long {
        val today = LocalDate.now()
        return if (today.isAfter(noticePeriodEndDate)) 0
        else ChronoUnit.DAYS.between(today, noticePeriodEndDate)
    }

    /**
     * Check if notice period has ended.
     */
    fun hasNoticePeriodEnded(): Boolean = LocalDate.now().isAfter(noticePeriodEndDate)

    /**
     * Start the notice period.
     */
    fun startNoticePeriod() {
        require(isPending()) { "Can only start notice period from pending status" }
        status = CancellationRequestStatus.IN_NOTICE
    }

    /**
     * Mark member as saved (accepted retention offer).
     */
    fun markSaved(retentionOfferId: UUID) {
        require(isPending() || isInNoticePeriod()) { "Can only save from pending or in-notice status" }
        status = CancellationRequestStatus.SAVED
        retentionOfferAcceptedId = retentionOfferId
        savedAt = Instant.now()
    }

    /**
     * Complete the cancellation.
     */
    fun complete() {
        require(isInNoticePeriod()) { "Can only complete from in-notice status" }
        status = CancellationRequestStatus.COMPLETED
        completedAt = Instant.now()
    }

    /**
     * Withdraw the cancellation request.
     */
    fun withdraw(reason: String? = null) {
        require(isPending() || isInNoticePeriod()) { "Can only withdraw from pending or in-notice status" }
        status = CancellationRequestStatus.WITHDRAWN
        withdrawnAt = Instant.now()
        withdrawnReason = reason
    }

    /**
     * Waive the early termination fee.
     */
    fun waiveFee(waivedBy: UUID, reason: String) {
        require(earlyTerminationFee != null && !earlyTerminationFee!!.isZero()) {
            "No fee to waive"
        }
        feeWaived = true
        feeWaivedBy = waivedBy
        feeWaivedReason = reason
    }

    /**
     * Get the effective fee (0 if waived, or if within cooling-off).
     */
    fun getEffectiveFee(): Money {
        if (isWithinCoolingOff) return Money.ZERO
        if (feeWaived) return Money.ZERO
        return earlyTerminationFee ?: Money.ZERO
    }

    /**
     * Link exit survey.
     */
    fun linkExitSurvey(surveyId: UUID) {
        this.exitSurveyId = surveyId
    }

    /**
     * Assign to staff member.
     */
    fun assignTo(staffUserId: UUID) {
        this.assignedToUserId = staffUserId
    }

    /**
     * Add staff notes.
     */
    fun addStaffNote(note: String) {
        this.staffNotes = if (staffNotes.isNullOrBlank()) note
        else "$staffNotes\n$note"
    }

    companion object {
        fun create(
            memberId: UUID,
            subscriptionId: UUID,
            reasonCategory: CancellationReasonCategory,
            noticePeriodDays: Int,
            isWithinCommitment: Boolean = false,
            earlyTerminationFee: Money? = null,
            isWithinCoolingOff: Boolean = false,
            reasonDetail: String? = null,
            contractId: UUID? = null
        ): CancellationRequest {
            val today = LocalDate.now()
            val noticePeriodEndDate = today.plusDays(noticePeriodDays.toLong())
            val effectiveDate = noticePeriodEndDate.plusDays(1)

            return CancellationRequest(
                memberId = memberId,
                subscriptionId = subscriptionId,
                contractId = contractId,
                reasonCategory = reasonCategory,
                reasonDetail = reasonDetail,
                noticePeriodDays = noticePeriodDays,
                noticePeriodEndDate = noticePeriodEndDate,
                effectiveDate = effectiveDate,
                isWithinCommitment = isWithinCommitment,
                earlyTerminationFee = earlyTerminationFee,
                isWithinCoolingOff = isWithinCoolingOff
            )
        }
    }
}
