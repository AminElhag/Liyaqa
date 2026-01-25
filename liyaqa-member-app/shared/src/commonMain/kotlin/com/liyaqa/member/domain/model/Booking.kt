package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Member booking for a class session
 */
@Serializable
data class Booking(
    val id: String,
    val sessionId: String,
    val sessionDate: String,
    val sessionStartTime: String,
    val sessionEndTime: String,
    val className: LocalizedText,
    val trainerName: LocalizedText? = null,
    val locationName: LocalizedText? = null,
    val status: BookingStatus,
    val waitlistPosition: Int? = null,
    val checkedInAt: String? = null,
    val createdAt: String
) {
    val isConfirmed: Boolean get() = status == BookingStatus.CONFIRMED

    val isWaitlisted: Boolean get() = status == BookingStatus.WAITLISTED

    val isCancelled: Boolean get() = status == BookingStatus.CANCELLED

    val isCheckedIn: Boolean get() = status == BookingStatus.CHECKED_IN

    val canCancel: Boolean get() = status in listOf(BookingStatus.CONFIRMED, BookingStatus.WAITLISTED)

    /**
     * Time display in "HH:MM - HH:MM" format
     */
    val timeDisplay: String get() = "$sessionStartTime - $sessionEndTime"
}

/**
 * Request to book a session
 */
@Serializable
data class BookingRequest(
    val sessionId: String,
    val notes: String? = null
)
