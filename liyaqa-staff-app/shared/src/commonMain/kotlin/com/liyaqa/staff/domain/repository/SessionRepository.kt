package com.liyaqa.staff.domain.repository

import com.liyaqa.staff.domain.model.ClassSession
import com.liyaqa.staff.domain.model.SessionBooking
import com.liyaqa.staff.domain.model.TodaySessions
import com.liyaqa.staff.util.Result

interface SessionRepository {
    suspend fun getTodaySessions(): Result<TodaySessions>
    suspend fun getSessionById(id: String): Result<ClassSession>
    suspend fun getSessionBookings(sessionId: String): Result<List<SessionBooking>>
    suspend fun markBookingAttended(bookingId: String): Result<SessionBooking>
    suspend fun markBookingNoShow(bookingId: String): Result<SessionBooking>
}
