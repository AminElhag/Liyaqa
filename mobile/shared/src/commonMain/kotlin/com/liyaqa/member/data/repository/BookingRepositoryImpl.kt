package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.dto.BookSessionRequestDto
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.AvailableSession
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.PagedResult
import com.liyaqa.member.domain.repository.BookingRepository

/**
 * Implementation of BookingRepository using MemberApiService.
 */
class BookingRepositoryImpl(
    private val api: MemberApiService
) : BookingRepository {

    override suspend fun getUpcomingBookings(
        page: Int,
        size: Int
    ): Result<PagedResult<Booking>> {
        return api.getUpcomingBookings(page, size).toResult { response ->
            PagedResult(
                items = response.items.map { it.toDomain() },
                hasMore = response.hasMore,
                totalCount = response.totalCount
            )
        }
    }

    override suspend fun getPastBookings(
        page: Int,
        size: Int
    ): Result<PagedResult<Booking>> {
        return api.getPastBookings(page, size).toResult { response ->
            PagedResult(
                items = response.items.map { it.toDomain() },
                hasMore = response.hasMore,
                totalCount = response.totalCount
            )
        }
    }

    override suspend fun getAvailableSessions(
        days: Int,
        classId: String?,
        locationId: String?
    ): Result<List<AvailableSession>> {
        return api.getAvailableSessions(days, classId, locationId).toResult { list ->
            list.map { it.toDomain() }
        }
    }

    override suspend fun bookSession(sessionId: String): Result<Booking> {
        return api.bookSession(BookSessionRequestDto(sessionId = sessionId)).toResult { it.toDomain() }
    }

    override suspend fun cancelBooking(bookingId: String): Result<Unit> {
        return api.cancelBooking(bookingId).toResult { }
    }
}
