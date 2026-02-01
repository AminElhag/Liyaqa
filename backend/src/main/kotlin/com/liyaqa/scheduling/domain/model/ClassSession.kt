package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
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
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.util.UUID

/**
 * Represents a specific occurrence of a gym class at a particular date and time.
 * Members book spots in sessions, not in class definitions.
 */
@Entity
@Table(name = "class_sessions")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ClassSession(
    id: UUID = UUID.randomUUID(),

    @Column(name = "gym_class_id", nullable = false)
    val gymClassId: UUID,

    @Column(name = "schedule_id")
    val scheduleId: UUID? = null,

    @Column(name = "location_id", nullable = false)
    var locationId: UUID,

    @Column(name = "trainer_id")
    var trainerId: UUID? = null,

    @Column(name = "session_date", nullable = false)
    val sessionDate: LocalDate,

    @Column(name = "start_time", nullable = false)
    var startTime: LocalTime,

    @Column(name = "end_time", nullable = false)
    var endTime: LocalTime,

    @Column(name = "max_capacity", nullable = false)
    var maxCapacity: Int,

    @Column(name = "current_bookings", nullable = false)
    var currentBookings: Int = 0,

    @Column(name = "waitlist_count", nullable = false)
    var waitlistCount: Int = 0,

    @Column(name = "checked_in_count", nullable = false)
    var checkedInCount: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: SessionStatus = SessionStatus.SCHEDULED,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "notes_en")),
        AttributeOverride(name = "ar", column = Column(name = "notes_ar"))
    )
    var notes: LocalizedText? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "cancellation_reason")
    var cancellationReason: String? = null

) : BaseEntity(id) {

    /**
     * Returns the start datetime of this session.
     */
    fun startDateTime(): LocalDateTime = LocalDateTime.of(sessionDate, startTime)

    /**
     * Returns the end datetime of this session.
     */
    fun endDateTime(): LocalDateTime = LocalDateTime.of(sessionDate, endTime)

    /**
     * Checks if this session has available spots.
     */
    fun hasAvailableSpots(): Boolean = currentBookings < maxCapacity

    /**
     * Returns the number of available spots.
     */
    fun availableSpots(): Int = maxCapacity - currentBookings

    /**
     * Checks if the session can accept bookings.
     */
    fun canAcceptBookings(): Boolean {
        return status == SessionStatus.SCHEDULED && hasAvailableSpots()
    }

    /**
     * Checks if the waitlist can accept new entries.
     */
    fun canJoinWaitlist(maxWaitlistSize: Int): Boolean {
        return status == SessionStatus.SCHEDULED && !hasAvailableSpots() && waitlistCount < maxWaitlistSize
    }

    /**
     * Checks if the session is in the past.
     */
    fun isPast(zoneId: ZoneId = ZoneId.systemDefault()): Boolean {
        val sessionEnd = endDateTime().atZone(zoneId).toInstant()
        return Instant.now().isAfter(sessionEnd)
    }

    /**
     * Checks if the session is currently in progress.
     */
    fun isInProgress(zoneId: ZoneId = ZoneId.systemDefault()): Boolean {
        val now = LocalDateTime.now(zoneId)
        return now.isAfter(startDateTime()) && now.isBefore(endDateTime())
    }

    /**
     * Increments the booking count when a member books.
     */
    fun incrementBookings() {
        require(status == SessionStatus.SCHEDULED) { "Cannot book cancelled or completed session" }
        require(currentBookings < maxCapacity) { "Session is fully booked" }
        currentBookings++
    }

    /**
     * Decrements the booking count when a booking is cancelled.
     */
    fun decrementBookings() {
        require(currentBookings > 0) { "No bookings to decrement" }
        currentBookings--
    }

    /**
     * Increments the waitlist count.
     */
    fun incrementWaitlist() {
        waitlistCount++
    }

    /**
     * Decrements the waitlist count.
     */
    fun decrementWaitlist() {
        require(waitlistCount > 0) { "No waitlist entries to decrement" }
        waitlistCount--
    }

    /**
     * Records a member check-in for attendance.
     */
    fun recordCheckIn() {
        checkedInCount++
    }

    /**
     * Starts the session (trainer begins the class).
     */
    fun start() {
        require(status == SessionStatus.SCHEDULED) { "Only scheduled sessions can be started" }
        status = SessionStatus.IN_PROGRESS
    }

    /**
     * Completes the session (class is finished).
     */
    fun complete() {
        require(status == SessionStatus.IN_PROGRESS || status == SessionStatus.SCHEDULED) {
            "Only scheduled or in-progress sessions can be completed"
        }
        status = SessionStatus.COMPLETED
    }

    /**
     * Cancels the session.
     */
    fun cancel(reason: String? = null) {
        require(status == SessionStatus.SCHEDULED) { "Only scheduled sessions can be cancelled" }
        status = SessionStatus.CANCELLED
        cancelledAt = Instant.now()
        cancellationReason = reason
    }

    /**
     * Assigns a trainer to this specific session.
     */
    fun assignTrainer(trainerId: UUID) {
        this.trainerId = trainerId
    }

    /**
     * Removes the trainer assignment.
     */
    fun removeTrainer() {
        this.trainerId = null
    }

    /**
     * Duration of the session in minutes.
     */
    fun durationMinutes(): Int {
        return java.time.Duration.between(startTime, endTime).toMinutes().toInt()
    }

    companion object {
        /**
         * Creates a session from a schedule for a specific date.
         */
        fun fromSchedule(
            gymClass: GymClass,
            schedule: ClassSchedule,
            date: LocalDate
        ): ClassSession {
            return ClassSession(
                gymClassId = gymClass.id,
                scheduleId = schedule.id,
                locationId = gymClass.locationId,
                trainerId = schedule.trainerId ?: gymClass.defaultTrainerId,
                sessionDate = date,
                startTime = schedule.startTime,
                endTime = schedule.endTime,
                maxCapacity = schedule.overrideCapacity ?: gymClass.maxCapacity
            )
        }
    }
}
