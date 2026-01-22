package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.AvailableSessionDto
import com.liyaqa.member.data.dto.BookingLiteDto
import com.liyaqa.member.domain.model.AvailableSession
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingStatus

/**
 * Mappers for booking-related DTOs to domain models.
 */

/**
 * Maps booking lite DTO to domain Booking.
 */
fun BookingLiteDto.toDomain(): Booking = Booking(
    id = id,
    sessionId = sessionId,
    className = className.toDomain(),
    sessionDate = sessionDate.toLocalDate(),
    startTime = startTime.toLocalTime(),
    endTime = endTime.toLocalTime(),
    location = null, // Not in lite response
    trainer = null, // Not in lite response
    status = BookingStatus.valueOf(status),
    checkedIn = checkedIn,
    bookedAt = bookedAt.toInstant()
)

/**
 * Maps available session DTO to domain AvailableSession.
 */
fun AvailableSessionDto.toDomain(): AvailableSession {
    val start = startTime.toLocalTime()
    val end = endTime.toLocalTime()
    val durationMinutes = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)

    return AvailableSession(
        id = id,
        className = className.toDomain(),
        sessionDate = sessionDate.toLocalDate(),
        startTime = start,
        endTime = end,
        duration = durationMinutes,
        capacity = capacity,
        spotsRemaining = spotsRemaining,
        trainerId = trainerId,
        trainerName = null, // Not in available session DTO
        locationId = locationId,
        locationName = null, // Not in available session DTO
        isBooked = isBooked,
        bookingId = bookingId,
        isBookable = isBookable,
        bookingError = bookingError
    )
}
