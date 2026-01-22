package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Attendance DTOs matching backend attendance-related responses.
 */

/**
 * Attendance record response.
 * Matches backend AttendanceLiteResponse from /api/me/attendance.
 */
@Serializable
data class AttendanceLiteDto(
    val id: String,
    val memberId: String,
    val locationId: String,
    val checkInTime: String, // ISO-8601 Instant
    val checkOutTime: String? = null, // ISO-8601 Instant
    val durationMinutes: Long? = null,
    val status: String, // AttendanceStatus enum as string
    val checkInMethod: String // CheckInMethod enum as string
)
