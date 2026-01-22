package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.AttendanceLiteDto
import com.liyaqa.member.domain.model.AttendanceRecord
import com.liyaqa.member.domain.model.AttendanceStatus
import com.liyaqa.member.domain.model.CheckInMethod

/**
 * Mappers for attendance-related DTOs to domain models.
 */

/**
 * Maps attendance lite DTO to domain AttendanceRecord.
 */
fun AttendanceLiteDto.toDomain(): AttendanceRecord = AttendanceRecord(
    id = id,
    checkInTime = checkInTime.toInstant(),
    checkOutTime = checkOutTime.toInstantOrNull(),
    durationMinutes = durationMinutes?.toInt(),
    locationName = null, // Not in lite response, only locationId
    checkInMethod = CheckInMethod.valueOf(checkInMethod),
    status = AttendanceStatus.valueOf(status)
)
