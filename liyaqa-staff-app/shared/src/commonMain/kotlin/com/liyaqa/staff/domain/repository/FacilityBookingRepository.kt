package com.liyaqa.staff.domain.repository

import com.liyaqa.staff.domain.model.FacilityBooking
import com.liyaqa.staff.domain.model.TodayFacilityBookings
import com.liyaqa.staff.util.Result

interface FacilityBookingRepository {
    suspend fun getTodayBookings(): Result<TodayFacilityBookings>
    suspend fun getBookingById(id: String): Result<FacilityBooking>
    suspend fun markBookingCheckedIn(bookingId: String): Result<FacilityBooking>
    suspend fun cancelBooking(bookingId: String): Result<FacilityBooking>
}
