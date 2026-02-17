package com.liyaqa.trainer.domain.model

import com.liyaqa.scheduling.domain.model.PTLocationType
import com.liyaqa.scheduling.domain.model.TrainerAvailabilityStatus
import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * Represents a structured availability slot for a trainer.
 * Replaces the JSON-based availability on Trainer with discrete, queryable records.
 * Supports recurring weekly patterns and one-off blocks.
 */
@Entity
@Table(name = "trainer_availability")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class TrainerAvailability(
    id: UUID = UUID.randomUUID(),

    @Column(name = "trainer_id", nullable = false)
    val trainerId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    var dayOfWeek: com.liyaqa.scheduling.domain.model.DayOfWeek,

    @Column(name = "start_time", nullable = false)
    var startTime: LocalTime,

    @Column(name = "end_time", nullable = false)
    var endTime: LocalTime,

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false, length = 10)
    var locationType: PTLocationType = PTLocationType.CLUB,

    @Column(name = "location_id")
    var locationId: UUID? = null,

    @Column(name = "is_recurring", nullable = false)
    var isRecurring: Boolean = true,

    @Column(name = "effective_from", nullable = false)
    var effectiveFrom: LocalDate,

    @Column(name = "effective_until")
    var effectiveUntil: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: TrainerAvailabilityStatus = TrainerAvailabilityStatus.AVAILABLE

) : BaseEntity(id) {

    fun isAvailable(): Boolean = status == TrainerAvailabilityStatus.AVAILABLE

    fun isBooked(): Boolean = status == TrainerAvailabilityStatus.BOOKED

    fun isBlocked(): Boolean = status == TrainerAvailabilityStatus.BLOCKED

    fun markBooked() {
        require(status == TrainerAvailabilityStatus.AVAILABLE) { "Only available slots can be booked" }
        status = TrainerAvailabilityStatus.BOOKED
    }

    fun markAvailable() {
        status = TrainerAvailabilityStatus.AVAILABLE
    }

    fun block() {
        status = TrainerAvailabilityStatus.BLOCKED
    }

    fun isEffectiveOn(date: LocalDate): Boolean {
        val afterStart = !date.isBefore(effectiveFrom)
        val beforeEnd = effectiveUntil == null || !date.isAfter(effectiveUntil)
        return afterStart && beforeEnd
    }

    fun coversTimeRange(start: LocalTime, end: LocalTime): Boolean {
        return !startTime.isAfter(start) && !endTime.isBefore(end)
    }
}
