package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.MemberApi
import com.liyaqa.member.data.remote.api.QrApi
import com.liyaqa.member.domain.model.Attendance
import com.liyaqa.member.domain.model.CheckInStatus
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.QrCheckInResult
import com.liyaqa.member.domain.model.QrCode
import com.liyaqa.member.domain.model.SelfCheckInRequest
import com.liyaqa.member.domain.repository.AttendanceRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class AttendanceRepositoryImpl(
    private val memberApi: MemberApi,
    private val qrApi: QrApi
) : AttendanceRepository {

    // Cache for attendance records
    private var cachedAttendance: List<Attendance>? = null

    override fun getAttendanceHistory(page: Int, size: Int): Flow<Result<PagedResponse<Attendance>>> = flow {
        // Emit cached data if available (first page only)
        if (page == 0) {
            cachedAttendance?.let { cached ->
                emit(Result.success(PagedResponse(
                    items = cached.take(size),
                    itemCount = minOf(size, cached.size),
                    hasMore = cached.size > size,
                    totalCount = cached.size
                )))
            }
        }

        // Fetch fresh data
        memberApi.getAttendance(page, size)
            .onSuccess { response ->
                if (page == 0) {
                    cachedAttendance = response.items
                }
                emit(Result.success(response))
            }
            .onError { error ->
                if (cachedAttendance == null || page > 0) {
                    emit(Result.error(
                        exception = error.exception,
                        message = error.message,
                        messageAr = error.messageAr
                    ))
                }
            }
    }

    override suspend fun getAttendanceByRange(
        startDate: String,
        endDate: String,
        page: Int,
        size: Int
    ): Result<PagedResponse<Attendance>> {
        return memberApi.getAttendanceByRange(startDate, endDate, page, size)
    }

    override suspend fun getQrCode(): Result<QrCode> {
        return qrApi.getPersonalQrCode()
    }

    override suspend fun selfCheckIn(locationId: String): Result<QrCheckInResult> {
        return qrApi.selfCheckIn(SelfCheckInRequest(locationId))
    }

    override suspend fun getCheckInStatus(): Result<CheckInStatus> {
        return qrApi.getCheckInStatus()
    }

    override suspend fun refreshAttendance(): Result<List<Attendance>> {
        return memberApi.getAttendance(0, 50).map { response ->
            cachedAttendance = response.items
            response.items
        }
    }
}
