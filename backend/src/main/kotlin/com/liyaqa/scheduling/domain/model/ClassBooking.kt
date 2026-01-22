package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.UUID

/**
 * Represents a member's booking for a class session.
 * Tracks the booking status from confirmation through attendance.
 */
@Entity
@Table(name = "class_bookings")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ClassBooking(
    id: UUID = UUID.randomUUID(),

    @Column(name = "session_id", nullable = false)
    val sessionId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "subscription_id")
    val subscriptionId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: BookingStatus = BookingStatus.CONFIRMED,

    @Column(name = "booked_at", nullable = false)
    val bookedAt: Instant = Instant.now(),

    @Column(name = "checked_in_at")
    var checkedInAt: Instant? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "cancellation_reason")
    var cancellationReason: String? = null,

    @Column(name = "waitlist_position")
    var waitlistPosition: Int? = null,

    @Column(name = "promoted_from_waitlist_at")
    var promotedFromWaitlistAt: Instant? = null,

    @Column(name = "class_deducted", nullable = false)
    var classDeducted: Boolean = false,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "booked_by")
    val bookedBy: UUID? = null

) : BaseEntity(id) {

    /**
     * Confirms the booking (moves from waitlist or initial state).
     */
    fun confirm() {
        require(status == BookingStatus.WAITLISTED) { "Only waitlisted bookings can be confirmed" }
        status = BookingStatus.CONFIRMED
        promotedFromWaitlistAt = Instant.now()
        waitlistPosition = null
    }

    /**
     * Checks in the member for the class.
     */
    fun checkIn() {
        require(status == BookingStatus.CONFIRMED) { "Only confirmed bookings can be checked in" }
        status = BookingStatus.CHECKED_IN
        checkedInAt = Instant.now()
    }

    /**
     * Marks the member as a no-show (didn't attend).
     */
    fun markNoShow() {
        require(status == BookingStatus.CONFIRMED) { "Only confirmed bookings can be marked as no-show" }
        status = BookingStatus.NO_SHOW
    }

    /**
     * Cancels the booking.
     */
    fun cancel(reason: String? = null) {
        require(status == BookingStatus.CONFIRMED || status == BookingStatus.WAITLISTED) {
            "Only confirmed or waitlisted bookings can be cancelled"
        }
        status = BookingStatus.CANCELLED
        cancelledAt = Instant.now()
        cancellationReason = reason
    }

    /**
     * Checks if the booking is active (not cancelled or no-show).
     */
    fun isActive(): Boolean {
        return status == BookingStatus.CONFIRMED || status == BookingStatus.WAITLISTED || status == BookingStatus.CHECKED_IN
    }

    /**
     * Checks if the member has attended (checked in).
     */
    fun hasAttended(): Boolean = status == BookingStatus.CHECKED_IN

    /**
     * Checks if the booking is on the waitlist.
     */
    fun isWaitlisted(): Boolean = status == BookingStatus.WAITLISTED

    /**
     * Checks if the booking is confirmed (not waitlisted).
     */
    fun isConfirmed(): Boolean = status == BookingStatus.CONFIRMED

    /**
     * Checks if the booking was cancelled.
     */
    fun isCancelled(): Boolean = status == BookingStatus.CANCELLED

    /**
     * Sets the waitlist position for this booking.
     */
    fun setWaitlistPosition(position: Int) {
        require(status == BookingStatus.WAITLISTED) { "Only waitlisted bookings can have a position" }
        require(position > 0) { "Waitlist position must be positive" }
        waitlistPosition = position
    }

    /**
     * Marks that a class has been deducted from the member's subscription.
     */
    fun markClassDeducted() {
        classDeducted = true
    }

    companion object {
        /**
         * Creates a confirmed booking for a member.
         */
        fun createConfirmed(
            sessionId: UUID,
            memberId: UUID,
            subscriptionId: UUID? = null,
            bookedBy: UUID? = null
        ): ClassBooking {
            return ClassBooking(
                sessionId = sessionId,
                memberId = memberId,
                subscriptionId = subscriptionId,
                status = BookingStatus.CONFIRMED,
                bookedBy = bookedBy
            )
        }

        /**
         * Creates a waitlisted booking for a member.
         */
        fun createWaitlisted(
            sessionId: UUID,
            memberId: UUID,
            position: Int,
            subscriptionId: UUID? = null,
            bookedBy: UUID? = null
        ): ClassBooking {
            return ClassBooking(
                sessionId = sessionId,
                memberId = memberId,
                subscriptionId = subscriptionId,
                status = BookingStatus.WAITLISTED,
                waitlistPosition = position,
                bookedBy = bookedBy
            )
        }
    }
}
