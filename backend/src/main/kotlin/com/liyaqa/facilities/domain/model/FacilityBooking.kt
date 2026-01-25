package com.liyaqa.facilities.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "facility_bookings")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class FacilityBooking(
    id: UUID = UUID.randomUUID(),

    @Column(name = "facility_id", nullable = false)
    val facilityId: UUID,

    @Column(name = "slot_id", nullable = false)
    val slotId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: BookingStatus = BookingStatus.CONFIRMED,

    @Column(name = "notes")
    var notes: String? = null,

    @Column(name = "booked_at", nullable = false)
    val bookedAt: Instant = Instant.now(),

    @Column(name = "checked_in_at")
    var checkedInAt: Instant? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "cancellation_reason")
    var cancellationReason: String? = null
) : BaseEntity(id) {

    fun checkIn() {
        require(status == BookingStatus.CONFIRMED) { "Cannot check in - booking is not confirmed" }
        status = BookingStatus.CHECKED_IN
        checkedInAt = Instant.now()
    }

    fun complete() {
        require(status == BookingStatus.CHECKED_IN) { "Cannot complete - booking is not checked in" }
        status = BookingStatus.COMPLETED
    }

    fun cancel(reason: String? = null) {
        require(status == BookingStatus.CONFIRMED) { "Cannot cancel - booking is not in confirmed status" }
        status = BookingStatus.CANCELLED
        cancelledAt = Instant.now()
        cancellationReason = reason
    }

    fun markNoShow() {
        require(status == BookingStatus.CONFIRMED) { "Cannot mark no-show - booking is not confirmed" }
        status = BookingStatus.NO_SHOW
    }

    val isActive: Boolean
        get() = status == BookingStatus.CONFIRMED || status == BookingStatus.CHECKED_IN
}
