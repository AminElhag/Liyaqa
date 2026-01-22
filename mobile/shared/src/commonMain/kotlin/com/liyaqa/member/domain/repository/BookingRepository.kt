package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.AvailableSession
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.PagedResult

/**
 * Repository for booking and session operations.
 * Handles class bookings and session availability.
 */
interface BookingRepository {

    /**
     * Fetches upcoming bookings for the current member.
     *
     * @param page The page number (0-indexed)
     * @param size The number of items per page
     */
    suspend fun getUpcomingBookings(
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResult<Booking>>

    /**
     * Fetches past bookings for the current member.
     *
     * @param page The page number (0-indexed)
     * @param size The number of items per page
     */
    suspend fun getPastBookings(
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResult<Booking>>

    /**
     * Fetches available sessions for booking.
     *
     * @param days Number of days ahead to search (default 7)
     * @param classId Optional filter by class ID
     * @param locationId Optional filter by location ID
     */
    suspend fun getAvailableSessions(
        days: Int = 7,
        classId: String? = null,
        locationId: String? = null
    ): Result<List<AvailableSession>>

    /**
     * Books a session for the current member.
     *
     * @param sessionId The ID of the session to book
     * @return The created booking
     */
    suspend fun bookSession(sessionId: String): Result<Booking>

    /**
     * Cancels a booking.
     *
     * @param bookingId The ID of the booking to cancel
     */
    suspend fun cancelBooking(bookingId: String): Result<Unit>
}
