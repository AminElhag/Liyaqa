package com.liyaqa.member.domain.model

import com.liyaqa.member.core.localization.LocalizedText
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime

/**
 * Booking domain model representing a member's class booking.
 * Aligned with backend BookingLiteResponse.
 */
data class Booking(
    val id: String,
    val sessionId: String,
    val className: LocalizedText,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val location: String?,
    val trainer: String?,
    val status: BookingStatus,
    val checkedIn: Boolean,
    val bookedAt: Instant
) {
    /**
     * Returns true if this booking can be cancelled.
     */
    val isCancellable: Boolean
        get() = status == BookingStatus.CONFIRMED || status == BookingStatus.WAITLISTED
}

/**
 * Available session that a member can book.
 * Aligned with backend AvailableSessionDto.
 */
data class AvailableSession(
    val id: String,
    val className: LocalizedText,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val duration: Int,
    val capacity: Int,
    val spotsRemaining: Int,
    val trainerId: String?,
    val trainerName: String?,
    val locationId: String?,
    val locationName: String?,
    val isBooked: Boolean,
    val bookingId: String?,
    val isBookable: Boolean,
    val bookingError: String?
) {
    /**
     * Returns true if this session is fully booked.
     */
    val isFull: Boolean
        get() = spotsRemaining <= 0

    /**
     * Returns the percentage of capacity filled (0-100).
     */
    val capacityFilledPercentage: Float
        get() {
            if (capacity == 0) return 0f
            val booked = capacity - spotsRemaining
            return (booked.toFloat() / capacity.toFloat()) * 100f
        }
}
