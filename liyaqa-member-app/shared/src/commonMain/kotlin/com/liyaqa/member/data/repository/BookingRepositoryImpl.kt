package com.liyaqa.member.data.repository

import com.liyaqa.member.data.local.LiyaqaMemberDatabase
import com.liyaqa.member.data.remote.api.MemberApi
import com.liyaqa.member.data.remote.api.MobileApi
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingRequest
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.domain.model.LocalizedText
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.Session
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.datetime.Clock

class BookingRepositoryImpl(
    private val memberApi: MemberApi,
    private val mobileApi: MobileApi,
    private val database: LiyaqaMemberDatabase
) : BookingRepository {

    private val bookingQueries = database.bookingQueries
    private val sessionQueries = database.sessionQueries

    override fun getUpcomingBookings(page: Int, size: Int): Flow<Result<PagedResponse<Booking>>> = flow {
        val offset = page * size

        // Emit cached data first
        val cached = bookingQueries.selectUpcomingBookings(
            limit = size.toLong(),
            offset = offset.toLong()
        ).executeAsList()

        if (cached.isNotEmpty()) {
            val totalCount = bookingQueries.countUpcomingBookings().executeAsOne().toInt()
            emit(Result.success(PagedResponse(
                items = cached.map { it.toDomain() },
                itemCount = cached.size,
                hasMore = offset + cached.size < totalCount,
                totalCount = totalCount
            )))
        }

        // Fetch fresh data
        memberApi.getUpcomingBookings(page, size).onSuccess { response ->
            // Update cache
            if (page == 0) {
                bookingQueries.deleteUpcomingBookings()
            }
            response.items.forEach { booking ->
                insertBooking(booking, isUpcoming = true)
            }
            emit(Result.success(response))
        }.onError { error ->
            if (cached.isEmpty()) {
                emit(Result.error(
                    exception = error.exception,
                    message = error.message,
                    messageAr = error.messageAr
                ))
            }
        }
    }

    override suspend fun getPastBookings(page: Int, size: Int): Result<PagedResponse<Booking>> {
        return memberApi.getPastBookings(page, size).onSuccess { response ->
            if (page == 0) {
                bookingQueries.deletePastBookings()
            }
            response.items.forEach { booking ->
                insertBooking(booking, isUpcoming = false)
            }
        }
    }

    override suspend fun getAvailableSessions(
        classId: String?,
        locationId: String?,
        days: Int
    ): Result<List<Session>> {
        return mobileApi.getAvailableSessions(classId, locationId, days).onSuccess { sessions ->
            sessions.forEach { session ->
                sessionQueries.insertOrReplaceSession(
                    id = session.id,
                    classId = session.classId,
                    classNameEn = session.className.en,
                    classNameAr = session.className.ar,
                    trainerId = session.trainerId,
                    trainerNameEn = session.trainerName?.en,
                    trainerNameAr = session.trainerName?.ar,
                    date = session.date,
                    startTime = session.startTime,
                    endTime = session.endTime,
                    capacity = session.capacity.toLong(),
                    bookedCount = session.bookedCount.toLong(),
                    waitlistCount = session.waitlistCount.toLong(),
                    availableSpots = session.availableSpots.toLong(),
                    status = session.status.name,
                    locationId = session.locationId,
                    locationNameEn = session.locationName?.en,
                    locationNameAr = session.locationName?.ar,
                    syncedAt = Clock.System.now().toEpochMilliseconds()
                )
            }
        }
    }

    override suspend fun getSession(sessionId: String): Result<Session> {
        // Try cache first
        val cached = sessionQueries.selectSessionById(sessionId).executeAsOneOrNull()
        if (cached != null) {
            return Result.success(cached.toDomain())
        }

        // For single session, we might need a different API endpoint
        // For now, return error
        return Result.error(message = "Session not found")
    }

    override suspend fun bookSession(request: BookingRequest): Result<Booking> {
        return memberApi.bookSession(request).onSuccess { booking ->
            insertBooking(booking, isUpcoming = true)
        }
    }

    override suspend fun cancelBooking(bookingId: String): Result<Unit> {
        return memberApi.cancelBooking(bookingId).map {
            // Update cache
            bookingQueries.updateBookingStatus(
                status = BookingStatus.CANCELLED.name,
                syncedAt = Clock.System.now().toEpochMilliseconds(),
                id = bookingId
            )
        }
    }

    override suspend fun refreshUpcomingBookings(): Result<List<Booking>> {
        return memberApi.getUpcomingBookings(0, 50).map { response ->
            bookingQueries.deleteUpcomingBookings()
            response.items.forEach { booking ->
                insertBooking(booking, isUpcoming = true)
            }
            response.items
        }
    }

    private fun insertBooking(booking: Booking, isUpcoming: Boolean) {
        bookingQueries.insertOrReplaceBooking(
            id = booking.id,
            sessionId = booking.sessionId,
            sessionDate = booking.sessionDate,
            sessionStartTime = booking.sessionStartTime,
            sessionEndTime = booking.sessionEndTime,
            classNameEn = booking.className.en,
            classNameAr = booking.className.ar,
            trainerNameEn = booking.trainerName?.en,
            trainerNameAr = booking.trainerName?.ar,
            locationNameEn = booking.locationName?.en,
            locationNameAr = booking.locationName?.ar,
            status = booking.status.name,
            waitlistPosition = booking.waitlistPosition?.toLong(),
            checkedInAt = booking.checkedInAt,
            createdAt = booking.createdAt,
            isUpcoming = if (isUpcoming) 1L else 0L,
            syncedAt = Clock.System.now().toEpochMilliseconds()
        )
    }

    private fun com.liyaqa.member.data.local.BookingEntity.toDomain() = Booking(
        id = id,
        sessionId = sessionId,
        sessionDate = sessionDate,
        sessionStartTime = sessionStartTime,
        sessionEndTime = sessionEndTime,
        className = LocalizedText(classNameEn, classNameAr),
        trainerName = trainerNameEn?.let { LocalizedText(it, trainerNameAr) },
        locationName = locationNameEn?.let { LocalizedText(it, locationNameAr) },
        status = BookingStatus.valueOf(status),
        waitlistPosition = waitlistPosition?.toInt(),
        checkedInAt = checkedInAt,
        createdAt = createdAt
    )

    private fun com.liyaqa.member.data.local.SessionEntity.toDomain() = Session(
        id = id,
        classId = classId,
        className = LocalizedText(classNameEn, classNameAr),
        trainerId = trainerId,
        trainerName = trainerNameEn?.let { LocalizedText(it, trainerNameAr) },
        date = date,
        startTime = startTime,
        endTime = endTime,
        capacity = capacity.toInt(),
        bookedCount = bookedCount.toInt(),
        waitlistCount = waitlistCount.toInt(),
        availableSpots = availableSpots.toInt(),
        status = com.liyaqa.member.domain.model.SessionStatus.valueOf(status),
        locationId = locationId,
        locationName = locationNameEn?.let { LocalizedText(it, locationNameAr) }
    )
}
