package com.liyaqa.staff.data.repository

import com.liyaqa.staff.data.remote.api.StaffApi
import com.liyaqa.staff.domain.model.FacilityBooking
import com.liyaqa.staff.domain.model.TodayFacilityBookings
import com.liyaqa.staff.domain.repository.FacilityBookingRepository
import com.liyaqa.staff.util.Result

class FacilityBookingRepositoryImpl(
    private val api: StaffApi
) : FacilityBookingRepository {

    override suspend fun getTodayBookings(): Result<TodayFacilityBookings> {
        return try {
            Result.Success(api.getTodayFacilityBookings())
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getBookingById(id: String): Result<FacilityBooking> {
        return try {
            Result.Success(api.getFacilityBookingById(id))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun markBookingCheckedIn(bookingId: String): Result<FacilityBooking> {
        return try {
            Result.Success(api.markFacilityBookingCheckedIn(bookingId))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun cancelBooking(bookingId: String): Result<FacilityBooking> {
        return try {
            Result.Success(api.cancelFacilityBooking(bookingId))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
