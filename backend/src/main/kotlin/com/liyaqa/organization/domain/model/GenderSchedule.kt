package com.liyaqa.organization.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.UUID

/**
 * GenderSchedule entity - defines time-based gender switching for locations.
 * Used when a location's gender policy is set to TIME_BASED.
 *
 * For example, a gym might be male-only on Mon/Wed/Fri mornings and female-only on Tue/Thu mornings.
 */
@Entity
@Table(name = "gender_schedules")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class GenderSchedule(
    id: UUID = UUID.randomUUID(),

    @Column(name = "location_id", nullable = false)
    val locationId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    var dayOfWeek: DayOfWeek,

    @Column(name = "start_time", nullable = false)
    var startTime: LocalTime,

    @Column(name = "end_time", nullable = false)
    var endTime: LocalTime,

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 10)
    var gender: AccessGender

) : BaseEntity(id) {

    /**
     * Validates that end time is after start time.
     */
    fun isValid(): Boolean = endTime.isAfter(startTime)

    /**
     * Checks if the given time falls within this schedule.
     */
    fun isWithinSchedule(day: DayOfWeek, time: LocalTime): Boolean {
        return dayOfWeek == day &&
               !time.isBefore(startTime) &&
               !time.isAfter(endTime)
    }

    /**
     * Checks if this schedule overlaps with another schedule for the same day.
     */
    fun overlapsWith(other: GenderSchedule): Boolean {
        if (dayOfWeek != other.dayOfWeek) return false
        return !endTime.isBefore(other.startTime) && !startTime.isAfter(other.endTime)
    }
}
