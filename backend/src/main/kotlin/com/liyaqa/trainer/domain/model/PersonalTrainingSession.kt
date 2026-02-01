package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * Personal training session entity representing a 1-on-1 booking
 * between a trainer and a member.
 *
 * Key features:
 * - Direct booking between member and trainer
 * - Status-based lifecycle (REQUESTED → CONFIRMED → COMPLETED)
 * - Supports pricing and duration tracking
 * - Tracks cancellation details
 */
@Entity
@Table(name = "personal_training_sessions")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class PersonalTrainingSession(
    id: UUID = UUID.randomUUID(),

    /**
     * The trainer providing the session.
     */
    @Column(name = "trainer_id", nullable = false)
    var trainerId: UUID,

    /**
     * The member booking the session.
     */
    @Column(name = "member_id", nullable = false)
    var memberId: UUID,

    /**
     * Optional location where the session takes place.
     */
    @Column(name = "location_id")
    var locationId: UUID? = null,

    /**
     * Date of the session.
     */
    @Column(name = "session_date", nullable = false)
    var sessionDate: LocalDate,

    /**
     * Start time of the session.
     */
    @Column(name = "start_time", nullable = false)
    var startTime: LocalTime,

    /**
     * End time of the session.
     */
    @Column(name = "end_time", nullable = false)
    var endTime: LocalTime,

    /**
     * Duration of the session in minutes.
     */
    @Column(name = "duration_minutes", nullable = false)
    var durationMinutes: Int = 60,

    /**
     * Current status of the session.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: PTSessionStatus = PTSessionStatus.REQUESTED,

    /**
     * Price for this session (may differ from trainer's default rate).
     */
    @Column(name = "price", precision = 10, scale = 2)
    var price: BigDecimal? = null,

    /**
     * Member's notes/request for the session.
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    /**
     * User ID of who cancelled the session (if cancelled).
     */
    @Column(name = "cancelled_by")
    var cancelledBy: UUID? = null,

    /**
     * Reason for cancellation (if cancelled).
     */
    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    var cancellationReason: String? = null,

    /**
     * Trainer's notes after session completion.
     */
    @Column(name = "trainer_notes", columnDefinition = "TEXT")
    var trainerNotes: String? = null

) : BaseEntity(id) {

    // ========== Status Transitions ==========

    /**
     * Trainer confirms the session request.
     */
    fun confirm() {
        require(status == PTSessionStatus.REQUESTED) {
            "Can only confirm a session that is in REQUESTED status"
        }
        status = PTSessionStatus.CONFIRMED
    }

    /**
     * Mark session as started.
     */
    fun start() {
        require(status == PTSessionStatus.CONFIRMED) {
            "Can only start a session that is CONFIRMED"
        }
        status = PTSessionStatus.IN_PROGRESS
    }

    /**
     * Mark session as completed.
     */
    fun complete(trainerNotes: String? = null) {
        require(status == PTSessionStatus.CONFIRMED || status == PTSessionStatus.IN_PROGRESS) {
            "Can only complete a session that is CONFIRMED or IN_PROGRESS"
        }
        status = PTSessionStatus.COMPLETED
        this.trainerNotes = trainerNotes
    }

    /**
     * Cancel the session.
     *
     * @param cancelledByUserId The user who cancelled (trainer or member)
     * @param reason The reason for cancellation
     */
    fun cancel(cancelledByUserId: UUID, reason: String? = null) {
        require(status == PTSessionStatus.REQUESTED || status == PTSessionStatus.CONFIRMED) {
            "Can only cancel a session that is REQUESTED or CONFIRMED"
        }
        status = PTSessionStatus.CANCELLED
        cancelledBy = cancelledByUserId
        cancellationReason = reason
    }

    /**
     * Mark member as no-show.
     */
    fun markNoShow() {
        require(status == PTSessionStatus.CONFIRMED) {
            "Can only mark no-show for a CONFIRMED session"
        }
        status = PTSessionStatus.NO_SHOW
    }

    // ========== Update Methods ==========

    /**
     * Reschedule the session to a new date/time.
     * Only allowed for REQUESTED or CONFIRMED sessions.
     */
    fun reschedule(newDate: LocalDate, newStartTime: LocalTime, newEndTime: LocalTime) {
        require(status == PTSessionStatus.REQUESTED || status == PTSessionStatus.CONFIRMED) {
            "Can only reschedule a session that is REQUESTED or CONFIRMED"
        }
        sessionDate = newDate
        startTime = newStartTime
        endTime = newEndTime
    }

    /**
     * Update session notes.
     */
    fun updateNotes(notes: String?) {
        this.notes = notes
    }

    /**
     * Update session price.
     */
    fun updatePrice(price: BigDecimal?) {
        this.price = price
    }

    // ========== Query Helpers ==========

    /**
     * Check if the session can be modified.
     */
    fun canModify(): Boolean = status in listOf(PTSessionStatus.REQUESTED, PTSessionStatus.CONFIRMED)

    /**
     * Check if the session is in a final state.
     */
    fun isFinalState(): Boolean = status in listOf(
        PTSessionStatus.COMPLETED,
        PTSessionStatus.CANCELLED,
        PTSessionStatus.NO_SHOW
    )

    /**
     * Check if the session is pending trainer confirmation.
     */
    fun isPendingConfirmation(): Boolean = status == PTSessionStatus.REQUESTED

    /**
     * Check if the session is upcoming (confirmed but not yet completed).
     */
    fun isUpcoming(): Boolean = status == PTSessionStatus.CONFIRMED

    /**
     * Check if the member cancelled.
     */
    fun wasCancelledByMember(): Boolean = status == PTSessionStatus.CANCELLED && cancelledBy == memberId

    /**
     * Check if the trainer cancelled.
     */
    fun wasCancelledByTrainer(): Boolean = status == PTSessionStatus.CANCELLED && cancelledBy == trainerId

    companion object {
        /**
         * Create a new personal training session request.
         */
        fun create(
            trainerId: UUID,
            memberId: UUID,
            sessionDate: LocalDate,
            startTime: LocalTime,
            endTime: LocalTime,
            durationMinutes: Int = 60,
            price: BigDecimal? = null,
            locationId: UUID? = null,
            notes: String? = null
        ): PersonalTrainingSession {
            return PersonalTrainingSession(
                trainerId = trainerId,
                memberId = memberId,
                sessionDate = sessionDate,
                startTime = startTime,
                endTime = endTime,
                durationMinutes = durationMinutes,
                price = price,
                locationId = locationId,
                notes = notes,
                status = PTSessionStatus.REQUESTED
            )
        }
    }
}
