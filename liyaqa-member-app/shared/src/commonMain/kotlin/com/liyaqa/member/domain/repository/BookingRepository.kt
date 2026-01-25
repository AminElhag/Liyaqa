package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingRequest
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.Session
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for booking and session operations
 */
interface BookingRepository {
    /**
     * Get upcoming bookings (offline-first)
     */
    fun getUpcomingBookings(page: Int = 0, size: Int = 20): Flow<Result<PagedResponse<Booking>>>

    /**
     * Get past bookings
     */
    suspend fun getPastBookings(page: Int = 0, size: Int = 20): Result<PagedResponse<Booking>>

    /**
     * Get available sessions for booking
     */
    suspend fun getAvailableSessions(
        classId: String? = null,
        locationId: String? = null,
        days: Int = 7
    ): Result<List<Session>>

    /**
     * Get session by ID
     */
    suspend fun getSession(sessionId: String): Result<Session>

    /**
     * Book a session
     */
    suspend fun bookSession(request: BookingRequest): Result<Booking>

    /**
     * Cancel a booking
     */
    suspend fun cancelBooking(bookingId: String): Result<Unit>

    /**
     * Force refresh upcoming bookings from server
     */
    suspend fun refreshUpcomingBookings(): Result<List<Booking>>
}
