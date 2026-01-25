package com.liyaqa.facilities.domain.model

import jakarta.persistence.*
import java.time.LocalTime
import java.util.*

@Entity
@Table(name = "facility_operating_hours")
class FacilityOperatingHours(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    var facility: Facility? = null,

    @Column(name = "day_of_week", nullable = false)
    val dayOfWeek: Int, // 1 = Monday, 7 = Sunday

    @Column(name = "open_time", nullable = false)
    var openTime: LocalTime,

    @Column(name = "close_time", nullable = false)
    var closeTime: LocalTime,

    @Column(name = "is_closed", nullable = false)
    var isClosed: Boolean = false
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is FacilityOperatingHours) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
