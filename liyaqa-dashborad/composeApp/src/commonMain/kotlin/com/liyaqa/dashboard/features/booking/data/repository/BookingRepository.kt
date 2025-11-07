package com.liyaqa.dashboard.features.booking.data.repository

import com.liyaqa.dashboard.core.data.BaseRepository
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.domain.map
import com.liyaqa.dashboard.core.network.NetworkConfig
import com.liyaqa.dashboard.features.booking.data.dto.*
import com.liyaqa.dashboard.features.booking.domain.model.Booking
import com.liyaqa.dashboard.features.booking.domain.model.ResourceAvailability
import io.ktor.client.HttpClient

/**
 * Repository for booking operations
 */
class BookingRepository(
    httpClient: HttpClient
) : BaseRepository(httpClient) {

    suspend fun getBookings(
        page: Int = 0,
        size: Int = 20,
        status: String? = null,
        resourceType: String? = null,
        date: String? = null
    ): Result<BookingPageResponse> {
        val params = buildMap {
            put("page", page.toString())
            put("size", size.toString())
            status?.let { put("status", it) }
            resourceType?.let { put("resourceType", it) }
            date?.let { put("date", it) }
        }
        return get(NetworkConfig.Endpoints.BOOKINGS, params)
    }

    suspend fun getBookingById(id: String): Result<Booking> {
        return get<BookingDto>("${NetworkConfig.Endpoints.BOOKINGS}/$id")
            .map { it.toDomain() }
    }

    suspend fun createBooking(request: CreateBookingRequest): Result<Booking> {
        return post<BookingDto, CreateBookingRequest>(
            NetworkConfig.Endpoints.BOOKINGS,
            request
        ).map { it.toDomain() }
    }

    suspend fun updateBooking(id: String, request: UpdateBookingRequest): Result<Booking> {
        return put<BookingDto, UpdateBookingRequest>(
            "${NetworkConfig.Endpoints.BOOKINGS}/$id",
            request
        ).map { it.toDomain() }
    }

    suspend fun cancelBooking(id: String): Result<Booking> {
        return post<BookingDto, Unit>(
            "${NetworkConfig.Endpoints.BOOKINGS}/$id/cancel",
            Unit
        ).map { it.toDomain() }
    }

    suspend fun checkIn(id: String): Result<Booking> {
        return post<BookingDto, Unit>(
            "${NetworkConfig.Endpoints.BOOKINGS}/$id/check-in",
            Unit
        ).map { it.toDomain() }
    }

    suspend fun checkOut(id: String): Result<Booking> {
        return post<BookingDto, Unit>(
            "${NetworkConfig.Endpoints.BOOKINGS}/$id/check-out",
            Unit
        ).map { it.toDomain() }
    }

    suspend fun getAvailability(
        resourceId: String,
        date: String
    ): Result<ResourceAvailability> {
        val params = mapOf(
            "resourceId" to resourceId,
            "date" to date
        )
        return get<ResourceAvailabilityDto>(
            "${NetworkConfig.Endpoints.BOOKINGS}/availability",
            params
        ).map { it.toDomain() }
    }
}
