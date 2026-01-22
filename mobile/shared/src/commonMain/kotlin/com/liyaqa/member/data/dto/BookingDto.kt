package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Booking DTOs matching backend booking-related responses.
 */

/**
 * Booking summary response.
 * Matches backend BookingLiteResponse from /api/me/bookings.
 */
@Serializable
data class BookingLiteDto(
    val id: String,
    val sessionId: String,
    val className: LocalizedTextDto,
    val sessionDate: String,
    val startTime: String,
    val endTime: String,
    val status: String,
    val checkedIn: Boolean,
    val bookedAt: String
)

/**
 * Available session that a member can book.
 * Matches backend AvailableSessionDto from /api/mobile/sessions/available.
 */
@Serializable
data class AvailableSessionDto(
    val id: String,
    val className: LocalizedTextDto,
    val sessionDate: String,
    val startTime: String,
    val endTime: String,
    val capacity: Int,
    val spotsRemaining: Int,
    val trainerId: String? = null,
    val locationId: String? = null,
    val isBooked: Boolean,
    val bookingId: String? = null,
    val bookingStatus: String? = null,
    val isBookable: Boolean,
    val bookingError: String? = null
)

/**
 * Request to book a session.
 */
@Serializable
data class BookSessionRequestDto(
    val sessionId: String
)
