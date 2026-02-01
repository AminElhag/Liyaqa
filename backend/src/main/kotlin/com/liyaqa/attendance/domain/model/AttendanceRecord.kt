package com.liyaqa.attendance.domain.model

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
 * Records a member's visit to a gym location.
 * Tracks check-in and check-out times for attendance monitoring.
 */
@Entity
@Table(name = "attendance_records")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class AttendanceRecord(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "location_id", nullable = false)
    val locationId: UUID,

    @Column(name = "check_in_time", nullable = false)
    val checkInTime: Instant = Instant.now(),

    @Column(name = "check_out_time")
    var checkOutTime: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "check_in_method", nullable = false)
    val checkInMethod: CheckInMethod = CheckInMethod.MANUAL,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: AttendanceStatus = AttendanceStatus.CHECKED_IN,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "created_by")
    val createdBy: UUID? = null

) : BaseEntity(id) {

    /**
     * Checks if the member is currently checked in.
     */
    fun isCheckedIn(): Boolean = status == AttendanceStatus.CHECKED_IN

    /**
     * Performs checkout for this attendance record.
     * @throws IllegalStateException if already checked out
     */
    fun checkOut() {
        require(status == AttendanceStatus.CHECKED_IN) { "Member is not currently checked in" }
        checkOutTime = Instant.now()
        status = AttendanceStatus.CHECKED_OUT
    }

    /**
     * Performs auto-checkout (system-initiated at end of day).
     * @param autoCheckOutTime the time to set as checkout time
     */
    fun autoCheckOut(autoCheckOutTime: Instant) {
        require(status == AttendanceStatus.CHECKED_IN) { "Member is not currently checked in" }
        checkOutTime = autoCheckOutTime
        status = AttendanceStatus.AUTO_CHECKED_OUT
    }

    /**
     * Calculates the duration of the visit in minutes.
     * Returns null if still checked in.
     */
    fun visitDurationMinutes(): Long? {
        val endTime = checkOutTime ?: return null
        return java.time.Duration.between(checkInTime, endTime).toMinutes()
    }
}
