package com.liyaqa.facilities.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

@Entity
@Table(name = "facility_slots")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class FacilitySlot(
    id: UUID = UUID.randomUUID(),

    @Column(name = "facility_id", nullable = false)
    val facilityId: UUID,

    @Column(name = "slot_date", nullable = false)
    val slotDate: LocalDate,

    @Column(name = "start_time", nullable = false)
    val startTime: LocalTime,

    @Column(name = "end_time", nullable = false)
    val endTime: LocalTime,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: SlotStatus = SlotStatus.AVAILABLE
) : BaseEntity(id) {

    fun book() {
        require(status == SlotStatus.AVAILABLE) { "Slot is not available for booking" }
        status = SlotStatus.BOOKED
    }

    fun release() {
        status = SlotStatus.AVAILABLE
    }

    fun block() {
        status = SlotStatus.BLOCKED
    }

    fun setMaintenance() {
        status = SlotStatus.MAINTENANCE
    }

    val isAvailable: Boolean
        get() = status == SlotStatus.AVAILABLE
}
