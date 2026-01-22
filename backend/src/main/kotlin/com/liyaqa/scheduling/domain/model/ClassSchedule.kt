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
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * Represents a recurring schedule for a gym class.
 * Used to automatically generate ClassSessions for future dates.
 */
@Entity
@Table(name = "class_schedules")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ClassSchedule(
    id: UUID = UUID.randomUUID(),

    @Column(name = "gym_class_id", nullable = false)
    val gymClassId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    var dayOfWeek: DayOfWeek,

    @Column(name = "start_time", nullable = false)
    var startTime: LocalTime,

    @Column(name = "end_time", nullable = false)
    var endTime: LocalTime,

    @Column(name = "trainer_id")
    var trainerId: UUID? = null,

    @Column(name = "effective_from", nullable = false)
    var effectiveFrom: LocalDate = LocalDate.now(),

    @Column(name = "effective_until")
    var effectiveUntil: LocalDate? = null,

    @Column(name = "override_capacity")
    var overrideCapacity: Int? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : BaseEntity(id) {

    /**
     * Checks if this schedule is active for the given date.
     */
    fun isActiveOn(date: LocalDate): Boolean {
        if (!isActive) return false
        if (date.isBefore(effectiveFrom)) return false
        if (effectiveUntil != null && date.isAfter(effectiveUntil)) return false
        return date.dayOfWeek.value == dayOfWeekValue()
    }

    /**
     * Converts the DayOfWeek enum to java.time.DayOfWeek value (1-7, Monday-Sunday).
     */
    private fun dayOfWeekValue(): Int {
        return when (dayOfWeek) {
            DayOfWeek.MONDAY -> 1
            DayOfWeek.TUESDAY -> 2
            DayOfWeek.WEDNESDAY -> 3
            DayOfWeek.THURSDAY -> 4
            DayOfWeek.FRIDAY -> 5
            DayOfWeek.SATURDAY -> 6
            DayOfWeek.SUNDAY -> 7
        }
    }

    /**
     * Converts to java.time.DayOfWeek for date calculations.
     */
    fun toJavaDayOfWeek(): java.time.DayOfWeek {
        return java.time.DayOfWeek.of(dayOfWeekValue())
    }

    /**
     * Deactivates this schedule. No new sessions will be generated from it.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Reactivates a deactivated schedule.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Sets an end date for this recurring schedule.
     */
    fun endOn(date: LocalDate) {
        require(!date.isBefore(effectiveFrom)) { "End date cannot be before start date" }
        effectiveUntil = date
    }

    /**
     * Assigns a trainer specifically for this schedule (overrides class default).
     */
    fun assignTrainer(trainerId: UUID) {
        this.trainerId = trainerId
    }

    /**
     * Removes the trainer assignment, falling back to class default.
     */
    fun removeTrainer() {
        this.trainerId = null
    }

    /**
     * Gets the duration of this scheduled class in minutes.
     */
    fun durationMinutes(): Int {
        return java.time.Duration.between(startTime, endTime).toMinutes().toInt()
    }
}
