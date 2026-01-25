package com.liyaqa.staff.data.repository

import com.liyaqa.staff.data.remote.api.StaffApi
import com.liyaqa.staff.domain.model.ClassSession
import com.liyaqa.staff.domain.model.SessionBooking
import com.liyaqa.staff.domain.model.TodaySessions
import com.liyaqa.staff.domain.repository.SessionRepository
import com.liyaqa.staff.util.Result

class SessionRepositoryImpl(
    private val api: StaffApi
) : SessionRepository {

    override suspend fun getTodaySessions(): Result<TodaySessions> {
        return try {
            Result.Success(api.getTodaySessions())
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getSessionById(id: String): Result<ClassSession> {
        return try {
            Result.Success(api.getSessionById(id))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getSessionBookings(sessionId: String): Result<List<SessionBooking>> {
        return try {
            Result.Success(api.getSessionBookings(sessionId))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun markBookingAttended(bookingId: String): Result<SessionBooking> {
        return try {
            Result.Success(api.markBookingAttended(bookingId))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun markBookingNoShow(bookingId: String): Result<SessionBooking> {
        return try {
            Result.Success(api.markBookingNoShow(bookingId))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
