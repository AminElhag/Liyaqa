package com.liyaqa.attendance.api

import com.liyaqa.attendance.application.commands.CheckInCommand
import com.liyaqa.attendance.application.commands.CheckOutCommand
import com.liyaqa.attendance.domain.model.AttendanceRecord
import com.liyaqa.attendance.domain.model.AttendanceStatus
import com.liyaqa.attendance.domain.model.CheckInMethod
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

// Request DTOs

data class CheckInRequest(
    @field:NotNull(message = "Location ID is required")
    val locationId: UUID,

    val checkInMethod: CheckInMethod = CheckInMethod.MANUAL,

    val notes: String? = null
) {
    fun toCommand(memberId: UUID, createdBy: UUID? = null) = CheckInCommand(
        memberId = memberId,
        locationId = locationId,
        checkInMethod = checkInMethod,
        notes = notes,
        createdBy = createdBy
    )
}

data class CheckOutRequest(
    val notes: String? = null
) {
    fun toCommand(memberId: UUID) = CheckOutCommand(
        memberId = memberId,
        notes = notes
    )
}

// Response DTOs

data class AttendanceResponse(
    val id: UUID,
    val memberId: UUID,
    val locationId: UUID,
    val checkInTime: Instant,
    val checkOutTime: Instant?,
    val checkInMethod: CheckInMethod,
    val status: AttendanceStatus,
    val notes: String?,
    val visitDurationMinutes: Long?,
    val createdBy: UUID?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(record: AttendanceRecord) = AttendanceResponse(
            id = record.id,
            memberId = record.memberId,
            locationId = record.locationId,
            checkInTime = record.checkInTime,
            checkOutTime = record.checkOutTime,
            checkInMethod = record.checkInMethod,
            status = record.status,
            notes = record.notes,
            visitDurationMinutes = record.visitDurationMinutes(),
            createdBy = record.createdBy,
            createdAt = record.createdAt,
            updatedAt = record.updatedAt
        )
    }
}

data class TodaySummaryResponse(
    val totalCheckIns: Long,
    val currentlyCheckedIn: Long,
    val checkIns: List<AttendanceResponse>
)

data class AttendancePageResponse(
    val content: List<AttendanceResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
