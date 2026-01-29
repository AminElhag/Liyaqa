package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "member_check_ins")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberCheckIn(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "check_in_time", nullable = false)
    val checkInTime: Instant,

    @Column(name = "check_out_time")
    var checkOutTime: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false)
    val method: CheckInMethod,

    @Column(name = "device_id")
    val deviceId: String? = null,

    @Column(name = "location")
    val location: String? = null,

    @Column(name = "processed_by_user_id")
    val processedByUserId: UUID? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

) : BaseEntity(id) {

    /**
     * Records the check-out time for this check-in session.
     * @throws IllegalStateException if already checked out
     */
    fun checkOut(checkOutTime: Instant = Instant.now()) {
        require(this.checkOutTime == null) { "Member has already checked out" }
        require(checkOutTime.isAfter(checkInTime)) { "Check-out time must be after check-in time" }
        this.checkOutTime = checkOutTime
    }

    /**
     * Returns whether the member has checked out.
     */
    fun isCheckedOut(): Boolean = checkOutTime != null

    /**
     * Returns the duration of the visit in minutes.
     * Returns null if not yet checked out.
     */
    fun getDurationMinutes(): Long? {
        val endTime = checkOutTime ?: return null
        return Duration.between(checkInTime, endTime).toMinutes()
    }

    /**
     * Returns a formatted duration string (e.g., "1h 30m").
     * Returns null if not yet checked out.
     */
    fun getFormattedDuration(): String? {
        val minutes = getDurationMinutes() ?: return null
        val hours = minutes / 60
        val mins = minutes % 60
        return when {
            hours > 0 && mins > 0 -> "${hours}h ${mins}m"
            hours > 0 -> "${hours}h"
            else -> "${mins}m"
        }
    }
}

enum class CheckInMethod {
    QR_CODE,
    MEMBER_ID,
    PHONE,
    RFID_CARD,
    MANUAL,
    BIOMETRIC
}
