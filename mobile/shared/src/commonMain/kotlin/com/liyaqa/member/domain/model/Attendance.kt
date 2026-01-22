package com.liyaqa.member.domain.model

import kotlinx.datetime.Instant

/**
 * Attendance record domain model representing a check-in/check-out event.
 * Aligned with backend AttendanceLiteResponse.
 */
data class AttendanceRecord(
    val id: String,
    val checkInTime: Instant,
    val checkOutTime: Instant?,
    val durationMinutes: Int?,
    val locationName: String?,
    val checkInMethod: CheckInMethod,
    val status: AttendanceStatus
) {
    /**
     * Returns true if this attendance record has been checked out.
     */
    val isCheckedOut: Boolean
        get() = checkOutTime != null

    /**
     * Returns formatted duration string (e.g., "1h 30m").
     */
    fun formatDuration(): String? {
        val minutes = durationMinutes ?: return null
        val hours = minutes / 60
        val mins = minutes % 60
        return when {
            hours > 0 && mins > 0 -> "${hours}h ${mins}m"
            hours > 0 -> "${hours}h"
            else -> "${mins}m"
        }
    }
}

/**
 * Attendance statistics for the member dashboard.
 * Aligned with backend AttendanceStatsDto.
 */
data class AttendanceStats(
    val totalVisits: Int,
    val thisMonthVisits: Int,
    val lastMonthVisits: Int,
    val averageVisitsPerMonth: Float
)
