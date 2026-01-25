package com.liyaqa.staff.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ClassSession(
    val id: String,
    val className: LocalizedText,
    val classType: String,
    val trainerName: String,
    val startTime: String,
    val endTime: String,
    val roomName: LocalizedText?,
    val capacity: Int,
    val bookedCount: Int,
    val attendedCount: Int,
    val waitlistCount: Int = 0
) {
    val availableSpots: Int get() = capacity - bookedCount
    val isFull: Boolean get() = bookedCount >= capacity
}

@Serializable
data class SessionBooking(
    val id: String,
    val memberId: String,
    val memberName: String,
    val memberNumber: String,
    val memberPhone: String?,
    val memberEmail: String?,
    val status: BookingStatus,
    val bookedAt: String,
    val checkedInAt: String? = null
) {
    val isCheckedIn: Boolean get() = status == BookingStatus.ATTENDED
}

@Serializable
data class TodaySessions(
    val sessions: List<ClassSession>,
    val totalBookings: Int,
    val totalAttended: Int
)
