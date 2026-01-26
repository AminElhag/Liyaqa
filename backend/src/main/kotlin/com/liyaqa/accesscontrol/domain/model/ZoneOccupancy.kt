package com.liyaqa.accesscontrol.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "zone_occupancy")
class ZoneOccupancy(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "zone_id", nullable = false, unique = true)
    val zoneId: UUID,

    @Column(name = "current_count")
    var currentCount: Int = 0,

    @Column(name = "peak_count_today")
    var peakCountToday: Int = 0,

    @Column(name = "peak_time_today")
    var peakTimeToday: Instant? = null,

    @Column(name = "last_entry_at")
    var lastEntryAt: Instant? = null,

    @Column(name = "last_exit_at")
    var lastExitAt: Instant? = null,

    @Column(name = "updated_at")
    var updatedAt: Instant = Instant.now()
) {
    fun incrementCount() {
        currentCount++
        lastEntryAt = Instant.now()
        updatedAt = Instant.now()

        if (currentCount > peakCountToday) {
            peakCountToday = currentCount
            peakTimeToday = Instant.now()
        }
    }

    fun decrementCount() {
        if (currentCount > 0) {
            currentCount--
        }
        lastExitAt = Instant.now()
        updatedAt = Instant.now()
    }

    fun resetDaily() {
        peakCountToday = currentCount
        peakTimeToday = if (currentCount > 0) Instant.now() else null
    }
}

@Entity
@Table(name = "member_current_locations")
class MemberCurrentLocation(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "member_id", nullable = false, unique = true)
    val memberId: UUID,

    @Column(name = "zone_id", nullable = false)
    var zoneId: UUID,

    @Column(name = "entered_at")
    var enteredAt: Instant = Instant.now(),

    @Column(name = "updated_at")
    var updatedAt: Instant = Instant.now()
) {
    fun updateZone(newZoneId: UUID) {
        zoneId = newZoneId
        enteredAt = Instant.now()
        updatedAt = Instant.now()
    }
}
